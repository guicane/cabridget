"use server"

import { ensureMonthsForYear, sortMonths } from "./months"

import { prisma } from "@/lib/prisma"
import { getCurrentHouseholdId } from "@/lib/household"
import { revalidatePath } from "next/cache"

export async function getNetWorthData(year: number) {
  const householdId = await getCurrentHouseholdId()

  const accounts = await prisma.investmentAccount.findMany({
    where: { householdId },
    include: {
      snapshots: {
        include: {
          month: true
        },
        orderBy: {
          month: {
            createdAt: "desc"
          }
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  })

  const identifiers = await ensureMonthsForYear(year)
  const rawMonths = await prisma.month.findMany({
    where: { householdId, identifier: { in: identifiers } },
    include: {
      creditCardStatements: true
    }
  })
  const months = sortMonths(rawMonths, identifiers)

  const creditCards = await prisma.creditCard.findMany({
    where: { householdId, active: true },
    orderBy: { name: "asc" }
  })

  return { accounts, months, creditCards }
}

import { AccountCategory } from "@prisma/client"

export async function addInvestmentAccount(formData: FormData) {
  const householdId = await getCurrentHouseholdId()
  const name = formData.get("name") as string
  const category = formData.get("category") as AccountCategory
  if (!name) throw new Error("Name is required")

  await prisma.investmentAccount.create({
    data: { householdId, name, category: category || "Savings" }
  })

  revalidatePath("/net-worth")
}

export async function deleteInvestmentAccount(id: string) {
  const householdId = await getCurrentHouseholdId()
  await prisma.investmentAccount.deleteMany({
    where: { id, householdId }
  })
  revalidatePath("/net-worth")
}

export async function toggleInvestmentAccountActive(id: string, active: boolean) {
  const householdId = await getCurrentHouseholdId()
  await prisma.investmentAccount.updateMany({
    where: { id, householdId },
    data: { active }
  })
  revalidatePath("/net-worth")
}

export async function upsertSnapshot(accountId: string, monthId: string, balanceStr: string) {
  const householdId = await getCurrentHouseholdId()
  const balance = parseFloat(balanceStr)
  if (isNaN(balance)) throw new Error("Invalid balance")

  const account = await prisma.investmentAccount.findFirst({ where: { id: accountId, householdId } })
  if (!account) throw new Error("Account not found")

  const existing = await prisma.investmentSnapshot.findUnique({
    where: { accountId_monthId: { accountId, monthId } }
  })

  if (existing) {
    await prisma.investmentSnapshot.update({ where: { id: existing.id }, data: { balance } })
  } else {
    await prisma.investmentSnapshot.create({ data: { householdId, accountId, monthId, balance } })
  }

  revalidatePath("/net-worth")
}
