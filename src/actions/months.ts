import { prisma } from "@/lib/prisma"

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export async function ensureMonthsForYear(year: number) {
  const identifiers = MONTH_NAMES.map(m => `${m} ${year}`)
  
  const existingMonths = await prisma.month.findMany({
    where: { identifier: { in: identifiers } }
  })
  
  const existingSet = new Set(existingMonths.map(m => m.identifier))
  
  const missing = identifiers.filter(id => !existingSet.has(id))
  
  if (missing.length > 0) {
    await prisma.month.createMany({
      data: missing.map(identifier => ({ identifier }))
    })
  }
  
  return identifiers
}

export function sortMonths<T extends { identifier: string }>(months: T[], identifiers: string[]): T[] {
  return [...months].sort((a, b) => {
    return identifiers.indexOf(a.identifier) - identifiers.indexOf(b.identifier)
  })
}
