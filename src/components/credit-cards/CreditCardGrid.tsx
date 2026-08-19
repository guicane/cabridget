"use client"

import { useState } from "react"
import { upsertCreditCardStatement } from "@/actions/credit-cards"
import { useSettings } from "@/components/providers/SettingsProvider"
import { Trash2 } from "lucide-react"

type Statement = {
  id: string
  creditCardId: string
  monthId: string
  balance: any // Decimal mapped to Number
}

type Card = {
  id: string
  name: string
  statements: Statement[]
}

type Month = {
  id: string
  identifier: string
}

export function CreditCardGrid({ cards, months }: { cards: Card[], months: Month[] }) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const { currency } = useSettings()

  const handleBlur = async (creditCardId: string, monthId: string, value: string) => {
    if (value === "") return
    
    setIsUpdating(`${creditCardId}-${monthId}`)
    await upsertCreditCardStatement(creditCardId, monthId, value)
    setIsUpdating(null)
  }

  const getMonthTotal = (monthId: string) => {
    return cards.reduce((total, card) => {
      const stmt = card.statements.find(s => s.monthId === monthId)
      return total + (stmt ? Number(stmt.balance) : 0)
    }, 0)
  }

  return (
    <div className="bg-card rounded-[18px] border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="p-4 font-semibold text-foreground w-64 border-b border-border">Credit Card</th>
              {months.map(month => (
                <th key={month.id} className="p-4 font-semibold text-foreground text-right min-w-[150px] border-b border-border">
                  {month.identifier}
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {cards.length === 0 && (
              <tr>
                <td colSpan={months.length + 1} className="p-12 text-center text-muted-foreground border-b border-border">
                  No credit cards added. Add them in the Monthly Cashflow page.
                </td>
              </tr>
            )}
            
            {cards.map(card => (
              <tr key={card.id} className="border-b border-border hover:bg-muted/50 transition-colors group">
                <td className="p-4 flex items-center justify-between pl-8">
                  <span className="font-medium text-foreground">{card.name}</span>
                </td>
                {months.map(month => {
                  const stmt = card.statements.find(s => s.monthId === month.id)
                  const balance = stmt ? Number(stmt.balance) : ""
                  
                  return (
                    <td key={month.id} className="p-4">
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-muted-foreground text-sm">{currency}</span>
                        <input
                          type="number"
                          defaultValue={balance}
                          step="0.01"
                          onBlur={(e) => handleBlur(card.id, month.id, e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-6 pr-3 py-1.5 bg-transparent hover:bg-muted focus:bg-background border border-transparent rounded text-right text-base text-foreground focus:outline-none focus:border-negative/50 transition-all"
                        />
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          
          <tfoot className="bg-negative/10">
            <tr>
              <td className="p-4 font-semibold text-negative text-lg pl-8">Total Balances</td>
              {months.map(month => (
                <td key={month.id} className="p-4 text-right font-bold text-negative text-lg">
                  {currency}{getMonthTotal(month.id).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
