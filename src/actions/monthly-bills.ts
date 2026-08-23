"use server"

import { ensureMonthsForYear, sortMonths } from "./months"

import { prisma } from "@/lib/prisma"
import { getCurrentHouseholdId } from "@/lib/household"
import { revalidatePath, refresh } from "next/cache"

// Clears every bill, income, and credit-card-statement entry for one
// month — an escape hatch for re-doing a statement import that went into
// the wrong month. Leaves the RecurringBill/RecurringIncome templates and
// every other month untouched; only this month's entries are removed.
export async function clearMonth(monthId: string) {
  const householdId = await getCurrentHouseholdId()

  await prisma.monthlyBill.deleteMany({ where: { householdId, monthId } })
  await prisma.income.deleteMany({ where: { householdId, monthId } })
  await prisma.creditCardStatement.deleteMany({ where: { householdId, monthId } })

  revalidatePath("/monthly-bills", "layout")
  refresh()
}

export async function getRecurringBills() {
  const householdId = await getCurrentHouseholdId()
  return prisma.recurringBill.findMany({
    where: { householdId },
    orderBy: [
      { dayOfMonth: { sort: 'asc', nulls: 'last' } },
      { name: 'asc' }
    ]
  })
}

export async function addRecurringBill(formData: FormData) {
  const householdId = await getCurrentHouseholdId()
  const name = formData.get("name") as string
  const company = formData.get("company") as string
  const dayOfMonthStr = formData.get("dayOfMonth") as string

  if (!name) return

  const dayOfMonth = dayOfMonthStr ? parseInt(dayOfMonthStr, 10) : null

  await prisma.recurringBill.create({
    data: {
      householdId,
      name,
      company: company || null,
      dayOfMonth: isNaN(dayOfMonth as number) ? null : dayOfMonth
    }
  })

  revalidatePath("/monthly-bills", "layout")
}

export async function deleteRecurringBill(id: string) {
  const householdId = await getCurrentHouseholdId()
  await prisma.recurringBill.deleteMany({
    where: { id, householdId }
  })

  revalidatePath("/monthly-bills", "layout")
}

export async function updateRecurringBill(id: string, field: string, value: string) {
  const householdId = await getCurrentHouseholdId()
  const where = { id, householdId }

  if (field === 'dayOfMonth') {
    const dayOfMonth = parseInt(value, 10)
    await prisma.recurringBill.updateMany({
      where,
      data: { dayOfMonth: isNaN(dayOfMonth) ? null : dayOfMonth }
    })
  } else if (field === 'name') {
    await prisma.recurringBill.updateMany({
      where,
      data: { name: value }
    })
  } else if (field === 'company') {
    await prisma.recurringBill.updateMany({
      where,
      data: { company: value || null }
    })
  }

  revalidatePath("/monthly-bills", "layout")
}

export async function getMonths(year: number) {
  const householdId = await getCurrentHouseholdId()
  const identifiers = await ensureMonthsForYear(year)
  const rawMonths = await prisma.month.findMany({
    where: { householdId, identifier: { in: identifiers } }
  })
  return sortMonths(rawMonths, identifiers)
}

export async function getMonthlyBills(monthId: string) {
  const householdId = await getCurrentHouseholdId()
  return prisma.monthlyBill.findMany({
    where: { monthId, householdId },
    orderBy: [
      { dayOfMonth: { sort: 'asc', nulls: 'last' } },
      { amount: 'desc' }
    ]
  })
}

export async function addMonthlyBill(formData: FormData) {
  const householdId = await getCurrentHouseholdId()
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
      householdId,
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
  const householdId = await getCurrentHouseholdId()
  await prisma.monthlyBill.deleteMany({
    where: { id, householdId }
  })

  revalidatePath("/monthly-bills", "layout")
}

// Deletes a bill everywhere it appears: every MonthlyBill entry and the
// RecurringBill template, if one exists. The row is shown in the sheet
// whenever either source has a matching name/company (see
// CashflowSheet's billRowMap), so leaving the template behind after
// clearing only the entries would make the row reappear as empty instead
// of disappearing.
export async function deleteMonthlyBillSeries(name: string, company: string | null) {
  const householdId = await getCurrentHouseholdId()

  await prisma.recurringBill.deleteMany({ where: { householdId, name, company } })
  await prisma.monthlyBill.deleteMany({ where: { householdId, name, company } })

  revalidatePath("/monthly-bills", "layout")
}

