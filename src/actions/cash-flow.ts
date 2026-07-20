"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { EntryType } from "@prisma/client"

export async function getMonths() {
  return prisma.month.findMany({
    include: {
      ledgerEntries: {
        orderBy: [
          { orderIndex: "asc" },
          { amount: "desc" }
        ]
      }
    },
    orderBy: { createdAt: "desc" }
  })
}

export async function getMonthById(id: string) {
  return prisma.month.findUnique({
    where: { id },
    include: {
      ledgerEntries: {
        orderBy: [
          { orderIndex: "asc" },
          { amount: "desc" }
        ]
      }
    }
  })
}

export async function updateLedgerEntryOrder(updates: { id: string, orderIndex: number }[]) {
  await prisma.$transaction(
    updates.map((update) => 
      prisma.ledgerEntry.update({
        where: { id: update.id },
        data: { orderIndex: update.orderIndex }
      })
    )
  )
  
  revalidatePath("/cash-flow", "layout")
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

export async function addLedgerEntry(formData: FormData) {
  const monthId = formData.get("monthId") as string
  const type = formData.get("type") as EntryType
  const description = formData.get("description") as string
  const amountStr = formData.get("amount") as string
  
  if (!monthId || !type || !description || !amountStr) {
    throw new Error("Missing required fields")
  }

  const amount = parseFloat(amountStr)
  if (isNaN(amount)) {
    throw new Error("Invalid amount")
  }

  await prisma.ledgerEntry.create({
    data: {
      monthId,
      type,
      description,
      amount,
    },
  })

  revalidatePath("/cash-flow", "layout")
}

export async function deleteLedgerEntry(id: string) {
  await prisma.ledgerEntry.delete({
    where: { id },
  })
  
  revalidatePath("/cash-flow", "layout")
}

export async function upsertLedgerEntry(monthId: string, type: EntryType, description: string, amountStr: string) {
  const amount = parseFloat(amountStr)
  
  // Find if an entry already exists for this exact month, type, and description
  const existing = await prisma.ledgerEntry.findFirst({
    where: { monthId, type, description }
  })

  // If empty string or NaN is passed, and we want to delete it or set to 0
  if (!amountStr || isNaN(amount)) {
    if (existing) {
      await prisma.ledgerEntry.delete({ where: { id: existing.id } })
    }
  } else {
    if (existing) {
      await prisma.ledgerEntry.update({
        where: { id: existing.id },
        data: { amount }
      })
    } else {
      await prisma.ledgerEntry.create({
        data: { monthId, type, description, amount }
      })
    }
  }

  revalidatePath("/cash-flow", "layout")
}

export async function deleteCashFlowRow(type: EntryType, description: string) {
  await prisma.ledgerEntry.deleteMany({
    where: { type, description }
  })
  revalidatePath("/cash-flow", "layout")
}

export async function addCashFlowRow(formData: FormData) {
  const type = formData.get("type") as EntryType
  const description = formData.get("description") as string
  
  if (!type || !description) return

  // Find the most recent month to attach the initial 0.00 entry to
  // so that the row appears in the grid.
  const latestMonth = await prisma.month.findFirst({
    orderBy: { createdAt: 'desc' }
  })

  if (!latestMonth) return

  await prisma.ledgerEntry.create({
    data: {
      monthId: latestMonth.id,
      type,
      description,
      amount: 0
    }
  })

  revalidatePath("/cash-flow", "layout")
}
