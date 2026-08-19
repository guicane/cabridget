"use client"

import { useState } from "react"
import { addInvestmentAccount } from "@/actions/net-worth"
import { Plus } from "lucide-react"

export function AccountManager() {
  const [isPending, setIsPending] = useState(false)

  async function handleCreate(formData: FormData) {
    const name = formData.get("name") as string
    if (!name) return

    setIsPending(true)
    await addInvestmentAccount(formData)
    setIsPending(false)
  }

  return (
    <form action={handleCreate} className="flex items-center gap-2">
      <select
        name="category"
        required
        className="px-4 py-2 bg-input border border-border rounded-lg text-base text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
      >
        <option value="Pensions">Pensions</option>
        <option value="StockISA">Stock ISA</option>
        <option value="Shares">Shares</option>
        <option value="Savings">Savings</option>
      </select>
      <input
        type="text"
        name="name"
        placeholder="e.g. Fidelity 401k"
        required
        className="px-4 py-2 bg-input border border-border rounded-lg text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
      />
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-gradient-primary text-[#0c0b12] text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Plus className="w-4 h-4" />
        {isPending ? "Adding..." : "Add Account"}
      </button>
    </form>
  )
}