// Renames a bill everywhere it appears: the template (so future months
// pick up the new name) and every already-created MonthlyBill entry
// (which stores its own copy of the name, not a reference to the
// template — renaming only the template would silently orphan existing
// entries into a separate, stale-named row).
export async function renameBillSeries(oldName: string, oldCompany: string | null, newName: string, newCompany: string | null) {
  const householdId = await getCurrentHouseholdId()

  const template = await prisma.recurringBill.findFirst({ where: { householdId, name: oldName, company: oldCompany } })
  if (template) {
    await prisma.recurringBill.update({ where: { id: template.id }, data: { name: newName, company: newCompany } })
  }

  await prisma.monthlyBill.updateMany({
    where: { householdId, name: oldName, company: oldCompany },
    data: { name: newName, company: newCompany }
  })

  revalidatePath("/monthly-bills", "layout")
}

export async function updateMonthlyBill(id: string, field: string, value: string | boolean) {
  const householdId = await getCurrentHouseholdId()
  const where = { id, householdId }

  if (field === 'amount') {
    const amount = parseFloat(value as string)
    if (!isNaN(amount)) {
      await prisma.monthlyBill.updateMany({ where, data: { amount } })
    }
  } else if (field === 'dayOfMonth') {
    const dayOfMonth = parseInt(value as string, 10)
    await prisma.monthlyBill.updateMany({
      where,
      data: { dayOfMonth: isNaN(dayOfMonth) ? null : dayOfMonth }
    })
  } else if (field === 'name') {
    await prisma.monthlyBill.updateMany({ where, data: { name: value as string } })
  } else if (field === 'company') {
    await prisma.monthlyBill.updateMany({ where, data: { company: (value as string) || null } })
  } else if (field === 'isPaid') {
    await prisma.monthlyBill.updateMany({ where, data: { isPaid: value as boolean } })
  }

  revalidatePath("/monthly-bills", "layout")
}

// Upserts a bill amount for one row/month cell directly, so entering a
// value in any cell works immediately — no separate "sync from templates"
// step needed first.
export async function upsertMonthlyBillEntry(monthId: string, name: string, company: string | null, amountStr: string) {
  const householdId = await getCurrentHouseholdId()
  const amount = parseFloat(amountStr)
  const isInvalid = !amountStr || isNaN(amount)

  const existing = await prisma.monthlyBill.findFirst({
    where: { householdId, monthId, name, company }
  })

  if (isInvalid) {
    if (existing) await prisma.monthlyBill.delete({ where: { id: existing.id } })
  } else if (existing) {
    await prisma.monthlyBill.update({ where: { id: existing.id }, data: { amount } })
  } else {
    await prisma.monthlyBill.create({ data: { householdId, monthId, name, company, amount } })
  }

  revalidatePath("/monthly-bills", "layout")
}

export async function getRecurringIncomes() {
  const householdId = await getCurrentHouseholdId()
  return prisma.recurringIncome.findMany({
    where: { householdId },
    orderBy: [
      { source: 'asc' }
    ]
  })
}

export async function addRecurringIncome(formData: FormData) {
  const householdId = await getCurrentHouseholdId()
  const source = formData.get("source") as string

  if (!source) return

  await prisma.recurringIncome.create({
    data: { householdId, source }
  })

  revalidatePath("/monthly-bills", "layout")
}

export async function deleteRecurringIncome(id: string) {
  const householdId = await getCurrentHouseholdId()
  await prisma.recurringIncome.deleteMany({
    where: { id, householdId }
  })

  revalidatePath("/monthly-bills", "layout")
}

export async function updateRecurringIncome(id: string, field: string, value: string) {
  const householdId = await getCurrentHouseholdId()
  if (field === 'source') {
    await prisma.recurringIncome.updateMany({
      where: { id, householdId },
      data: { source: value }
    })
  }

  revalidatePath("/monthly-bills", "layout")
}

export async function getIncomes(monthId: string) {
  const householdId = await getCurrentHouseholdId()
  return prisma.income.findMany({
    where: { monthId, householdId },
    orderBy: [
      { amount: 'desc' }
    ]
  })
}

export async function addIncome(formData: FormData) {
  const householdId = await getCurrentHouseholdId()
  const monthId = formData.get("monthId") as string
  const source = formData.get("source") as string
  const amountStr = formData.get("amount") as string

  if (!monthId || !source || !amountStr) return

  const amount = parseFloat(amountStr)
  if (isNaN(amount)) return

  await prisma.income.create({
    data: {
      householdId,
      monthId,
      source,
      amount,
      isPaid: false
    }
  })

  revalidatePath("/monthly-bills", "layout")
}

