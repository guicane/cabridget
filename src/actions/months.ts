import { prisma } from "@/lib/prisma"
import { getCurrentHouseholdId } from "@/lib/household"

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export async function ensureMonthsForYear(year: number) {
  const householdId = await getCurrentHouseholdId()
  const identifiers = MONTH_NAMES.map(m => `${m} ${year}`)

  const existingMonths = await prisma.month.findMany({
    where: { householdId, identifier: { in: identifiers } }
  })

  const existingSet = new Set(existingMonths.map(m => m.identifier))

  const missing = identifiers.filter(id => !existingSet.has(id))

  if (missing.length > 0) {
    await prisma.month.createMany({
      data: missing.map(identifier => ({ householdId, identifier }))
    })
  }

  return identifiers
}

export function sortMonths<T extends { identifier: string }>(months: T[], identifiers: string[]): T[] {
  return [...months].sort((a, b) => {
    return identifiers.indexOf(a.identifier) - identifiers.indexOf(b.identifier)
  })
}
