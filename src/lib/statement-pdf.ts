// Extracts transactions from text-based bank statement PDFs, entirely
// locally via pdfjs-dist — no external service or API call. PDF statement
// layouts vary far more than CSV exports and rarely preserve a labeled
// column structure once extracted, so this uses a per-line heuristic (date
// at the start of the line, description in the middle, amount near the
// end) instead of the header-based detection statement-csv.ts uses for
// CSV. Expect to extend DATE_PATTERNS / the amount heuristic below once
// tested against real statements from each bank.

import "./dommatrix-polyfill"
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs"
import path from "path"
import type { ParsedTransaction, CsvParseResult } from "./statement-csv"

const STANDARD_FONT_DATA_URL = path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts") + path.sep

const MONTH_NAMES: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
}

const DATE_PATTERNS: { regex: RegExp; toDate: (m: RegExpMatchArray) => Date | null }[] = [
  // 2026-03-01
  { regex: /^(\d{4})-(\d{2})-(\d{2})/, toDate: m => new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) },
  // 01/03/2026, 01-03-2026, 01.03.2026 (DD/MM/YYYY)
  { regex: /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/, toDate: m => new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) },
  // 01 Mar 2026, 01-Mar-2026
  {
    regex: /^(\d{1,2})[\s-]([A-Za-z]{3,})[\s-](\d{4})/,
    toDate: m => {
      const month = MONTH_NAMES[m[2].slice(0, 3).toLowerCase()]
      return month === undefined ? null : new Date(Number(m[3]), month, Number(m[1]))
    },
  },
  // Mar 01 2026, Mar 01, 2026
  {
    regex: /^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})/,
    toDate: m => {
      const month = MONTH_NAMES[m[1].slice(0, 3).toLowerCase()]
      return month === undefined ? null : new Date(Number(m[3]), month, Number(m[2]))
    },
  },
]

// A monetary token: optional currency symbol, digits with optional
// thousand separators, a decimal part, and an optional sign/parentheses/
// CR-DR suffix convention for negative amounts.
const AMOUNT_TOKEN = /[£$€]?\(?-?[\d,]*\d\.\d{2}\)?-?\s?(?:CR|DR)?/gi

function parseAmountToken(raw: string): number | null {
  const trimmed = raw.trim()
  const isCredit = /CR$/i.test(trimmed)
  const isDebitSuffix = /DR$/i.test(trimmed)
  const cleaned = trimmed.replace(/[£$€,]/g, "").replace(/\s?(CR|DR)$/i, "").trim()
  const negative = (cleaned.startsWith("(") && cleaned.endsWith(")")) || cleaned.startsWith("-") || cleaned.endsWith("-") || isDebitSuffix
  const numeric = cleaned.replace(/[()-]/g, "")
  const num = parseFloat(numeric)
  if (isNaN(num) || num === 0) return null
  return isCredit ? Math.abs(num) : (negative ? -Math.abs(num) : num)
}

function parseLine(line: string): ParsedTransaction | null {
  const trimmedLine = line.trim()
  let rest = trimmedLine
  let date: Date | null = null

  for (const { regex, toDate } of DATE_PATTERNS) {
    const m = rest.match(regex)
    if (m) {
      date = toDate(m)
      rest = rest.slice(m[0].length).trim()
      break
    }
  }
  if (!date) return null

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
    date,
    description,
    amount: Math.abs(amount),
    direction: amount < 0 ? "out" : "in",
  }
}

async function extractLines(buffer: Buffer): Promise<string[]> {
  const data = new Uint8Array(buffer)
  const doc = await getDocument({
    data,
    disableFontFace: true,
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  }).promise

  const lines: string[] = []

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum)
    const content = await page.getTextContent()

    const items = content.items
      .filter(item => "str" in item && item.str.trim().length > 0)
      .map(item => {
        const textItem = item as { str: string; transform: number[] }
        return { str: textItem.str, x: textItem.transform[4], y: textItem.transform[5] }
      })

    // Group items into lines by y-coordinate (2pt tolerance for jitter),
    // then sort left-to-right within each line and join them back up.
    const rows = new Map<number, { str: string; x: number }[]>()
    for (const item of items) {
      const rowKey = Math.round(item.y / 2) * 2
      const row = rows.get(rowKey)
      if (row) row.push(item)
      else rows.set(rowKey, [item])
    }

    const rowKeys = Array.from(rows.keys()).sort((a, b) => b - a) // top to bottom
    for (const key of rowKeys) {
      const row = rows.get(key)!
      row.sort((a, b) => a.x - b.x)
      lines.push(row.map(i => i.str.trim()).filter(Boolean).join("  "))
    }
  }

  return lines
}

export async function parseStatementPdf(buffer: Buffer): Promise<CsvParseResult> {
  let lines: string[]
  try {
    lines = await extractLines(buffer)
  } catch {
    return { ok: false, error: "Couldn't read this PDF. It may be a scanned image rather than a text-based statement, which isn't supported yet." }
  }

  const transactions: ParsedTransaction[] = []
  for (const line of lines) {
    const tx = parseLine(line)
    if (tx) transactions.push(tx)
  }

  if (transactions.length === 0) {
    return { ok: false, error: "No transactions were recognized in this PDF. Its layout may need a tweak to the parser in src/lib/statement-pdf.ts." }
  }

  return { ok: true, transactions }
}
