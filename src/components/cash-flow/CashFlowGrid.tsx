"use client"

import { useState, useEffect } from "react"
import { upsertCashFlowRow, deleteCashFlowRow } from "@/actions/cash-flow"
import { Trash2 } from "lucide-react"
import type { Month } from "@prisma/client"
import { cn } from "@/lib/utils"
import { sumAmounts } from "@/lib/money"
import { useSettings } from "@/components/providers/SettingsProvider"

type EntryType = "Income" | "Bill" | "CreditCard"

type SerializedEntry = {
  id: string
  monthId: string
  type: EntryType
  description: string
  amount: number
}

type RowItem = {
  description: string
  type: EntryType
}

function GridCell({
  monthId,
  type,
  description,
  initialAmount,
  hasEntry,
  currency
}: {
  monthId: string
  type: EntryType
  description: string
  initialAmount: number
  hasEntry: boolean
  currency: string
}) {
  const [value, setValue] = useState(hasEntry ? initialAmount.toString() : "")
  const [isUpdating, setIsUpdating] = useState(false)

  // Sync state if server changes
  useEffect(() => {
    setValue(hasEntry ? initialAmount.toString() : "")
  }, [hasEntry, initialAmount])

  const handleBlur = async () => {
    // Only update if changed
    const serverValue = hasEntry ? initialAmount.toString() : ""
    if (value === serverValue) return

    setIsUpdating(true)
    await upsertCashFlowRow(monthId, type, description, value)
    setIsUpdating(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur()
    }
  }

  const showCurrency = hasEntry || value !== ""

  return (
    <td className={cn(
      "p-0 border-r border-border/50 last:border-r-0 transition-colors relative",
      hasEntry ? "bg-primary/10" : "",
      isUpdating ? "opacity-50" : ""
    )}>
      <div className="relative w-full h-full flex items-center">
        {showCurrency && (
          <span className={cn(
            "absolute left-3 text-sm",
            hasEntry ? "text-primary" : "text-muted-foreground"
          )}>
            {currency}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          step="0.01"
          placeholder=""
          className={cn(
            "w-full pl-6 pr-4 py-4 bg-transparent border-none text-right text-base focus:outline-none focus:bg-background transition-all",
            hasEntry ? "text-foreground font-medium" : "text-foreground"
          )}
        />
      </div>
    </td>
  )
}

export function CashFlowGrid({ 
  months, 
  entries 
}: { 
  months: Month[], 
  entries: SerializedEntry[] 
}) {
  const { currency } = useSettings()

  // 1. Find all unique rows
  const rowMap = new Map<string, RowItem>()
  entries.forEach(entry => {
    const key = `${entry.type}-${entry.description}`
    if (!rowMap.has(key)) {
      rowMap.set(key, {
        description: entry.description,
        type: entry.type
      })
    }
  })

  const uniqueRows = Array.from(rowMap.values())
  uniqueRows.sort((a, b) => a.description.localeCompare(b.description))

  const types: EntryType[] = ["Income", "Bill", "CreditCard"]

  const formatTypeName = (type: EntryType) => {
    if (type === "CreditCard") return "Credit Cards"
    return type + "s"
  }

  const getTypeSubtotal = (type: EntryType, monthId: string) => {
    return sumAmounts(
      entries.filter(e => e.type === type && e.monthId === monthId).map(e => e.amount)
    )
  }

  const getLeftOver = (monthId: string) => {
    const income = getTypeSubtotal("Income", monthId)
    const bills = getTypeSubtotal("Bill", monthId)
    const cc = getTypeSubtotal("CreditCard", monthId)
    return sumAmounts([income, -bills, -cc])
  }

  return (
    <div className="bg-card rounded-[18px] border border-border overflow-hidden">
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
                {rowsOfType.map(row => (
                  <tr key={row.description} className="border-b border-border hover:bg-muted/50 transition-colors group">
                    <td className="p-4 flex items-center justify-between pl-8">
                      <span className="font-medium text-foreground">{row.description}</span>
                      <button
                        onClick={() => deleteCashFlowRow(row.type, row.description)}
                        className="text-muted-foreground hover:text-negative opacity-0 group-hover:opacity-100 transition-opacity"
                        title={`Delete ${row.description}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                    {months.map(month => {
                      const entry = entries.find(e => e.monthId === month.id && e.type === row.type && e.description === row.description)
                      return (
                        <GridCell
                          key={month.id}
                          monthId={month.id}
                          type={row.type}
                          description={row.description}
                          initialAmount={entry?.amount || 0}
                          hasEntry={entry !== undefined}
                          currency={currency}
                        />
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
                        {subtotal !== 0 ? `${currency}${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ""}
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
