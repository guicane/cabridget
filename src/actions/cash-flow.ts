"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { EntryType } from "@prisma/client"

export async function getMonths() {
  return prisma.month.findMany({
    include: {
      ledgerEntries: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })
}

export async function getOrCreateMonth(identifier: string) {
  const month = await prisma.month.upsert({
    where: { identifier },
    update: {},
    create: { identifier },
  })
  
  revalidatePath("/cash-flow")
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

  revalidatePath("/cash-flow")
}

export async function deleteLedgerEntry(id: string) {
  await prisma.ledgerEntry.delete({
    where: { id },
  })
  
  revalidatePath("/cash-flow")
}
