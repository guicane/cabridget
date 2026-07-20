"use client"

import { useState } from "react"
import { upsertLedgerEntry, deleteCashFlowRow } from "@/actions/cash-flow"
import { Trash2 } from "lucide-react"
import type { LedgerEntry, Month, EntryType } from "@prisma/client"
import { cn } from "@/lib/utils"

import { useSettings } from "@/components/providers/SettingsProvider"

type SerializedLedgerEntry = Omit<LedgerEntry, "amount"> & { amount: number }

type RowItem = {
  description: string
  type: EntryType
  orderIndex: number
}

export function CashFlowGrid({ 
  months, 
  entries 
}: { 
  months: Month[], 
  entries: SerializedLedgerEntry[] 
}) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const { currency } = useSettings()

  // 1. Find all unique rows
  const rowMap = new Map<string, RowItem>()
  entries.forEach(entry => {
    const key = `${entry.type}-${entry.description}`
    if (!rowMap.has(key)) {
      rowMap.set(key, {
        description: entry.description,
        type: entry.type,
        orderIndex: entry.orderIndex
      })
    } else {
      // Keep the smallest orderIndex for consistency if they differ
      const existing = rowMap.get(key)!
      if (entry.orderIndex < existing.orderIndex) {
        existing.orderIndex = entry.orderIndex
      }
    }
  })

  const uniqueRows = Array.from(rowMap.values())

  // Sort rows: first by orderIndex (if > 0), then alphabetically
  uniqueRows.sort((a, b) => {
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex
    }
    return a.description.localeCompare(b.description)
  })

  const types: EntryType[] = ["Income", "Bill", "CreditCardPayment"]

  const formatTypeName = (type: EntryType) => {
    if (type === "CreditCardPayment") return "Credit Cards"
    return type + "s"
  }

  const handleBlur = async (monthId: string, type: EntryType, description: string, value: string) => {
    setIsUpdating(`${monthId}-${type}-${description}`)
    await upsertLedgerEntry(monthId, type, description, value)
    setIsUpdating(null)
  }

  // Subtotal for a specific type and month
  const getTypeSubtotal = (type: EntryType, monthId: string) => {
    return entries
      .filter(e => e.type === type && e.monthId === monthId)
      .reduce((sum, e) => sum + e.amount, 0)
  }

  // Calculate Left Over for a month (Income - Bills - CreditCards)
  const getLeftOver = (monthId: string) => {
    const income = getTypeSubtotal("Income", monthId)
    const bills = getTypeSubtotal("Bill", monthId)
    const cc = getTypeSubtotal("CreditCardPayment", monthId)
    return income - bills - cc
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="p-4 font-semibold text-foreground w-64 border-b border-border">Line Item</th>
              {months.map(month => (
                <th key={month.id} className="p-4 font-semibold text-foreground text-right min-w-[150px] border-b border-border">
                  {month.identifier}
                </th>
              ))}
            </tr>
          </thead>
          
          {types.map(type => {
            const rowsOfType = uniqueRows.filter(r => r.type === type)
            if (rowsOfType.length === 0) return null

            return (
              <tbody key={type}>
                {/* Type Accounts */}
                {rowsOfType.map(row => (
                  <tr key={row.description} className="border-b border-border hover:bg-muted/50 transition-colors group">
                    <td className="p-4 flex items-center justify-between pl-8">
                      <span className="font-medium text-foreground">{row.description}</span>
                      <button
                        onClick={() => deleteCashFlowRow(row.type, row.description)}
                        className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={`Delete ${row.description}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                    {months.map(month => {
                      const entry = entries.find(e => e.monthId === month.id && e.type === row.type && e.description === row.description)
                      const amount = entry && entry.amount !== 0 ? entry.amount : ""
                      const hasValue = entry && entry.amount > 0

                      return (
                        <td key={month.id} className={cn(
                          "p-0 border-r border-border/50 last:border-r-0 transition-colors relative",
                          hasValue ? "bg-emerald-400/20 dark:bg-emerald-500/20" : ""
                        )}>
                          <div className="relative w-full h-full flex items-center">
                            {hasValue && <span className="absolute left-3 text-emerald-700 dark:text-emerald-300 text-sm">{currency}</span>}
                            {!hasValue && amount !== "" && <span className="absolute left-3 text-muted-foreground text-sm">{currency}</span>}
                            <input
                              type="number"
                              defaultValue={amount}
                              onBlur={(e) => handleBlur(month.id, row.type, row.description, e.target.value)}
                              placeholder=""
                              className={cn(
                                "w-full pl-6 pr-4 py-4 bg-transparent border-none text-right text-base focus:outline-none focus:bg-background transition-all",
                                hasValue ? "text-emerald-900 dark:text-emerald-100 font-medium" : "text-foreground"
                              )}
                            />
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {/* Type Subtotal */}
                <tr className="border-b-4 border-border bg-muted/20">
                  <td className="p-4 font-bold text-foreground pl-8 text-sm">
                    {formatTypeName(type)} Total
                  </td>
                  {months.map(month => {
                    const subtotal = getTypeSubtotal(type, month.id)
                    return (
                      <td key={month.id} className="p-4 text-right font-bold text-foreground text-sm border-r border-border/50 last:border-r-0">
                        {subtotal > 0 ? `${currency}${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ""}
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            )
          })}
          
          <tfoot className="bg-primary/10">
            <tr>
              <td className="p-4 font-bold text-primary text-lg">Left Over</td>
              {months.map(month => (
                <td key={month.id} className="p-4 text-right font-bold text-primary text-lg border-r border-border/50 last:border-r-0">
                  {currency}{getLeftOver(month.id).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
