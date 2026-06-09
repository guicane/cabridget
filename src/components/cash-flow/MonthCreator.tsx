"use client"

import { useState } from "react"
import { getOrCreateMonth } from "@/actions/cash-flow"
import { Plus } from "lucide-react"

export function MonthCreator() {
  const [isPending, setIsPending] = useState(false)

  async function handleCreate(formData: FormData) {
    const identifier = formData.get("identifier") as string
    if (!identifier) return

    setIsPending(true)
    await getOrCreateMonth(identifier)
    setIsPending(false)
  }

  return (
    <form action={handleCreate} className="flex items-center gap-2">
      <input
        type="text"
        name="identifier"
        placeholder="e.g. June 2026"
        required
        className="px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
      />
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Plus className="w-4 h-4" />
        {isPending ? "Creating..." : "Add Month"}
      </button>
    </form>
  )
}
