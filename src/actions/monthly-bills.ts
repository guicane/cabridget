"use server"

import { ensureMonthsForYear, sortMonths } from "./months"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getRecurringBills() {
  return prisma.recurringBill.findMany({
    orderBy: [
      { dayOfMonth: { sort: 'asc', nulls: 'last' } },
      { name: 'asc' }
    ]
  })
}

export async function addRecurringBill(formData: FormData) {
  const name = formData.get("name") as string
  const company = formData.get("company") as string
  const dayOfMonthStr = formData.get("dayOfMonth") as string

  if (!name) return

  const dayOfMonth = dayOfMonthStr ? parseInt(dayOfMonthStr, 10) : null

  await prisma.recurringBill.create({
    data: {
      name,
      company: company || null,
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
  if (field === 'dayOfMonth') {
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

export async function getMonths(year: number) {
  const identifiers = await ensureMonthsForYear(year)
  const rawMonths = await prisma.month.findMany({
    where: { identifier: { in: identifiers } }
  })
  return sortMonths(rawMonths, identifiers)
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

export async function deleteMonthlyBillSeries(name: string, company: string | null) {
  await prisma.monthlyBill.deleteMany({
    where: { name, company }
  })

  revalidatePath("/monthly-bills", "layout")
}

// Renames a bill everywhere it appears: the template (so future months
// pick up the new name) and every already-created MonthlyBill entry
// (which stores its own copy of the name, not a reference to the
// template — renaming only the template would silently orphan existing
// entries into a separate, stale-named row).
export async function renameBillSeries(oldName: string, oldCompany: string | null, newName: string, newCompany: string | null) {
  const template = await prisma.recurringBill.findFirst({ where: { name: oldName, company: oldCompany } })
  if (template) {
    await prisma.recurringBill.update({ where: { id: template.id }, data: { name: newName, company: newCompany } })
  }

  await prisma.monthlyBill.updateMany({
    where: { name: oldName, company: oldCompany },
    data: { name: newName, company: newCompany }
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

// Upserts a bill amount for one row/month cell directly, so entering a
// value in any cell works immediately — no separate "sync from templates"
// step needed first.
export async function upsertMonthlyBillEntry(monthId: string, name: string, company: string | null, amountStr: string) {
  const amount = parseFloat(amountStr)
  const isInvalid = !amountStr || isNaN(amount)

  const existing = await prisma.monthlyBill.findFirst({
    where: { monthId, name, company }
  })

  if (isInvalid) {
    if (existing) await prisma.monthlyBill.delete({ where: { id: existing.id } })
  } else if (existing) {
    await prisma.monthlyBill.update({ where: { id: existing.id }, data: { amount } })
  } else {
    await prisma.monthlyBill.create({ data: { monthId, name, company, amount } })
  }

  revalidatePath("/monthly-bills", "layout")
}

export async function getRecurringIncomes() {
  return prisma.recurringIncome.findMany({
    orderBy: [
      { source: 'asc' }
    ]
  })
}

export async function addRecurringIncome(formData: FormData) {
  const source = formData.get("source") as string

  if (!source) return

  await prisma.recurringIncome.create({
    data: {
      source
    }
  })

  revalidatePath("/monthly-bills", "layout")
}

export async function deleteRecurringIncome(id: string) {
  await prisma.recurringIncome.delete({
    where: { id }
  })
  
  revalidatePath("/monthly-bills", "layout")
}

export async function updateRecurringIncome(id: string, field: string, value: string) {
  if (field === 'source') {
    await prisma.recurringIncome.update({
      where: { id },
      data: { source: value }
    })
  }

  revalidatePath("/monthly-bills", "layout")
}

export async function getIncomes(monthId: string) {
  return prisma.income.findMany({
    where: { monthId },
    orderBy: [
      { amount: 'desc' }
    ]
  })
}

export async function addIncome(formData: FormData) {
  const monthId = formData.get("monthId") as string
  const source = formData.get("source") as string
  const amountStr = formData.get("amount") as string

  if (!monthId || !source || !amountStr) return

  const amount = parseFloat(amountStr)
  if (isNaN(amount)) return

  await prisma.income.create({
    data: {
      monthId,
      source,
      amount,
      isPaid: false
    }
  })

  revalidatePath("/monthly-bills", "layout")
}

export async function deleteIncomeSeries(source: string) {
  await prisma.income.deleteMany({
    where: { source }
  })

  revalidatePath("/monthly-bills", "layout")
}

// See renameBillSeries — same reasoning, for income.
export async function renameIncomeSeries(oldSource: string, newSource: string) {
  const template = await prisma.recurringIncome.findFirst({ where: { source: oldSource } })
  if (template) {
    await prisma.recurringIncome.update({ where: { id: template.id }, data: { source: newSource } })
  }

  await prisma.income.updateMany({
    where: { source: oldSource },
    data: { source: newSource }
  })

  revalidatePath("/monthly-bills", "layout")
}

export async function updateIncome(id: string, field: string, value: string | boolean) {
  if (field === 'amount') {
    const amount = parseFloat(value as string)
    if (!isNaN(amount)) {
      await prisma.income.update({
        where: { id },
        data: { amount }
      })
    }
  } else if (field === 'source') {
    await prisma.income.update({
      where: { id },
      data: { source: value as string }
    })
  } else if (field === 'isPaid') {
    await prisma.income.update({
      where: { id },
      data: { isPaid: value as boolean }
    })
  }

  revalidatePath("/monthly-bills", "layout")
}

// Upserts an income amount for one row/month cell directly, mirroring
// upsertMonthlyBillEntry above.
export async function upsertIncomeEntry(monthId: string, source: string, amountStr: string) {
  const amount = parseFloat(amountStr)
  const isInvalid = !amountStr || isNaN(amount)

  const existing = await prisma.income.findFirst({
    where: { monthId, source }
  })

  if (isInvalid) {
    if (existing) await prisma.income.delete({ where: { id: existing.id } })
  } else if (existing) {
    await prisma.income.update({ where: { id: existing.id }, data: { amount } })
  } else {
    await prisma.income.create({ data: { monthId, source, amount } })
  }

  revalidatePath("/monthly-bills", "layout")
}

export async function getCreditCards() {
  return prisma.creditCard.findMany({
    orderBy: [
      { name: 'asc' }
    ]
  })
}

export async function addCreditCard(formData: FormData) {
  const name = formData.get("name") as string

  if (!name) return

  await prisma.creditCard.create({
    data: { name }
  })

  revalidatePath("/monthly-bills", "layout")
}

export async function deleteCreditCard(id: string) {
  await prisma.creditCard.delete({
    where: { id }
  })

  revalidatePath("/monthly-bills", "layout")
}

export async function toggleCreditCardActive(id: string, active: boolean) {
  await prisma.creditCard.update({
    where: { id },
    data: { active }
  })

  revalidatePath("/monthly-bills", "layout")
  revalidatePath("/net-worth", "layout")
  revalidatePath("/credit-cards", "layout")
}

export async function updateCreditCard(id: string, field: string, value: string) {
  if (field === 'name') {
    await prisma.creditCard.update({
      where: { id },
      data: { name: value }
    })
  }

  revalidatePath("/monthly-bills", "layout")
}

export async function deleteCreditCardStatementSeries(creditCardId: string) {
  await prisma.creditCardStatement.deleteMany({
    where: { creditCardId }
  })
  
  revalidatePath("/monthly-bills", "layout")
}


