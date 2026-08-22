// Parses a bank/credit-card CSV export into plain (date, description,
// amount) rows, and matches them against user-defined merchant
// mappings. Bank CSV layouts aren't standardized, so columns are
// detected by common header names rather than a fixed layout. Only
// outgoing money (debits/spend) is extracted — this feature is for
// detecting bills, not income.

export type ParsedTransaction = {
  date: Date
  description: string
  amount: number // always positive: money out
}

export type CsvParseResult =
  | { ok: true; transactions: ParsedTransaction[] }
  | { ok: false; error: string }

const DATE_HEADERS = ["date", "transaction date", "posted date", "posting date", "value date"]
const DESCRIPTION_HEADERS = ["description", "details", "narrative", "merchant", "payee", "reference", "transaction description"]
const AMOUNT_HEADERS = ["amount", "value"]
const DEBIT_HEADERS = ["debit", "withdrawal", "money out", "paid out", "debit amount"]

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ } else inQuotes = !inQuotes
    } else if (char === "," && !inQuotes) {
      result.push(current); current = ""
    } else {
      current += char
    }
  }
  result.push(current)
  return result.map(s => s.trim())
}

function parseAmount(raw: string): number | null {
  if (!raw) return null
  const cleaned = raw.replace(/[£$€,]/g, "").trim()
  if (!cleaned) return null
  const negative = cleaned.startsWith("(") && cleaned.endsWith(")")
  const num = parseFloat(negative ? cleaned.slice(1, -1) : cleaned)
  if (isNaN(num)) return null
  return negative ? -num : num
}

// Accepts ISO (YYYY-MM-DD) and UK-style (DD/MM/YYYY or DD-MM-YYYY) dates.
function parseDate(raw: string): Date | null {
  const trimmed = raw.trim()

  let m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))

  m = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))

  return null
}

export function parseStatementCsv(text: string): CsvParseResult {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (lines.length < 2) return { ok: false, error: "File appears to be empty." }

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase())
  const findCol = (candidates: string[]) => headers.findIndex(h => candidates.includes(h))

  const dateCol = findCol(DATE_HEADERS)
  const descCol = findCol(DESCRIPTION_HEADERS)
  const amountCol = findCol(AMOUNT_HEADERS)
  const debitCol = findCol(DEBIT_HEADERS)

  if (dateCol === -1 || descCol === -1) {
    return { ok: false, error: `Couldn't find date/description columns. Found: ${headers.join(", ")}` }
  }
  if (amountCol === -1 && debitCol === -1) {
    return { ok: false, error: `Couldn't find an amount or debit column. Found: ${headers.join(", ")}` }
  }

  const transactions: ParsedTransaction[] = []

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i])
    const date = parseDate(cols[dateCol] || "")
    const description = (cols[descCol] || "").trim()
    if (!date || !description) continue

    let amount: number | null = null
    if (debitCol !== -1) {
      const raw = parseAmount(cols[debitCol] || "")
      if (raw !== null && raw > 0) amount = raw
    } else if (amountCol !== -1) {
      // Single signed-amount column: negative means money out.
      const raw = parseAmount(cols[amountCol] || "")
      if (raw !== null && raw < 0) amount = Math.abs(raw)
    }

    if (amount === null || amount <= 0) continue
    transactions.push({ date, description, amount })
  }

  if (transactions.length === 0) {
    return { ok: false, error: "No outgoing (debit) transactions were found in the file." }
  }

  return { ok: true, transactions }
}

// --- Matching parsed transactions against merchant mappings ---

import { sumAmounts } from "./money"
import { MONTH_NAMES } from "@/actions/months"

export type MerchantMapping = { pattern: string; billName: string; billCompany: string | null }

export type MatchedGroup = {
  monthIdentifier: string
  billName: string
  billCompany: string | null
  amount: number
  transactionCount: number
}

export type UnmatchedGroup = {
  description: string
  amount: number
  count: number
}

export function matchTransactions(
  transactions: ParsedTransaction[],
  mappings: MerchantMapping[]
): { matched: MatchedGroup[]; unmatched: UnmatchedGroup[] } {
  const matchedAmounts = new Map<string, { row: Omit<MatchedGroup, "amount" | "transactionCount">; amounts: number[] }>()
  const unmatchedAmounts = new Map<string, { description: string; amounts: number[] }>()

  for (const tx of transactions) {
    const mapping = mappings.find(m => tx.description.toLowerCase().includes(m.pattern.toLowerCase()))
    const monthIdentifier = `${MONTH_NAMES[tx.date.getMonth()]} ${tx.date.getFullYear()}`

    if (mapping) {
      const key = `${monthIdentifier}__${mapping.billName}__${mapping.billCompany || ""}`
      const existing = matchedAmounts.get(key)
      if (existing) {
        existing.amounts.push(tx.amount)
      } else {
        matchedAmounts.set(key, {
          row: { monthIdentifier, billName: mapping.billName, billCompany: mapping.billCompany },
          amounts: [tx.amount]
        })
      }
    } else {
      const key = tx.description.toLowerCase()
      const existing = unmatchedAmounts.get(key)
      if (existing) {
        existing.amounts.push(tx.amount)
      } else {
        unmatchedAmounts.set(key, { description: tx.description, amounts: [tx.amount] })
      }
    }
  }

  const matched: MatchedGroup[] = Array.from(matchedAmounts.values()).map(({ row, amounts }) => ({
    ...row,
    amount: sumAmounts(amounts),
    transactionCount: amounts.length
  }))

  const unmatched: UnmatchedGroup[] = Array.from(unmatchedAmounts.values()).map(({ description, amounts }) => ({
    description,
    amount: sumAmounts(amounts),
    count: amounts.length
  }))

  matched.sort((a, b) => a.monthIdentifier.localeCompare(b.monthIdentifier) || a.billName.localeCompare(b.billName))
  unmatched.sort((a, b) => b.amount - a.amount)

  return { matched, unmatched }
}
