"use server"

import { ensureMonthsForYear, sortMonths } from "./months"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getCreditCardsData(year: number) {
  const identifiers = await ensureMonthsForYear(year)
  
  const rawMonths = await prisma.month.findMany({
    where: { identifier: { in: identifiers } }
  })
  const months = sortMonths(rawMonths, identifiers)

  const cards = await prisma.creditCard.findMany({
    include: {
      statements: {
        where: {
          monthId: { in: months.map((m: any) => m.id) }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  })

  return { cards, months }
}

export async function upsertCreditCardStatement(creditCardId: string, monthId: string, value: string) {
  const balance = parseFloat(value)
  if (isNaN(balance)) return

  const existing = await prisma.creditCardStatement.findUnique({
    where: { creditCardId_monthId: { creditCardId, monthId } }
  })

  if (existing) {
    await prisma.creditCardStatement.update({
      where: { id: existing.id },
      data: { balance }
    })
  } else {
    await prisma.creditCardStatement.create({
      data: {
        creditCardId,
        monthId,
        balance
      }
    })
  }

  revalidatePath("/credit-cards", "layout")
  revalidatePath("/monthly-bills", "layout")
  revalidatePath("/net-worth", "layout")
  revalidatePath("/cash-flow", "layout")
}
