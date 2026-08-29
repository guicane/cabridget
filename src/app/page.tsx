import { LineChart, Receipt, ArrowUpRight, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import { getDashboardData } from "@/actions/dashboard"
import { getSettings } from "@/actions/settings"
import { NetWorthTrendMini } from "@/components/dashboard/NetWorthTrendMini"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function Home() {
  const [data, settings] = await Promise.all([getDashboardData(), getSettings()])
  const { cashflow, netWorth, trendPoints, currentMonthLabel } = data
  const { currency } = settings

  const fmt = (n: number) => `${currency}${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
      <div>
        <h1 className="text-4xl tracking-tight text-foreground mb-2">Welcome back</h1>
        <p className="text-muted-foreground text-lg">Here is the high-level trajectory of your finances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px]">
        <Link href="/monthly-bills" className="block group">
          <div className="bg-card rounded-[18px] p-6 h-full border border-border transition-colors duration-300 hover:border-primary relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-primary text-[#0c0b12]">
                  <Receipt className="w-6 h-6" />
                </div>
                <h2 className="text-xl text-card-foreground">Monthly Cashflow</h2>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-5">
              Income, bills, and credit cards for {currentMonthLabel}.
            </p>
            {cashflow.hasData ? (
              <div className="grid grid-cols-3 gap-3 mt-auto">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Income</div>
                  <div className="text-lg font-semibold text-primary truncate">{fmt(cashflow.income)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Outgoing</div>
                  <div className="text-lg font-semibold text-foreground truncate">{fmt(cashflow.outgoing)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Difference</div>
                  <div className={cn("text-lg font-semibold truncate", cashflow.difference > 0 ? "text-negative" : "text-primary")}>
                    {fmt(cashflow.difference)}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic mt-auto">No entries yet for {currentMonthLabel}.</p>
            )}
          </div>
        </Link>

        <Link href="/net-worth" className="block group">
          <div className="bg-card rounded-[18px] p-6 h-full border border-border transition-colors duration-300 hover:border-primary relative overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-primary text-[#0c0b12]">
                  <LineChart className="w-6 h-6" />
                </div>
                <h2 className="text-xl text-card-foreground">Net Worth</h2>
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300" />
            </div>
            {netWorth.hasData ? (
              <>
                <div className="flex items-baseline gap-3 mb-1 flex-wrap">
                  <span className="text-3xl font-bold text-card-foreground">{fmt(netWorth.total)}</span>
                  {netWorth.delta !== null && netWorth.delta !== 0 && (
                    <span className={cn("flex items-center gap-1 text-sm font-medium", netWorth.delta > 0 ? "text-primary" : "text-negative")}>
                      {netWorth.delta > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {netWorth.delta > 0 ? "+" : ""}{fmt(netWorth.delta)}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">as of {currentMonthLabel}</p>
                <div className="mt-auto">
                  <NetWorthTrendMini points={trendPoints} />
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-sm leading-relaxed mt-auto">
                Log monthly snapshots of your investment accounts to see your long-term growth.
              </p>
            )}
          </div>
        </Link>
      </div>
    </div>
  )
}
