"use server"

import { prisma } from "@/lib/prisma"
import { getCurrentHouseholdId } from "@/lib/household"
import { MONTH_NAMES, ensureMonthsForYear, sortMonths } from "./months"
import { sumAmounts } from "@/lib/money"
import { computeMonthTotal, monthHasData } from "@/lib/net-worth"

export type DashboardData = {
  currentMonthLabel: string
  cashflow: { income: number; outgoing: number; difference: number; hasData: boolean }
  netWorth: { total: number; hasData: boolean; delta: number | null }
  trendPoints: { identifier: string; total: number; hasData: boolean }[]
}

// Aggregates a preview of the current month's cashflow and the year's net
// worth trend for the Dashboard. Reuses the same math the Monthly Cashflow
// and Net Worth pages use (computeMonthTotal/monthHasData, sumAmounts) so
// the preview can't silently disagree with the real pages.
export async function getDashboardData(): Promise<DashboardData> {
  const householdId = await getCurrentHouseholdId()
  const now = new Date()
  const year = now.getFullYear()
  const currentMonthLabel = `${MONTH_NAMES[now.getMonth()]} ${year}`

  // --- Monthly Cashflow preview: current month only ---
  const currentMonth = await prisma.month.findFirst({ where: { householdId, identifier: currentMonthLabel } })

  let cashflow = { income: 0, outgoing: 0, difference: 0, hasData: false }
  if (currentMonth) {
    const [bills, incomes, ccStatements] = await Promise.all([
      prisma.monthlyBill.findMany({ where: { householdId, monthId: currentMonth.id } }),
      prisma.income.findMany({ where: { householdId, monthId: currentMonth.id } }),
      prisma.creditCardStatement.findMany({ where: { householdId, monthId: currentMonth.id } }),
    ])
    const income = sumAmounts(incomes.map(i => Number(i.amount)))
    const billsTotal = sumAmounts(bills.map(b => Number(b.amount)))
    const ccTotal = sumAmounts(ccStatements.map(s => Number(s.balance)))
    const outgoing = sumAmounts([billsTotal, ccTotal])
    cashflow = {
      income,
      outgoing,
      difference: sumAmounts([outgoing, -income]),
      hasData: incomes.length > 0 || bills.length > 0 || ccStatements.length > 0,
    }
  }

  // --- Net Worth preview: this year's months, up to the current one ---
  const identifiers = await ensureMonthsForYear(year)
  const rawMonths = await prisma.month.findMany({
    where: { householdId, identifier: { in: identifiers } },
    include: { creditCardStatements: true },
  })
  const months = sortMonths(rawMonths, identifiers).map(m => ({
    id: m.id,
    identifier: m.identifier,
    creditCardStatements: m.creditCardStatements.map(s => ({ balance: Number(s.balance) })),
  }))

  const rawAccounts = await prisma.investmentAccount.findMany({
    where: { householdId },
    include: { snapshots: true },
  })
  const accounts = rawAccounts.map(a => ({
    snapshots: a.snapshots.map(s => ({ monthId: s.monthId, balance: Number(s.balance) })),
  }))

  const currentIndex = months.findIndex(m => m.identifier === currentMonthLabel)
  const monthsToDate = currentIndex >= 0 ? months.slice(0, currentIndex + 1) : months

  const trendPoints = monthsToDate.map(m => ({
    identifier: m.identifier,
    total: computeMonthTotal(accounts, m),
    hasData: monthHasData(accounts, m),
  }))

  const current = trendPoints.at(-1)
  const netWorthTotal = current?.total ?? 0
  const netWorthHasData = current?.hasData ?? false

  // Most recent prior month (within this year) that actually has data —
  // skipping empty months avoids a false "jump from zero" comparison.
  let previousTotal: number | null = null
  for (const point of trendPoints.slice(0, -1)) {
    if (point.hasData) previousTotal = point.total
  }
  const netWorthDelta = netWorthHasData && previousTotal !== null ? netWorthTotal - previousTotal : null

  return {
    currentMonthLabel,
    cashflow,
    netWorth: { total: netWorthTotal, hasData: netWorthHasData, delta: netWorthDelta },
    trendPoints,
  }
}
