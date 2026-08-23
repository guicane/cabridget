// Extracts transactions from text-based bank statement PDFs, entirely
// locally via pdfjs-dist — no external service or API call.
//
// Real UK bank statements (verified against an actual HSBC statement)
// print the date once per day rather than once per transaction, spread a
// single transaction's description across several physical lines, and put
// amounts in dedicated "Paid out" / "Paid in" / "Balance" columns
// identified by x-position rather than by being "the last number on the
// line". parseByColumns() reconstructs transactions from those column
// positions when a recognizable "Date ... Paid out ... Paid in ...
// Balance" header is found (checked against the real running balance —
// opening + paid in - paid out reproduces the printed closing balance
// exactly). parseByLines() is the older, simpler one-line-per-transaction
// heuristic, kept as a fallback for statements that don't use that table
// layout at all.

import "./dommatrix-polyfill"
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs"
import path from "path"
import { pathToFileURL } from "url"
import type { ParsedTransaction, CsvParseResult } from "./statement-csv"

const STANDARD_FONT_DATA_URL = path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts") + path.sep

// pdfjs-dist defaults to a relative worker path ("./pdf.worker.mjs") that
// it resolves against its own bundled module location. Turbopack's
// chunking moves that code somewhere else on disk, so the default guess
// points at a file that doesn't exist there — set it explicitly instead.
GlobalWorkerOptions.workerSrc = pathToFileURL(
  path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")
).href

const MONTH_NAMES: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

function expandYear(y: number): number {
  return y < 100 ? 2000 + y : y
}

// Matches a whole date string (line-anchored variants used by parseByLines
// via .match, and exact-cell variants used by parseByColumns via a full
// match against a single extracted text item). Years may be 2 or 4 digits
// — "03 Dec 25" is HSBC's actual format.
const DATE_PATTERNS: { regex: RegExp; toDate: (m: RegExpMatchArray) => Date | null }[] = [
  // 2026-03-01
  { regex: /^(\d{4})-(\d{2})-(\d{2})/, toDate: m => new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) },
  // 01/03/2026, 01-03-2026, 01.03.2026 (DD/MM/YYYY, 2 or 4 digit year)
  { regex: /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/, toDate: m => new Date(expandYear(Number(m[3])), Number(m[2]) - 1, Number(m[1])) },
  // 01 Mar 2026, 01-Mar-2026, 03 Dec 25
  {
    regex: /^(\d{1,2})[\s-]([A-Za-z]{3,})[\s-](\d{2,4})/,
    toDate: m => {
      const month = MONTH_NAMES[m[2].slice(0, 3).toLowerCase()]
      return month === undefined ? null : new Date(expandYear(Number(m[3])), month, Number(m[1]))
    },
  },
  // Mar 01 2026, Mar 01, 2026
  {
    regex: /^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{2,4})/,
    toDate: m => {
      const month = MONTH_NAMES[m[1].slice(0, 3).toLowerCase()]
      return month === undefined ? null : new Date(expandYear(Number(m[3])), month, Number(m[2]))
    },
  },
]

function matchDatePrefix(text: string): { date: Date; matchLength: number } | null {
  for (const { regex, toDate } of DATE_PATTERNS) {
    const m = text.match(regex)
    if (m) {
      const date = toDate(m)
      if (date) return { date, matchLength: m[0].length }
    }
  }
  return null
}

// A monetary token: optional currency symbol, digits with optional
// thousand separators, a decimal part, and an optional sign/parentheses/
// CR-DR suffix convention for negative amounts.
const AMOUNT_TOKEN = /[£$€]?\(?-?[\d,]*\d\.\d{2}\)?-?\s?(?:CR|DR)?/gi

// A token only counts as a monetary value if it looks like one end-to-end —
// this rejects plain integers (account numbers, sort codes, sheet numbers)
// that happen to fall inside a column's x-range but aren't amounts at all.
const MONEY_SHAPE = /^[£$€]?\(?-?[\d,]*\d\.\d{2}\)?-?\s?(?:CR|DR)?$/i

