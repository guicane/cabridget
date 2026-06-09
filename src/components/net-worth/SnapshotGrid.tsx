"use client"

import { useState } from "react"
import { upsertSnapshot, deleteInvestmentAccount } from "@/actions/net-worth"
import { Trash2 } from "lucide-react"

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
  snapshots: Snapshot[]
}

type Month = {
  id: string
  identifier: string
}

export function SnapshotGrid({ accounts, months }: { accounts: Account[], months: Month[] }) {
  // Use local state to handle optimistic updates
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const handleBlur = async (accountId: string, monthId: string, value: string) => {
    if (!value || isNaN(Number(value))) return
    
    setIsUpdating(`${accountId}-${monthId}`)
    await upsertSnapshot(accountId, monthId, value)
    setIsUpdating(null)
  }

  // Calculate totals per month
  const getMonthTotal = (monthId: string) => {
    return accounts.reduce((total, account) => {
      const snap = account.snapshots.find(s => s.monthId === monthId)
      return total + (snap ? Number(snap.balance) : 0)
    }, 0)
  }

  return (
    <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5">
              <th className="p-4 font-semibold text-slate-300 w-64 border-b border-white/5">Investment Account</th>
              {months.map(month => (
                <th key={month.id} className="p-4 font-semibold text-slate-300 text-right min-w-[150px] border-b border-white/5">
                  {month.identifier}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {accounts.map(account => (
              <tr key={account.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                <td className="p-4 flex items-center justify-between">
                  <span className="font-medium text-white">{account.name}</span>
                  <button
                    onClick={() => deleteInvestmentAccount(account.id)}
                    className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
                {months.map(month => {
                  const snapshot = account.snapshots.find(s => s.monthId === month.id)
                  const balance = snapshot ? Number(snapshot.balance) : ""
                  
                  return (
                    <td key={month.id} className="p-4">
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-slate-500 text-sm">$</span>
                        <input
                          type="number"
                          defaultValue={balance}
                          onBlur={(e) => handleBlur(account.id, month.id, e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-6 pr-3 py-1.5 bg-slate-900/50 border border-transparent rounded text-right text-sm text-white focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all"
                        />
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-indigo-500/10">
            <tr>
              <td className="p-4 font-semibold text-indigo-400">Total Net Worth</td>
              {months.map(month => (
                <td key={month.id} className="p-4 text-right font-bold text-indigo-400">
                  ${getMonthTotal(month.id).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
