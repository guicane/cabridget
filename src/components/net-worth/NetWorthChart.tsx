"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { useSettings } from "@/components/providers/SettingsProvider"
import { computeMonthTotal, monthHasData } from "@/lib/net-worth"
import { cn } from "@/lib/utils"

type Account = { snapshots: { monthId: string; balance: number }[] }
type Month = { id: string; identifier: string; creditCardStatements: { balance: number }[] }

export function NetWorthChart({ accounts, months }: { accounts: Account[]; months: Month[] }) {
  const { currency } = useSettings()

  const points = months.map(month => ({
    month,
    total: computeMonthTotal(accounts, month),
    hasData: monthHasData(accounts, month),
  }))

  const totalsWithData = points.filter(p => p.hasData).map(p => p.total)
  const maxTotal = Math.max(...totalsWithData, 0)
  const minTotal = Math.min(...totalsWithData, 0)
  const baseline = Math.min(minTotal, 0)
  const range = Math.max(maxTotal - baseline, 1)

  // Compare each month against the most recent PRIOR month that actually
  // has data — skipping empty months means a gap doesn't make the next
  // real entry look like a jump from zero.
  let previousTotal: number | null = null
  const bars = points.map(({ month, total, hasData }) => {
    const delta = hasData && previousTotal !== null ? total - previousTotal : null
    if (hasData) previousTotal = total
    return { month, total, hasData, delta }
  })

  const hasAnyData = totalsWithData.length > 0

  return (
    <div className="bg-card rounded-[18px] border border-border p-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">Net Worth Over Time</h3>
      {!hasAnyData ? (
        <p className="text-muted-foreground text-sm">Enter account values below to see the trend here.</p>
      ) : (
        <div className="flex items-end gap-2 h-48">
          {bars.map(({ month, total, hasData, delta }) => {
            const heightPct = hasData ? Math.max(((total - baseline) / range) * 100, 4) : 0
            const isUp = delta !== null && delta > 0
            const isDown = delta !== null && delta < 0

            return (
              <div key={month.id} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                {hasData && delta !== null && (
                  <div className="absolute -top-6 flex items-center gap-0.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {isUp && <TrendingUp className="w-3 h-3 text-primary" />}
                    {isDown && <TrendingDown className="w-3 h-3 text-negative" />}
                    <span className={isUp ? "text-primary" : isDown ? "text-negative" : "text-muted-foreground"}>
                      {isUp ? "+" : ""}{currency}{delta.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    "w-full rounded-t transition-all",
                    !hasData ? "bg-muted border border-dashed border-border" :
                    isUp ? "bg-primary" :
                    isDown ? "bg-negative" :
                    "bg-muted-foreground/40"
                  )}
                  style={{ height: hasData ? `${heightPct}%` : "4px" }}
                  title={hasData
                    ? `${month.identifier}: ${currency}${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    : `${month.identifier}: no data yet`}
                />
                <span className="text-[10px] text-muted-foreground mt-2 whitespace-nowrap">{month.identifier.split(" ")[0]}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
