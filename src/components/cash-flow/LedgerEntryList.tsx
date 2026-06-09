"use client"

import type { LedgerEntry } from "@prisma/client"
import { deleteLedgerEntry } from "@/actions/cash-flow"
import { Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

export function LedgerEntryList({ entries }: { entries: LedgerEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-slate-500 text-sm italic py-4">No entries recorded for this month.</p>
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-white/5 group hover:border-white/10 transition-colors">
          <div className="flex items-center gap-4">
            <span className={cn(
              "px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider whitespace-nowrap",
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
      ))}
    </div>
  )
}
