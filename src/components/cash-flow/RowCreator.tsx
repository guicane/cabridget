"use client"

import { useState } from "react"
import { addCashFlowRow } from "@/actions/cash-flow"
import { Plus } from "lucide-react"

export function RowCreator() {
  const [isPending, setIsPending] = useState(false)

  async function handleCreate(formData: FormData) {
    const description = formData.get("description") as string
    if (!description) return

    setIsPending(true)
    await addCashFlowRow(formData)
    setIsPending(false)
  }

  return (
    <form action={handleCreate} className="flex items-center gap-2">
      <select
        name="type"
        required
        className="px-4 py-2 bg-input border border-border rounded-lg text-base text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
      >
        <option value="Income">Income</option>
        <option value="Bill">Bill</option>
        <option value="CreditCardPayment">Credit Card</option>
      </select>
      <input
        type="text"
        name="description"
        placeholder="e.g. Netflix"
        required
        className="px-4 py-2 bg-input border border-border rounded-lg text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
      />
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
      >
        <Plus className="w-4 h-4" />
        {isPending ? "Adding..." : "Add Row"}
      </button>
    </form>
  )
}
