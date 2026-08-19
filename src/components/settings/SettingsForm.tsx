"use client"

import { useState } from "react"
import { updateSettings } from "@/actions/settings"
import { Save } from "lucide-react"

export function SettingsForm({ initialCurrency }: { initialCurrency: string }) {
  const [isPending, setIsPending] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave(formData: FormData) {
    setIsPending(true)
    setSaved(false)
    
    await updateSettings(formData)
    
    setIsPending(false)
    setSaved(true)
    
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form action={handleSave} className="space-y-6">
      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-foreground mb-2">
          Currency Symbol
        </label>
        <div className="flex gap-4 items-center">
          <input
            type="text"
            id="currency"
            name="currency"
            defaultValue={initialCurrency}
            placeholder="e.g. $, €, £"
            maxLength={5}
            required
            className="w-24 px-4 py-2 bg-input border border-border rounded-lg text-lg font-medium text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
          />
          <p className="text-muted-foreground text-sm">
            This symbol will be displayed globally across all Cash Flow and Net Worth views.
          </p>
        </div>
      </div>

      <div className="pt-4 flex items-center gap-4 border-t border-border">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isPending ? "Saving..." : "Save Preferences"}
        </button>
        
        {saved && (
          <span className="text-primary text-sm font-medium animate-in fade-in">
            Preferences saved!
          </span>
        )}
      </div>
    </form>
  )
}
