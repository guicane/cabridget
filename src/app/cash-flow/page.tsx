export const dynamic = "force-dynamic";

import { getMonths } from "@/actions/cash-flow"
import { CashFlowGrid } from "@/components/cash-flow/CashFlowGrid"
import { MonthCreator } from "@/components/cash-flow/MonthCreator"
import { RowCreator } from "@/components/cash-flow/RowCreator"

export default async function CashFlowPage() {
  // getMonths returns months ordered by createdAt desc.
  // We want to display them left to right (oldest to newest), so we might want to reverse them.
  // Wait, SnapshotGrid receives months and displays them left to right.
  // getMonths returns `orderBy: { createdAt: "desc" }`, so newest is first.
  // Usually grids have oldest on left, newest on right, or vice versa. We will reverse them here so newest is on right.
  const rawMonths = await getMonths()
  const months = [...rawMonths].reverse()

  const entries = months.flatMap(m => 
    m.ledgerEntries.map(entry => ({
      ...entry,
      amount: Number(entry.amount)
    }))
  )

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Cash Flow</h1>
          <p className="text-muted-foreground">Track your macro-level income and major expenses.</p>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
          <RowCreator />
          <div className="w-px h-8 bg-border hidden md:block" />
          <MonthCreator />
        </div>
      </div>

      {months.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center border border-border border-dashed">
          <p className="text-muted-foreground text-lg">No months tracked yet.</p>
          <p className="text-muted-foreground opacity-80 text-sm mt-2">Create a new month to start logging your cash flow.</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center border border-border border-dashed">
          <p className="text-muted-foreground text-lg">No line items exist yet.</p>
          <p className="text-muted-foreground opacity-80 text-sm mt-2">Use the "Add Row" button above to add your first income or bill.</p>
        </div>
      ) : (
        <CashFlowGrid months={months} entries={entries} />
      )}
    </div>
  )
}
