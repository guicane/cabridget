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
  if (templates.length > 0) {
    const existingBills = await prisma.monthlyBill.findMany({
      where: { monthId }
    })

    // Diff based on name and company to find missing ones
    const missingTemplates = templates.filter(t => 
      !existingBills.some(eb => eb.name === t.name && eb.company === t.company)
    )

    if (missingTemplates.length > 0) {
      const newBills = missingTemplates.map(t => ({
        monthId,
        name: t.name,
        company: t.company,
        amount: 0,
        dayOfMonth: t.dayOfMonth
      }))

      await prisma.monthlyBill.createMany({
        data: newBills
      })
    }
  }

  const incomeTemplates = await prisma.recurringIncome.findMany()
  if (incomeTemplates.length > 0) {
    const existingIncomes = await prisma.income.findMany({
      where: { monthId }
    })

    const missingIncomeTemplates = incomeTemplates.filter(t => 
      !existingIncomes.some(ei => ei.source === t.source)
    )

    if (missingIncomeTemplates.length > 0) {
      const newIncomes = missingIncomeTemplates.map(t => ({
        monthId,
        source: t.source,
        amount: 0,
        isPaid: false
      }))

      await prisma.income.createMany({
        data: newIncomes
      })
    }
  }

  const creditCards = await prisma.creditCard.findMany()
  if (creditCards.length > 0) {
    const existingStatements = await prisma.creditCardStatement.findMany({
      where: { monthId }
    })

    const missingCards = creditCards.filter(c => 
      !existingStatements.some(es => es.creditCardId === c.id)
    )

    if (missingCards.length > 0) {
      const newStatements = missingCards.map(c => ({
        monthId,
        creditCardId: c.id,
        balance: 0
      }))

      await prisma.creditCardStatement.createMany({
        data: newStatements
      })
    }
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

export async function updateCreditCardStatement(id: string, value: string) {
  const balance = parseFloat(value as string)
  if (!isNaN(balance)) {
    await prisma.creditCardStatement.update({
      where: { id },
      data: { balance }
    })
  }

  revalidatePath("/monthly-bills", "layout")
}

