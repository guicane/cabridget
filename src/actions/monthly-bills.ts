"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getRecurringBills() {
  return prisma.recurringBill.findMany({
    orderBy: [
      { dayOfMonth: { sort: 'asc', nulls: 'last' } },
      { amount: 'desc' }
    ]
  })
}

export async function addRecurringBill(formData: FormData) {
  const name = formData.get("name") as string
  const company = formData.get("company") as string
  const amountStr = formData.get("amount") as string
  const dayOfMonthStr = formData.get("dayOfMonth") as string

  if (!name || !amountStr) return

  const amount = parseFloat(amountStr)
  if (isNaN(amount)) return

  const dayOfMonth = dayOfMonthStr ? parseInt(dayOfMonthStr, 10) : null

  await prisma.recurringBill.create({
    data: {
      name,
      company: company || null,
      amount,
      dayOfMonth: isNaN(dayOfMonth as number) ? null : dayOfMonth
    }
  })

  revalidatePath("/monthly-bills", "layout")
}

export async function deleteRecurringBill(id: string) {
  await prisma.recurringBill.delete({
    where: { id }
  })
  
  revalidatePath("/monthly-bills", "layout")
}

export async function updateRecurringBill(id: string, field: string, value: string) {
  if (field === 'amount') {
    const amount = parseFloat(value)
    if (!isNaN(amount)) {
      await prisma.recurringBill.update({
        where: { id },
        data: { amount }
      })
    }
  } else if (field === 'dayOfMonth') {
    const dayOfMonth = parseInt(value, 10)
    await prisma.recurringBill.update({
      where: { id },
      data: { dayOfMonth: isNaN(dayOfMonth) ? null : dayOfMonth }
    })
  } else if (field === 'name') {
    await prisma.recurringBill.update({
      where: { id },
      data: { name: value }
    })
  } else if (field === 'company') {
    await prisma.recurringBill.update({
      where: { id },
      data: { company: value || null }
    })
  }

  revalidatePath("/monthly-bills", "layout")
}

export async function getMonths() {
  return prisma.month.findMany({
    orderBy: { createdAt: "desc" }
  })
}

export async function getMonthlyBills(monthId: string) {
  return prisma.monthlyBill.findMany({
    where: { monthId },
    orderBy: [
      { dayOfMonth: { sort: 'asc', nulls: 'last' } },
      { amount: 'desc' }
    ]
  })
}

export async function addMonthlyBill(formData: FormData) {
  const monthId = formData.get("monthId") as string
  const name = formData.get("name") as string
  const company = formData.get("company") as string
  const amountStr = formData.get("amount") as string
  const dayOfMonthStr = formData.get("dayOfMonth") as string

  if (!monthId || !name || !amountStr) return

  const amount = parseFloat(amountStr)
  if (isNaN(amount)) return

  const dayOfMonth = dayOfMonthStr ? parseInt(dayOfMonthStr, 10) : null

  await prisma.monthlyBill.create({
    data: {
      monthId,
      name,
      company: company || null,
      amount,
      dayOfMonth: isNaN(dayOfMonth as number) ? null : dayOfMonth
    }
  })

  revalidatePath("/monthly-bills", "layout")
}

export async function deleteMonthlyBill(id: string) {
  await prisma.monthlyBill.delete({
    where: { id }
  })
  
  revalidatePath("/monthly-bills", "layout")
}

export async function updateMonthlyBill(id: string, field: string, value: string | boolean) {
  if (field === 'amount') {
    const amount = parseFloat(value as string)
    if (!isNaN(amount)) {
      await prisma.monthlyBill.update({
        where: { id },
        data: { amount }
      })
    }
  } else if (field === 'dayOfMonth') {
    const dayOfMonth = parseInt(value as string, 10)
    await prisma.monthlyBill.update({
      where: { id },
      data: { dayOfMonth: isNaN(dayOfMonth) ? null : dayOfMonth }
    })
  } else if (field === 'name') {
    await prisma.monthlyBill.update({
      where: { id },
      data: { name: value as string }
    })
  } else if (field === 'company') {
    await prisma.monthlyBill.update({
      where: { id },
      data: { company: (value as string) || null }
    })
  } else if (field === 'isPaid') {
    await prisma.monthlyBill.update({
      where: { id },
      data: { isPaid: value as boolean }
    })
  }

  revalidatePath("/monthly-bills", "layout")
}

export async function copyTemplatesToMonth(monthId: string) {
  const templates = await prisma.recurringBill.findMany()
  if (templates.length === 0) return

  const existingBills = await prisma.monthlyBill.findMany({
    where: { monthId }
  })

  // Diff based on name and company to find missing ones
  const missingTemplates = templates.filter(t => 
    !existingBills.some(eb => eb.name === t.name && eb.company === t.company)
  )

  if (missingTemplates.length === 0) return

  const newBills = missingTemplates.map(t => ({
    monthId,
    name: t.name,
    company: t.company,
    amount: t.amount,
    dayOfMonth: t.dayOfMonth
  }))

  await prisma.monthlyBill.createMany({
    data: newBills
  })

  revalidatePath("/monthly-bills", "layout")
}
