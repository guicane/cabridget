"use client"

import { useState } from "react"
import { NetWorthChart } from "./NetWorthChart"
import { SnapshotGrid } from "./SnapshotGrid"

type Snapshot = { id: string; accountId: string; monthId: string; balance: number; month: { identifier: string } }
type Account = { id: string; name: string; category: string; active: boolean; snapshots: Snapshot[] }
type Month = { id: string; identifier: string; creditCardStatements: { balance: number; creditCardId: string }[] }
type CreditCard = { id: string; name: string }

// Owns the one piece of state both the chart and the grid need to agree
// on: values saved during this page view. upsertSnapshot's revalidatePath
// doesn't reliably refresh an already-mounted client tree in this app, so
// without this, a successful save would show correctly in the edited
// input (native browser behavior) but the chart above and the Total row
// below would both keep showing the pre-save numbers until a full reload.
export function NetWorthView({ accounts, months, creditCards }: { accounts: Account[]; months: Month[]; creditCards: CreditCard[] }) {
  const [overrides, setOverrides] = useState<Map<string, number>>(new Map())

  const handleSaved = (accountId: string, monthId: string, balance: number) => {
    setOverrides(prev => new Map(prev).set(`${accountId}__${monthId}`, balance))
  }

  const effectiveAccounts: Account[] = accounts.map(account => {
    const snapshots = months.reduce<Snapshot[]>((acc, month) => {
      const override = overrides.get(`${account.id}__${month.id}`)
      const existing = account.snapshots.find(s => s.monthId === month.id)
      if (override !== undefined) {
        acc.push(existing ? { ...existing, balance: override } : {
          id: `${account.id}__${month.id}`, accountId: account.id, monthId: month.id,
          balance: override, month: { identifier: month.identifier },
        })
      } else if (existing) {
        acc.push(existing)
      }
      return acc
    }, [])
    return { ...account, snapshots }
  })

  return (
    <>
      <NetWorthChart accounts={effectiveAccounts} months={months} />
      <SnapshotGrid accounts={effectiveAccounts} months={months} creditCards={creditCards} onSaved={handleSaved} />
    </>
  )
}
