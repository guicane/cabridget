export const dynamic = "force-dynamic";

import { getMonthById } from "@/actions/cash-flow"
import { LedgerEntryForm } from "@/components/cash-flow/LedgerEntryForm"
import { LedgerEntryList } from "@/components/cash-flow/LedgerEntryList"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default async function MonthSubpage({
  params
}: {
  params: Promise<{ monthId: string }>
}) {
  const { monthId } = await params
  const month = await getMonthById(monthId)

  if (!month) {
    notFound()
  }

  // Calculate totals
  const income = month.ledgerEntries.filter(e => e.type === "Income").reduce((sum, e) => sum + Number(e.amount), 0)
  const bills = month.ledgerEntries.filter(e => e.type === "Bill").reduce((sum, e) => sum + Number(e.amount), 0)
  const ccPayments = month.ledgerEntries.filter(e => e.type === "CreditCardPayment").reduce((sum, e) => sum + Number(e.amount), 0)
  const netCashFlow = income - bills - ccPayments

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex items-center gap-4">
        <Link 
          href="/cash-flow" 
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{month.identifier} Details</h1>
          <p className="text-slate-400 mt-1">Manage entries for this month.</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mb-1">Net Cash Flow</p>
            <p className={`text-3xl font-bold ${netCashFlow >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              ${netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex items-center gap-8 bg-slate-900/50 p-4 rounded-xl border border-white/5">
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

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium text-white mb-4">Add Entry</h3>
            <LedgerEntryForm monthId={month.id} />
          </div>

          <div>
            <h3 className="text-lg font-medium text-white mb-4">Ledger</h3>
            <LedgerEntryList entries={month.ledgerEntries} />
          </div>
        </div>
      </div>
    </div>
  )
}
