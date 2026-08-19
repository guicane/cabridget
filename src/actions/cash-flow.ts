"use server"

import { ensureMonthsForYear, sortMonths } from "./months"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getMonths(year: number) {
  const identifiers = await ensureMonthsForYear(year)
  const rawMonths = await prisma.month.findMany({
    where: { identifier: { in: identifiers } },
    include: {
      incomes: true,
      monthlyBills: true,
      creditCardStatements: {
        include: {
          creditCard: true
        }
      }
    }
  })
  return sortMonths(rawMonths, identifiers)
}

export async function getMonthById(id: string) {
  return prisma.month.findUnique({
    where: { id },
    include: {
      incomes: true,
      monthlyBills: true,
      creditCardStatements: {
        include: {
          creditCard: true
        }
      }
    }
  })
}

export async function getOrCreateMonth(identifier: string) {
  const month = await prisma.month.upsert({
    where: { identifier },
    update: {},
    create: { identifier },
  })
  
  revalidatePath("/cash-flow", "layout")
  return month
}

export async function upsertCashFlowRow(monthId: string, type: "Income" | "Bill" | "CreditCard", description: string, amountStr: string) {
  const amount = parseFloat(amountStr)
  const isInvalid = !amountStr || isNaN(amount)

  if (type === "Income") {
    const existing = await prisma.income.findFirst({
      where: { monthId, source: description }
    })
    if (isInvalid) {
      if (existing) await prisma.income.delete({ where: { id: existing.id } })
    } else {
      if (existing) {
        await prisma.income.update({ where: { id: existing.id }, data: { amount } })
      } else {
        await prisma.income.create({ data: { monthId, source: description, amount } })
      }
    }
  } else if (type === "Bill") {
    const existing = await prisma.monthlyBill.findFirst({
      where: { monthId, name: description }
    })
    if (isInvalid) {
      if (existing) await prisma.monthlyBill.delete({ where: { id: existing.id } })
    } else {
      if (existing) {
        await prisma.monthlyBill.update({ where: { id: existing.id }, data: { amount } })
      } else {
        await prisma.monthlyBill.create({ data: { monthId, name: description, amount } })
      }
    }
  } else if (type === "CreditCard") {
    let card = await prisma.creditCard.findUnique({ where: { name: description } })
    if (!card && !isInvalid) {
      card = await prisma.creditCard.create({ data: { name: description } })
    }
    if (card) {
      const existing = await prisma.creditCardStatement.findUnique({
        where: { creditCardId_monthId: { creditCardId: card.id, monthId } }
      })
      if (isInvalid) {
        if (existing) await prisma.creditCardStatement.delete({ where: { id: existing.id } })
      } else {
        if (existing) {
          await prisma.creditCardStatement.update({ where: { id: existing.id }, data: { balance: amount } })
        } else {
          await prisma.creditCardStatement.create({ data: { creditCardId: card.id, monthId, balance: amount } })
        }
      }
    }
  }

  revalidatePath("/cash-flow", "layout")
}

export async function deleteCashFlowRow(type: "Income" | "Bill" | "CreditCard", description: string) {
  if (type === "Income") {
    await prisma.income.deleteMany({ where: { source: description } })
  } else if (type === "Bill") {
    await prisma.monthlyBill.deleteMany({ where: { name: description } })
  } else if (type === "CreditCard") {
    const card = await prisma.creditCard.findUnique({ where: { name: description } })
    if (card) {
      await prisma.creditCardStatement.deleteMany({ where: { creditCardId: card.id } })
    }
  }
  revalidatePath("/cash-flow", "layout")
}

export async function addCashFlowRow(formData: FormData) {
  const type = formData.get("type") as "Income" | "Bill" | "CreditCard"
  const description = formData.get("description") as string
  
  if (!type || !description) return

  const latestMonth = await prisma.month.findFirst({
    orderBy: { createdAt: 'desc' }
  })

  if (!latestMonth) return

  if (type === "Income") {
    await prisma.income.create({
      data: { monthId: latestMonth.id, source: description, amount: 0 }
    })
  } else if (type === "Bill") {
    await prisma.monthlyBill.create({
      data: { monthId: latestMonth.id, name: description, amount: 0 }
    })
  } else if (type === "CreditCard") {
    let card = await prisma.creditCard.findUnique({ where: { name: description } })
    if (!card) {
      card = await prisma.creditCard.create({ data: { name: description } })
    }
    const existing = await prisma.creditCardStatement.findUnique({
      where: { creditCardId_monthId: { creditCardId: card.id, monthId: latestMonth.id } }
    })
    if (!existing) {
      await prisma.creditCardStatement.create({
        data: { creditCardId: card.id, monthId: latestMonth.id, balance: 0 }
      })
    }
  }

  revalidatePath("/cash-flow", "layout")
}
