"use client"

import { useRef, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { addMerchantMapping, deleteMerchantMapping } from "@/actions/statement-import"

type MerchantMapping = { id: string, pattern: string, billName: string, billCompany: string | null }

export function MerchantMappingsSettings({ initialMappings }: { initialMappings: MerchantMapping[] }) {
  const [mappings, setMappings] = useState(initialMappings)
  const formRef = useRef<HTMLFormElement>(null)

  const handleAddMapping = async (formData: FormData) => {
    const mapping = await addMerchantMapping(formData)
    if (mapping) {
      setMappings(prev => [...prev.filter(m => m.pattern !== mapping.pattern), mapping].sort((a, b) => a.pattern.localeCompare(b.pattern)))
    }
    formRef.current?.reset()
  }

  const handleDeleteMapping = async (id: string) => {
    setMappings(prev => prev.filter(m => m.id !== id))
    await deleteMerchantMapping(id)
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-4">
        Map text that appears on a bank statement to a bill name, so "Import Statement" on the Monthly Cashflow page knows what each transaction is. These apply to every statement you import.
      </p>

      <div className="space-y-1 mb-4">
        {mappings.length === 0 ? (
          <p className="text-muted-foreground text-sm">No mappings yet.</p>
        ) : (
          mappings.map(m => (
            <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group">
              <div className="text-sm">
                <span className="text-foreground font-medium">{m.pattern}</span>
                <span className="text-muted-foreground"> → {m.billName}{m.billCompany ? ` (${m.billCompany})` : ""}</span>
              </div>
              <button onClick={() => handleDeleteMapping(m.id)} className="text-muted-foreground hover:text-negative opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <form ref={formRef} action={handleAddMapping} className="flex flex-col md:flex-row gap-2">
        <input name="pattern" placeholder="Statement text (e.g. NETFLIX.COM)" required
          className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
        <input name="billName" placeholder="Bill name (e.g. Netflix)" required
          className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
        <button type="submit" className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm flex items-center justify-center gap-1">
          <Plus className="w-4 h-4" /> Add
        </button>
      </form>
    </div>
  )
}
