import { Wallet, LineChart, Receipt, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Welcome Back</h1>
        <p className="text-muted-foreground text-lg">Here is the high-level trajectory of your finances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Quick Action Card 1 */}
        <Link href="/cash-flow" className="block group">
          <div className="bg-card rounded-2xl p-6 h-full border border-border transition-all duration-300 hover:border-primary/50 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400">
                <Wallet className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-card-foreground">Cash Flow</h2>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Track your macro-level monthly income and major expenses without sweating the small stuff.
            </p>
          </div>
        </Link>

        {/* Quick Action Card 2 */}
        <Link href="/net-worth" className="block group">
          <div className="bg-card rounded-2xl p-6 h-full border border-border transition-all duration-300 hover:border-primary/50 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                <LineChart className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-card-foreground">Net Worth</h2>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Log monthly snapshots of your investment accounts to see your long-term growth.
            </p>
          </div>
        </Link>

        {/* Quick Action Card 3 */}
        <Link href="/monthly-bills" className="block group">
          <div className="bg-card rounded-2xl p-6 h-full border border-border transition-all duration-300 hover:border-primary/50 relative overflow-hidden">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-red-500/10 text-red-500 dark:text-red-400">
                <Receipt className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-card-foreground">Monthly Bills</h2>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Track your expected recurring bills and baseline expenses templates.
            </p>
          </div>
        </Link>

      </div>
    </div>
  )
}
