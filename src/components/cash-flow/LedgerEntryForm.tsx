"use client"

import { useRef, useState } from "react"
import { addLedgerEntry } from "@/actions/cash-flow"
import { Plus } from "lucide-react"

export function LedgerEntryForm({ monthId }: { monthId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setIsPending(true)
    await addLedgerEntry(formData)
    formRef.current?.reset()
    setIsPending(false)
  }

  return (
    <form ref={formRef} action={handleSubmit} className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-slate-900/40 p-4 rounded-xl border border-white/5">
      <input type="hidden" name="monthId" value={monthId} />
      
      <select 
        name="type" 
        required
        className="w-full md:w-auto px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
      >
        <option value="Income">Income</option>
        <option value="Bill">Bill</option>
        <option value="CreditCardPayment">Credit Card Payment</option>
      </select>

      <input
        type="text"
        name="description"
        placeholder="Description (e.g. Salary, Rent, Chase Sapphire)"
        required
        className="w-full flex-1 px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
      />

      <div className="relative w-full md:w-32">
        <span className="absolute left-3 top-2.5 text-slate-500 text-sm">$</span>
        <input
          type="number"
          name="amount"
          step="0.01"
          min="0"
          placeholder="0.00"
          required
          className="w-full pl-7 pr-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full md:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
      >
        <Plus className="w-4 h-4" />
        {isPending ? "Adding..." : "Add"}
      </button>
    </form>
  )
}
