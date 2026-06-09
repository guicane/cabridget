import { getMonths } from "@/actions/cash-flow"
import { MonthList } from "@/components/cash-flow/MonthList"
import { MonthCreator } from "@/components/cash-flow/MonthCreator"

export default async function CashFlowPage() {
  const months = await getMonths()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Cash Flow</h1>
          <p className="text-slate-400">Track your macro-level income and major expenses.</p>
        </div>
        <MonthCreator />
      </div>

      {months.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-white/5 border-dashed">
          <p className="text-slate-400 text-lg">No months tracked yet.</p>
          <p className="text-slate-500 text-sm mt-2">Create a new month to start logging your cash flow.</p>
        </div>
      ) : (
        <MonthList initialMonths={months} />
      )}
    </div>
  )
}
