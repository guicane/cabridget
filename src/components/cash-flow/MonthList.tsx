"use client"

import { useState } from "react"
import type { Month, LedgerEntry } from "@prisma/client"
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react"
import { deleteLedgerEntry } from "@/actions/cash-flow"
import { LedgerEntryForm } from "./LedgerEntryForm"
import { cn } from "@/lib/utils"

type MonthWithEntries = Month & { ledgerEntries: LedgerEntry[] }

export function MonthList({ initialMonths }: { initialMonths: MonthWithEntries[] }) {
  const [expandedMonth, setExpandedMonth] = useState<string | null>(initialMonths[0]?.id || null)

  return (
    <div className="space-y-4">
      {initialMonths.map((month) => {
        const isExpanded = expandedMonth === month.id
        
        // Calculate totals
        const income = month.ledgerEntries.filter(e => e.type === "Income").reduce((sum, e) => sum + Number(e.amount), 0)
        const bills = month.ledgerEntries.filter(e => e.type === "Bill").reduce((sum, e) => sum + Number(e.amount), 0)
        const ccPayments = month.ledgerEntries.filter(e => e.type === "CreditCardPayment").reduce((sum, e) => sum + Number(e.amount), 0)
        const netCashFlow = income - bills - ccPayments

        return (
          <div key={month.id} className="glass-card rounded-2xl border border-white/5 overflow-hidden transition-all duration-300">
            {/* Header / Summary Row */}
            <button
              onClick={() => setExpandedMonth(isExpanded ? null : month.id)}
              className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{month.identifier}</h2>
                  <p className={cn(
                    "text-sm font-medium mt-1",
                    netCashFlow >= 0 ? "text-emerald-400" : "text-red-400"
                  )}>
                    Net: ${netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-8 text-sm">
                <div className="text-right">
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Income</p>
                  <p className="text-emerald-400 font-medium">${income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">Bills</p>
                  <p className="text-red-400 font-medium">${bills.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold mb-1">CC Payments</p>
                  <p className="text-amber-400 font-medium">${ccPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </button>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-white/5 p-6 bg-black/20">
                <LedgerEntryForm monthId={month.id} />

                <div className="mt-8 space-y-2">
                  {month.ledgerEntries.length === 0 ? (
                    <p className="text-slate-500 text-sm italic text-center py-4">No entries recorded for this month.</p>
                  ) : (
                    month.ledgerEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-white/5 group hover:border-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider",
                            entry.type === "Income" && "bg-emerald-500/10 text-emerald-400",
                            entry.type === "Bill" && "bg-red-500/10 text-red-400",
                            entry.type === "CreditCardPayment" && "bg-amber-500/10 text-amber-400"
                          )}>
                            {entry.type.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-slate-300 font-medium">{entry.description}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-white font-medium">
                            ${Number(entry.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <button
                            onClick={() => deleteLedgerEntry(entry.id)}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
