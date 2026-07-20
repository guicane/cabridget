export const dynamic = "force-dynamic";

import { getNetWorthData } from "@/actions/net-worth"
import { AccountManager } from "@/components/net-worth/AccountManager"
import { SnapshotGrid } from "@/components/net-worth/SnapshotGrid"

export default async function NetWorthPage() {
  const { accounts, months } = await getNetWorthData()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Net Worth</h1>
          <p className="text-slate-400">Track your investment accounts and overall financial growth.</p>
        </div>
        <AccountManager />
      </div>

      {accounts.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center border border-border border-dashed">
          <p className="text-muted-foreground text-lg">No investment accounts tracked yet.</p>
          <p className="text-muted-foreground opacity-80 text-sm mt-2">Add your first account to start tracking snapshots.</p>
        </div>
      ) : months.length === 0 ? (
        <div className="bg-card rounded-2xl p-12 text-center border border-border border-dashed">
          <p className="text-muted-foreground text-lg">No months exist yet.</p>
          <p className="text-muted-foreground opacity-80 text-sm mt-2">Please go to the Cash Flow page and create a month before taking snapshots.</p>
        </div>
      ) : (
        <SnapshotGrid accounts={accounts} months={months} />
      )}
    </div>
  )
}
