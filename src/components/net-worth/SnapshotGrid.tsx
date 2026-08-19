"use client"

import { useState } from "react"
import { upsertSnapshot, deleteInvestmentAccount, toggleInvestmentAccountActive } from "@/actions/net-worth"
import { Trash2, CheckCircle2, Circle } from "lucide-react"

import { useSettings } from "@/components/providers/SettingsProvider"
import { sumAmounts } from "@/lib/money"

// Types matching the Prisma schema relationships
type Snapshot = {
  id: string
  accountId: string
  monthId: string
  balance: any // Decimal
  month: { identifier: string }
}

type Account = {
  id: string
  name: string
  category: string
  active: boolean
  snapshots: Snapshot[]
}

type CreditCard = {
  id: string
  name: string
}

type Month = {
  id: string
  identifier: string
  creditCardStatements: { balance: any, creditCardId: string }[]
}

export function SnapshotGrid({ accounts, months, creditCards = [] }: { accounts: Account[], months: Month[], creditCards?: CreditCard[] }) {
  // Use local state to handle optimistic updates
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const { currency } = useSettings()

  const handleBlur = async (accountId: string, monthId: string, value: string) => {
    if (!value || isNaN(Number(value))) return
    
    setIsUpdating(`${accountId}-${monthId}`)
    await upsertSnapshot(accountId, monthId, value)
    setIsUpdating(null)
  }

  // Calculate totals per month across all accounts minus credit card debt
  const getMonthTotal = (monthId: string) => {
    const assets = sumAmounts(
      accounts.map(account => {
        const snap = account.snapshots.find(s => s.monthId === monthId)
        return snap ? Number(snap.balance) : 0
      })
    )

    const month = months.find(m => m.id === monthId)
    const ccDebt = sumAmounts((month?.creditCardStatements || []).map(cc => Number(cc.balance)))

    return sumAmounts([assets, -ccDebt])
  }

  // A month is complete once every active investment has a value entered
  // for it and every active credit card has a statement entered for it.
  const isMonthComplete = (monthId: string) => {
    const activeAccounts = accounts.filter(a => a.active)
    const missingAccount = activeAccounts.some(a => !a.snapshots.some(s => s.monthId === monthId))
    if (missingAccount) return false

    const month = months.find(m => m.id === monthId)
    const statementCardIds = new Set((month?.creditCardStatements || []).map(s => s.creditCardId))
    const missingCard = creditCards.some(c => !statementCardIds.has(c.id))

    return !missingCard
  }

  // Group accounts by category
  const categories = ["Pensions", "StockISA", "Shares", "Savings"]
  
  const accountsByCategory = categories.reduce((acc, category) => {
    acc[category] = accounts.filter(a => a.category === category)
    return acc
  }, {} as Record<string, Account[]>)

  const formatCategoryName = (category: string) => {
    if (category === "StockISA") return "Stock ISA"
    return category
  }

  // Calculate subtotal for a specific category
  const getCategoryTotal = (category: string, monthId: string) => {
    const categoryAccounts = accountsByCategory[category] || []
    return sumAmounts(
      categoryAccounts.map(account => {
        const snap = account.snapshots.find(s => s.monthId === monthId)
        return snap ? Number(snap.balance) : 0
      })
    )
  }

  return (
    <div className="bg-card rounded-[18px] border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="p-4 font-semibold text-foreground w-64 border-b border-border">Investment Account</th>
              {months.map(month => {
                const complete = isMonthComplete(month.id)
                return (
                  <th key={month.id} className="p-4 font-semibold text-foreground text-right min-w-[150px] border-b border-border">
                    <div className="flex items-center justify-end gap-1.5">
                      <span>{month.identifier}</span>
                      <span
                        className={complete ? "text-primary" : "text-muted-foreground/50"}
                        title={complete ? "Complete — every active account and card has a value this month" : "Incomplete — some active account or card is missing a value this month"}
                      >
                        {complete ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          
          {categories.map(category => {
            const categoryAccounts = accountsByCategory[category]
            if (!categoryAccounts || categoryAccounts.length === 0) return null

            return (
              <tbody key={category}>
                {/* Category Header */}
                <tr className="bg-muted/50">
                  <td colSpan={months.length + 1} className="p-4 font-bold text-foreground tracking-wider text-sm">
                    {formatCategoryName(category)}
                  </td>
                </tr>

                {/* Category Accounts */}
                {categoryAccounts.map(account => (
                  <tr key={account.id} className="border-b border-border hover:bg-muted/50 transition-colors group">
                    <td className="p-4 flex items-center justify-between pl-8">
                      <span className={account.active ? "font-medium text-foreground" : "font-medium text-muted-foreground"}>{account.name}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => toggleInvestmentAccountActive(account.id, !account.active)}
                          className={account.active ? "text-primary hover:text-primary/80 p-1" : "text-muted-foreground hover:text-foreground p-1"}
                          title={account.active ? "Active — click to archive" : "Archived — click to reactivate"}
                        >
                          {account.active ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => deleteInvestmentAccount(account.id)}
                          className="text-muted-foreground hover:text-negative p-1"
                          title="Delete Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    {months.map(month => {
                      const snapshot = account.snapshots.find(s => s.monthId === month.id)
                      const balance = snapshot ? Number(snapshot.balance) : ""
                      
                      return (
                        <td key={month.id} className="p-4">
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-muted-foreground text-sm">{currency}</span>
                            <input
                              type="number"
                              defaultValue={balance}
                              onBlur={(e) => handleBlur(account.id, month.id, e.target.value)}
                              placeholder="0.00"
                              className="w-full pl-6 pr-3 py-1.5 bg-transparent hover:bg-muted focus:bg-background border border-transparent rounded text-right text-base text-foreground focus:outline-none focus:border-primary/50 transition-all"
                            />
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}

                {/* Category Subtotal */}
                <tr className="border-b-2 border-border bg-transparent">
                  <td className="p-4 font-medium text-muted-foreground pl-8 text-sm">
                    Total {formatCategoryName(category)}
                  </td>
                  {months.map(month => (
                    <td key={month.id} className="p-4 text-right font-medium text-muted-foreground text-sm">
                      {currency}{getCategoryTotal(category, month.id).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  ))}
                </tr>
              </tbody>
            )
          })}
          
          <tfoot className="bg-primary/10">
            <tr>
              <td className="p-4 font-semibold text-primary text-lg">Total Net Worth</td>
              {months.map(month => (
                <td key={month.id} className="p-4 text-right font-bold text-primary text-lg">
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
