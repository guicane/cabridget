"use client"

import type { Month, LedgerEntry } from "@prisma/client"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type MonthWithEntries = Month & { ledgerEntries: LedgerEntry[] }

export function MonthList({ initialMonths }: { initialMonths: MonthWithEntries[] }) {
  return (
    <div className="space-y-4">
      {initialMonths.map((month) => {
        // Calculate totals
        const income = month.ledgerEntries.filter(e => e.type === "Income").reduce((sum, e) => sum + Number(e.amount), 0)
        const bills = month.ledgerEntries.filter(e => e.type === "Bill").reduce((sum, e) => sum + Number(e.amount), 0)
        const ccPayments = month.ledgerEntries.filter(e => e.type === "CreditCardPayment").reduce((sum, e) => sum + Number(e.amount), 0)
        const netCashFlow = income - bills - ccPayments

        return (
          <Link 
            key={month.id} 
            href={`/cash-flow/${month.id}`}
            className="block glass-card rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 hover:bg-white/5 hover:border-white/10 group"
          >
            <div className="w-full flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-800 rounded-lg text-slate-400 group-hover:text-white group-hover:bg-indigo-500/20 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white group-hover:text-indigo-300 transition-colors">{month.identifier}</h2>
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
            </div>
          </Link>
        )
      })}
    </div>
  )
}
