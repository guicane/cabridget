"use server"

import { ensureMonthsForYear, sortMonths } from "./months"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getNetWorthData(year: number) {
  const accounts = await prisma.investmentAccount.findMany({
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
    where: { identifier: { in: identifiers } },
    include: {
      creditCardStatements: true
    }
  })
  const months = sortMonths(rawMonths, identifiers)

  const creditCards = await prisma.creditCard.findMany({
    where: { active: true },
    orderBy: { name: "asc" }
  })

  return { accounts, months, creditCards }
}

import { AccountCategory } from "@prisma/client"

export async function addInvestmentAccount(formData: FormData) {
  const name = formData.get("name") as string
  const category = formData.get("category") as AccountCategory
  if (!name) throw new Error("Name is required")

  await prisma.investmentAccount.create({
    data: { name, category: category || "Savings" }
  })

  revalidatePath("/net-worth")
}

export async function deleteInvestmentAccount(id: string) {
  await prisma.investmentAccount.delete({
    where: { id }
  })
  revalidatePath("/net-worth")
}

export async function toggleInvestmentAccountActive(id: string, active: boolean) {
  await prisma.investmentAccount.update({
    where: { id },
    data: { active }
  })
  revalidatePath("/net-worth")
}

export async function upsertSnapshot(accountId: string, monthId: string, balanceStr: string) {
  const balance = parseFloat(balanceStr)
  if (isNaN(balance)) throw new Error("Invalid balance")

  await prisma.investmentSnapshot.upsert({
    where: {
      accountId_monthId: {
        accountId,
        monthId
      }
    },
    update: { balance },
    create: {
      accountId,
      monthId,
      balance
    }
  })

  revalidatePath("/net-worth")
}
