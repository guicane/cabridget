"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentHouseholdId } from "@/lib/household"
import { parseStatementCsv, matchTransactions, type MatchedGroup, type UnmatchedGroup } from "@/lib/statement-csv"
import { parseStatementPdf } from "@/lib/statement-pdf"
import { ensureMonthsForYear } from "./months"
import { MerchantMappingType } from "@prisma/client"
import { revalidatePath, refresh } from "next/cache"

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
  const type = (formData.get("type") as string) === "Income" ? MerchantMappingType.Income : MerchantMappingType.Bill
  const targetName = (formData.get("targetName") as string || "").trim()
  const targetCompany = type === MerchantMappingType.Bill ? (formData.get("targetCompany") as string || "").trim() : ""

  if (!pattern || !targetName) return

  const mapping = await prisma.merchantMapping.upsert({
    where: { householdId_pattern: { householdId, pattern } },
    update: { type, targetName, targetCompany: targetCompany || null },
    create: { householdId, pattern, type, targetName, targetCompany: targetCompany || null }
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

  const month = formData.get("month") as string | null
  const year = formData.get("year") as string | null
  if (!month || !year) return { error: "Select a month and year to import into." }
  const monthIdentifier = `${month} ${year}`

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  const result = isPdf
    ? await parseStatementPdf(Buffer.from(await file.arrayBuffer()))
    : parseStatementCsv(await file.text())
  if (!result.ok) return { error: result.error }

  const mappings = await prisma.merchantMapping.findMany({ where: { householdId } })

  return matchTransactions(result.transactions, mappings, monthIdentifier)
}

// Calls refresh() (next/cache) in addition to revalidatePath: this action
// is invoked from a modal nested a few components deep, and on this
// Next.js version revalidatePath alone didn't reliably make the
// currently-mounted Monthly Cashflow sheet show the newly imported rows
// without a manual reload. refresh() is the documented, explicit way to
// force the client router to refresh from inside a Server Action.
export async function commitStatementImport(rows: MatchedGroup[]) {
  const householdId = await getCurrentHouseholdId()

  const years = new Set(rows.map(r => parseInt(r.monthIdentifier.split(" ")[1], 10)))
  for (const year of years) {
    if (!isNaN(year)) await ensureMonthsForYear(year)
  }

  for (const row of rows) {
    const month = await prisma.month.findFirst({ where: { householdId, identifier: row.monthIdentifier } })
    if (!month) continue

    if (row.kind === "Bill") {
      const existing = await prisma.monthlyBill.findFirst({
        where: { householdId, monthId: month.id, name: row.targetName, company: row.targetCompany }
      })

      if (existing) {
        await prisma.monthlyBill.update({ where: { id: existing.id }, data: { amount: row.amount } })
      } else {
        await prisma.monthlyBill.create({
          data: { householdId, monthId: month.id, name: row.targetName, company: row.targetCompany, amount: row.amount }
        })
      }
    } else {
      const existing = await prisma.income.findFirst({
        where: { householdId, monthId: month.id, source: row.targetName }
      })

      if (existing) {
        await prisma.income.update({ where: { id: existing.id }, data: { amount: row.amount } })
      } else {
        await prisma.income.create({
          data: { householdId, monthId: month.id, source: row.targetName, amount: row.amount }
        })
      }
    }
  }

  revalidatePath("/monthly-bills", "layout")
  refresh()
}
