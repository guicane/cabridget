import { Wallet, LineChart, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Welcome Back</h1>
        <p className="text-slate-400 text-lg">Here is the high-level trajectory of your finances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Quick Action Card 1 */}
        <Link href="/cash-flow" className="block group">
          <div className="glass-card rounded-2xl p-6 h-full border border-white/5 transition-all duration-300 hover:border-primary/50 hover:bg-white/5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all duration-500" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                <Wallet className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-white">Cash Flow</h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Track your macro-level monthly income and major expenses without sweating the small stuff.
            </p>
          </div>
        </Link>

        {/* Quick Action Card 2 */}
        <Link href="/net-worth" className="block group">
          <div className="glass-card rounded-2xl p-6 h-full border border-white/5 transition-all duration-300 hover:border-primary/50 hover:bg-white/5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-500" />
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                <LineChart className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-semibold text-white">Net Worth</h2>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Log monthly snapshots of your investment accounts to see your long-term growth.
            </p>
          </div>
        </Link>

        {/* Empty State / Future Module */}
        <div className="glass-card rounded-2xl p-6 h-full border border-white/5 relative overflow-hidden opacity-50">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-slate-800 text-slate-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-semibold text-white">Trajectory</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            Historical charts and financial projections will appear here once you add more data.
          </p>
        </div>

      </div>
    </div>
  )
}
