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
      <input
        type="text"
        name="name"
        placeholder="e.g. Fidelity 401k"
        required
        className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
      />
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Plus className="w-4 h-4" />
        {isPending ? "Adding..." : "Add Account"}
      </button>
    </form>
  )
}
