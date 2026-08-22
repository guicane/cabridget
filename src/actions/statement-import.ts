"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentHouseholdId } from "@/lib/household"
import { parseStatementCsv, matchTransactions, type MatchedGroup, type UnmatchedGroup } from "@/lib/statement-csv"
import { ensureMonthsForYear } from "./months"
import { revalidatePath } from "next/cache"

export async function getMerchantMappings() {
  const householdId = await getCurrentHouseholdId()
  return prisma.merchantMapping.findMany({
    where: { householdId },
    orderBy: { pattern: "asc" }
  })
}

export async function addMerchantMapping(formData: FormData) {
  const householdId = await getCurrentHouseholdId()
  const pattern = (formData.get("pattern") as string || "").trim()
  const billName = (formData.get("billName") as string || "").trim()
  const billCompany = (formData.get("billCompany") as string || "").trim()

  if (!pattern || !billName) return

  const mapping = await prisma.merchantMapping.upsert({
    where: { householdId_pattern: { householdId, pattern } },
    update: { billName, billCompany: billCompany || null },
    create: { householdId, pattern, billName, billCompany: billCompany || null }
  })

  revalidatePath("/monthly-bills", "layout")
  return mapping
}

export async function deleteMerchantMapping(id: string) {
  const householdId = await getCurrentHouseholdId()
  await prisma.merchantMapping.deleteMany({ where: { id, householdId } })
  revalidatePath("/monthly-bills", "layout")
}

export type MatchedRow = MatchedGroup
export type UnmatchedRow = UnmatchedGroup

export type ImportPreview = {
  matched: MatchedGroup[]
  unmatched: UnmatchedGroup[]
}

export async function previewStatementImport(formData: FormData): Promise<ImportPreview | { error: string }> {
  const householdId = await getCurrentHouseholdId()
  const file = formData.get("file") as File | null
  if (!file || file.size === 0) return { error: "No file provided." }

  const text = await file.text()
  const result = parseStatementCsv(text)
  if (!result.ok) return { error: result.error }

  const mappings = await prisma.merchantMapping.findMany({ where: { householdId } })

  return matchTransactions(result.transactions, mappings)
}

export async function commitStatementImport(rows: MatchedGroup[]) {
  const householdId = await getCurrentHouseholdId()

  const years = new Set(rows.map(r => parseInt(r.monthIdentifier.split(" ")[1], 10)))
  for (const year of years) {
    if (!isNaN(year)) await ensureMonthsForYear(year)
  }

  for (const row of rows) {
    const month = await prisma.month.findFirst({ where: { householdId, identifier: row.monthIdentifier } })
    if (!month) continue

    const existing = await prisma.monthlyBill.findFirst({
      where: { householdId, monthId: month.id, name: row.billName, company: row.billCompany }
    })

    if (existing) {
      await prisma.monthlyBill.update({ where: { id: existing.id }, data: { amount: row.amount } })
    } else {
      await prisma.monthlyBill.create({
        data: { householdId, monthId: month.id, name: row.billName, company: row.billCompany, amount: row.amount }
      })
    }
  }

  revalidatePath("/monthly-bills", "layout")
}