function parseAmountToken(raw: string): number | null {
  const trimmed = raw.trim()
  if (!MONEY_SHAPE.test(trimmed)) return null
  const isCredit = /CR$/i.test(trimmed)
  const isDebitSuffix = /DR$/i.test(trimmed)
  const cleaned = trimmed.replace(/[£$€,]/g, "").replace(/\s?(CR|DR)$/i, "").trim()
  const negative = (cleaned.startsWith("(") && cleaned.endsWith(")")) || cleaned.startsWith("-") || cleaned.endsWith("-") || isDebitSuffix
  const numeric = cleaned.replace(/[()-]/g, "")
  const num = parseFloat(numeric)
  if (isNaN(num) || num === 0) return null
  return isCredit ? Math.abs(num) : (negative ? -Math.abs(num) : num)
}

type Token = { str: string; x: number }
type Row = Token[]

async function extractPages(buffer: Buffer): Promise<Row[][]> {
  const data = new Uint8Array(buffer)
  const doc = await getDocument({
    data,
    disableFontFace: true,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  }).promise

  const pages: Row[][] = []

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()

    const items = content.items
      .filter(item => "str" in item && item.str.trim().length > 0)
      .map(item => {
        const textItem = item as { str: string; transform: number[] }
        return { str: textItem.str, x: textItem.transform[4], y: textItem.transform[5] }
      })

    // Group items into rows by y-coordinate (2pt tolerance for jitter),
    // then sort left-to-right within each row.
    const rowsByY = new Map<number, Row>()
    for (const item of items) {
      const rowKey = Math.round(item.y / 2) * 2
      const row = rowsByY.get(rowKey)
      if (row) row.push(item)
      else rowsByY.set(rowKey, [item])
    }

    const rowKeys = Array.from(rowsByY.keys()).sort((a, b) => b - a) // top to bottom
    const rows = rowKeys.map(key => rowsByY.get(key)!.sort((a, b) => a.x - b.x))
    pages.push(rows)
  }

  return pages
}

// --- Column-based parsing (Date | Description | Paid out | Paid in | Balance) ---

type ColumnBounds = { paidOutX: number; paidInX: number; balanceX: number }

function detectColumnHeader(row: Row): ColumnBounds | null {
  let hasDate = false
  let paidOutX: number | null = null
  let paidInX: number | null = null
  let balanceX: number | null = null

  for (const token of row) {
    const s = token.str.trim()
    if (/^date$/i.test(s)) hasDate = true
    else if (/paid\s*out|money\s*out|debit/i.test(s)) paidOutX = token.x
    else if (/paid\s*in|money\s*in|credit/i.test(s)) paidInX = token.x
    else if (/balance/i.test(s)) balanceX = token.x
  }

  if (hasDate && paidOutX !== null && paidInX !== null && balanceX !== null) {
    return { paidOutX, paidInX, balanceX }
  }
  return null
}