// See deleteMonthlyBillSeries — same reasoning, for income.
export async function deleteIncomeSeries(source: string) {
  const householdId = await getCurrentHouseholdId()

  await prisma.recurringIncome.deleteMany({ where: { householdId, source } })
  await prisma.income.deleteMany({ where: { householdId, source } })

  revalidatePath("/monthly-bills", "layout")
}

// See renameBillSeries — same reasoning, for income.
export async function renameIncomeSeries(oldSource: string, newSource: string) {
  const householdId = await getCurrentHouseholdId()

  const template = await prisma.recurringIncome.findFirst({ where: { householdId, source: oldSource } })
  if (template) {
    await prisma.recurringIncome.update({ where: { id: template.id }, data: { source: newSource } })
  }

  await prisma.income.updateMany({
    where: { householdId, source: oldSource },
    data: { source: newSource }
  })

  revalidatePath("/monthly-bills", "layout")
}

export async function updateIncome(id: string, field: string, value: string | boolean) {
  const householdId = await getCurrentHouseholdId()
  const where = { id, householdId }

  if (field === 'amount') {
    const amount = parseFloat(value as string)
    if (!isNaN(amount)) {
      await prisma.income.updateMany({ where, data: { amount } })
    }
  } else if (field === 'source') {
    await prisma.income.updateMany({ where, data: { source: value as string } })
  } else if (field === 'isPaid') {
    await prisma.income.updateMany({ where, data: { isPaid: value as boolean } })
  }

  revalidatePath("/monthly-bills", "layout")
}

// Upserts an income amount for one row/month cell directly, mirroring
// upsertMonthlyBillEntry above.
export async function upsertIncomeEntry(monthId: string, source: string, amountStr: string) {
  const householdId = await getCurrentHouseholdId()
  const amount = parseFloat(amountStr)
  const isInvalid = !amountStr || isNaN(amount)

  const existing = await prisma.income.findFirst({
    where: { householdId, monthId, source }
  })

  if (isInvalid) {
    if (existing) await prisma.income.delete({ where: { id: existing.id } })
  } else if (existing) {
    await prisma.income.update({ where: { id: existing.id }, data: { amount } })
  } else {
    await prisma.income.create({ data: { householdId, monthId, source, amount } })
  }

  revalidatePath("/monthly-bills", "layout")
}

export async function getCreditCards() {
  const householdId = await getCurrentHouseholdId()
  return prisma.creditCard.findMany({
    where: { householdId },
    orderBy: [
      { name: 'asc' }
    ]
  })
}

export async function addCreditCard(formData: FormData) {
  const householdId = await getCurrentHouseholdId()
  const name = formData.get("name") as string

  if (!name) return

  await prisma.creditCard.create({
    data: { householdId, name }
  })

  revalidatePath("/monthly-bills", "layout")
}

export async function deleteCreditCard(id: string) {
  const householdId = await getCurrentHouseholdId()
  await prisma.creditCard.deleteMany({
    where: { id, householdId }
  })

  revalidatePath("/monthly-bills", "layout")
}

export async function toggleCreditCardActive(id: string, active: boolean) {
  const householdId = await getCurrentHouseholdId()
  await prisma.creditCard.updateMany({
    where: { id, householdId },
    data: { active }
  })

  revalidatePath("/monthly-bills", "layout")
  revalidatePath("/net-worth", "layout")
}

export async function updateCreditCard(id: string, field: string, value: string) {
  const householdId = await getCurrentHouseholdId()
  if (field === 'name') {
    await prisma.creditCard.updateMany({
      where: { id, householdId },
      data: { name: value }
    })
  }

  revalidatePath("/monthly-bills", "layout")
}

export async function deleteCreditCardStatementSeries(creditCardId: string) {
  const householdId = await getCurrentHouseholdId()
  await prisma.creditCardStatement.deleteMany({
    where: { creditCardId, householdId }
  })

  revalidatePath("/monthly-bills", "layout")
}

export async function upsertCreditCardStatement(creditCardId: string, monthId: string, value: string) {
  const householdId = await getCurrentHouseholdId()
  const balance = parseFloat(value)
  if (isNaN(balance)) return

  const card = await prisma.creditCard.findFirst({ where: { id: creditCardId, householdId } })
  if (!card) return

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
      data: { householdId, creditCardId, monthId, balance }
    })
  }

  revalidatePath("/monthly-bills", "layout")
  revalidatePath("/net-worth", "layout")
}
