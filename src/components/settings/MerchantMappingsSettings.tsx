"use client"

import { useRef, useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { addMerchantMapping, deleteMerchantMapping } from "@/actions/statement-import"
import { cn } from "@/lib/utils"

type MerchantMapping = { id: string, pattern: string, type: "Bill" | "Income", targetName: string, targetCompany: string | null }

export function MerchantMappingsSettings({ initialMappings }: { initialMappings: MerchantMapping[] }) {
  const [mappings, setMappings] = useState(initialMappings)
  const [type, setType] = useState<"Bill" | "Income">("Bill")
  const formRef = useRef<HTMLFormElement>(null)

  const handleAddMapping = async (formData: FormData) => {
    const mapping = await addMerchantMapping(formData)
    if (mapping) {
      setMappings(prev => [...prev.filter(m => m.pattern !== mapping.pattern), mapping].sort((a, b) => a.pattern.localeCompare(b.pattern)))
    }
    formRef.current?.reset()
    setType("Bill")
  }

  const handleDeleteMapping = async (id: string) => {
    setMappings(prev => prev.filter(m => m.id !== id))
    await deleteMerchantMapping(id)
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-4">
        Map text that appears on a bank statement to a bill or income source, so "Import Statement" on the Monthly Cashflow page knows what each transaction is. Bill mappings only match outgoing money; Income mappings only match incoming money. These apply to every statement you import.
      </p>

      <div className="space-y-1 mb-4">
        {mappings.length === 0 ? (
          <p className="text-muted-foreground text-sm">No mappings yet.</p>
        ) : (
          mappings.map(m => (
            <div key={m.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 group">
              <div className="text-sm flex items-center gap-2">
                <span className={cn(
                  "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded",
                  m.type === "Income" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {m.type}
                </span>
                <span className="text-foreground font-medium">{m.pattern}</span>
                <span className="text-muted-foreground">→ {m.targetName}{m.targetCompany ? ` (${m.targetCompany})` : ""}</span>
              </div>
              <button onClick={() => handleDeleteMapping(m.id)} className="text-muted-foreground hover:text-negative opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      <form ref={formRef} action={handleAddMapping} className="space-y-2">
        <div className="flex gap-2">
          {(["Bill", "Income"] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                type === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
          <input type="hidden" name="type" value={type} />
        </div>
        <div className="flex flex-col md:flex-row gap-2">
          <input name="pattern" placeholder="Statement text (e.g. NETFLIX.COM)" required
            className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          <input name="targetName" placeholder={type === "Income" ? "Income source (e.g. Salary)" : "Bill name (e.g. Netflix)"} required
            className="flex-1 px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          <button type="submit" className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm flex items-center justify-center gap-1">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </form>
    </div>
  )
}