function parseByColumns(pages: Row[][]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = []
  let bounds: ColumnBounds | null = null
  let currentDate: Date | null = null
  let pendingDescription: string[] = []

  const flush = (amount: number, direction: "out" | "in") => {
    if (currentDate && pendingDescription.length > 0 && amount > 0) {
      transactions.push({
        date: currentDate,
        description: pendingDescription.join(" ").replace(/\s+/g, " ").trim(),
        amount,
        direction,
      })
    }
    pendingDescription = []
  }

  for (const rows of pages) {
    for (const row of rows) {
      const header = detectColumnHeader(row)
      if (header) {
        bounds = header
        continue
      }
      if (!bounds) continue // haven't seen a header yet — nothing to classify against

      let paidOut: number | null = null
      let paidIn: number | null = null
      let sawBalanceValue = false
      const leftTokens: string[] = []

      for (const token of row) {
        const s = token.str.trim()
        if (!s) continue
        if (token.x >= bounds.balanceX) {
          sawBalanceValue = true
        } else if (token.x >= bounds.paidInX) {
          const amt = parseAmountToken(s)
          if (amt !== null) paidIn = amt
        } else if (token.x >= bounds.paidOutX) {
          const amt = parseAmountToken(s)
          if (amt !== null) paidOut = amt
        } else {
          leftTokens.push(s)
        }
      }

      let rowDescription = leftTokens
      if (leftTokens.length > 0) {
        const dateMatch = matchDatePrefix(leftTokens[0])
        if (dateMatch && dateMatch.matchLength >= leftTokens[0].length - 1) {
          currentDate = dateMatch.date
          rowDescription = leftTokens.slice(1)
        }
      }

      if (paidOut === null && paidIn === null) {
        // "BALANCE BROUGHT/CARRIED FORWARD" rows show a balance-column
        // value with no paid-in/out amount — not a transaction, and its
        // description text shouldn't leak into the next real one.
        const isBalanceForwardRow = sawBalanceValue && rowDescription.some(t => /balance/i.test(t))
        if (isBalanceForwardRow) {
          pendingDescription = []
          continue
        }
        pendingDescription.push(...rowDescription)
        continue
      }

      pendingDescription.push(...rowDescription)
      if (paidOut !== null) flush(paidOut, "out")
      else if (paidIn !== null) flush(paidIn, "in")
    }
  }

  return transactions
}

// --- Line-based fallback for statements with no detectable column header ---

function joinRowsToLines(pages: Row[][]): string[] {
  const lines: string[] = []
  for (const rows of pages) {
    for (const row of rows) {
      lines.push(row.map(t => t.str.trim()).filter(Boolean).join("  "))
    }
  }
  return lines
}

function parseLine(line: string): ParsedTransaction | null {
  const dateMatch = matchDatePrefix(line.trim())
  if (!dateMatch) return null
  const rest = line.trim().slice(dateMatch.matchLength).trim()

  const amountTokens = Array.from(rest.matchAll(AMOUNT_TOKEN)).map(m => m[0])
  if (amountTokens.length === 0) return null

  // Most statement layouts read Date | Description | Amount | Balance —
  // when more than one monetary token is on the line, assume the first is
  // the transaction amount and any later ones are a running balance.
  const amountToken = amountTokens[0]
  const amount = parseAmountToken(amountToken)
  if (amount === null) return null

  const description = rest.slice(0, rest.indexOf(amountToken)).trim()
  if (!description) return null

  return {
    date: dateMatch.date,
    description,
    amount: Math.abs(amount),
    direction: amount < 0 ? "out" : "in",
  }
}

function parseByLines(pages: Row[][]): ParsedTransaction[] {
  const lines = joinRowsToLines(pages)
  const transactions: ParsedTransaction[] = []
  for (const line of lines) {
    const tx = parseLine(line)
    if (tx) transactions.push(tx)
  }
  return transactions
}

export async function parseStatementPdf(buffer: Buffer): Promise<CsvParseResult> {
  let pages: Row[][]
  try {
    pages = await extractPages(buffer)
  } catch (err) {
    console.error("statement-pdf: extractPages failed", err)
    return { ok: false, error: "Couldn't read this PDF. It may be a scanned image rather than a text-based statement, which isn't supported yet." }
  }

  let transactions: ParsedTransaction[]
  try {
    const columnTransactions = parseByColumns(pages)
    transactions = columnTransactions.length > 0 ? columnTransactions : parseByLines(pages)
  } catch (err) {
    console.error("statement-pdf: parsing extracted text failed", err)
    return { ok: false, error: "This PDF's layout couldn't be parsed. Its structure may need a tweak to the parser in src/lib/statement-pdf.ts." }
  }

  if (transactions.length === 0) {
    return { ok: false, error: "No transactions were recognized in this PDF. Its layout may need a tweak to the parser in src/lib/statement-pdf.ts." }
  }

  return { ok: true, transactions }
}
