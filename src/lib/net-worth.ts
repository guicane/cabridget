// Shared net-worth math for a single month, used by both the snapshot
// grid and the trend chart so the two never drift apart on what "net
// worth for this month" actually means.

import { sumAmounts } from "./money"

type SnapshotLike = { monthId: string; balance: number }
type AccountLike = { snapshots: SnapshotLike[] }
type MonthLike = { id: string; creditCardStatements: { balance: number }[] }

export function computeMonthTotal(accounts: AccountLike[], month: MonthLike): number {
  const assets = sumAmounts(
    accounts.map(account => {
      const snap = account.snapshots.find(s => s.monthId === month.id)
      return snap ? snap.balance : 0
    })
  )

  const ccDebt = sumAmounts(month.creditCardStatements.map(cc => cc.balance))

  return sumAmounts([assets, -ccDebt])
}

// A month "has data" once at least one snapshot or credit card statement
// has been entered for it — distinguishes a genuine $0 net worth from a
// month nobody has filled in yet.
export function monthHasData(accounts: AccountLike[], month: MonthLike): boolean {
  const hasSnapshot = accounts.some(a => a.snapshots.some(s => s.monthId === month.id))
  return hasSnapshot || month.creditCardStatements.length > 0
}
