"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getNetWorthData() {
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

  const months = await prisma.month.findMany({
    orderBy: {
      createdAt: "desc"
    }
  })

  return { accounts, months }
}

export async function addInvestmentAccount(formData: FormData) {
  const name = formData.get("name") as string
  if (!name) throw new Error("Name is required")

  await prisma.investmentAccount.create({
    data: { name }
  })

  revalidatePath("/net-worth")
}

export async function deleteInvestmentAccount(id: string) {
  await prisma.investmentAccount.delete({
    where: { id }
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
