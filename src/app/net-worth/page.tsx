export const dynamic = "force-dynamic";

import { getNetWorthData } from "@/actions/net-worth"
import { AccountManager } from "@/components/net-worth/AccountManager"
import { SnapshotGrid } from "@/components/net-worth/SnapshotGrid"
import { NetWorthChart } from "@/components/net-worth/NetWorthChart"
import { YearSelector } from "@/components/YearSelector"

export default async function NetWorthPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const yearStr = searchParams?.year;
  const year = yearStr ? parseInt(yearStr as string, 10) : new Date().getFullYear();

  const { accounts, months, creditCards } = await getNetWorthData(year)

  const serializedAccounts = accounts.map((acc: any) => ({
    ...acc,
    snapshots: acc.snapshots.map((snap: any) => ({
      ...snap,
      balance: Number(snap.balance)
    }))
  }))

  const serializedMonths = months.map((m: any) => ({
    ...m,
    creditCardStatements: m.creditCardStatements.map((cc: any) => ({
      ...cc,
      balance: Number(cc.balance)
    }))
  }))

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Net Worth</h1>
          <p className="text-muted-foreground">Track your investment accounts and overall financial growth.</p>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
          <AccountManager />
          <div className="w-px h-8 bg-border hidden md:block" />
          <YearSelector currentYear={year} />
        </div>
      </div>

      <NetWorthChart accounts={serializedAccounts as any} months={serializedMonths as any} />

      <SnapshotGrid accounts={serializedAccounts as any} months={serializedMonths as any} creditCards={creditCards} />
    </div>
  )
}
