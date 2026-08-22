"use client"

import { useRef, useState } from "react"
import { X, Upload, Plus, Trash2, Loader2, CheckCircle2, Circle } from "lucide-react"
import {
  addMerchantMapping, deleteMerchantMapping,
  previewStatementImport, commitStatementImport,
  type MatchedRow, type ImportPreview
} from "@/actions/statement-import"
import { useSettings } from "@/components/providers/SettingsProvider"

type MerchantMapping = { id: string, pattern: string, billName: string, billCompany: string | null }

export function ImportStatementModal({
  initialMappings,
  onClose
}: {
  initialMappings: MerchantMapping[]
  onClose: () => void
}) {
  const { currency } = useSettings()
  const [mappings, setMappings] = useState(initialMappings)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [included, setIncluded] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [done, setDone] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsing(true)
    setError(null)
    setPreview(null)

    const formData = new FormData()
    formData.set("file", file)
    const result = await previewStatementImport(formData)
    setIsParsing(false)

    if ("error" in result) {
      setError(result.error)
    } else {
      setPreview(result)
      setIncluded(new Set(result.matched.map((_, i) => i)))
    }
  }

  const handleImport = async () => {
    if (!preview) return
    setIsImporting(true)
    const rowsToImport = preview.matched.filter((_, i) => included.has(i))
    await commitStatementImport(rowsToImport)
    setIsImporting(false)
    setDone(rowsToImport.length)
  }

  const toggleIncluded = (i: number) => {
    setIncluded(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-[18px] border border-border w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-lg text-foreground font-medium">Import Statement</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {done !== null ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="text-foreground font-medium">Imported {done} bill{done === 1 ? "" : "s"}.</p>
              <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
                Done
              </button>
            </div>
          ) : preview ? (
            <>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Matched — {preview.matched.length} bill{preview.matched.length === 1 ? "" : "s"} detected
                </h3>
                {preview.matched.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No transactions matched a known merchant.</p>
                ) : (
                  <div className="space-y-1">
                    {preview.matched.map((row, i) => (
                      <button
                        key={i}
                        onClick={() => toggleIncluded(i)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        {included.has(i) ? <CheckCircle2 className="w-5 h-5 text-primary shrink-0" /> : <Circle className="w-5 h-5 text-muted-foreground shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <div className="text-foreground font-medium">{row.billName}{row.billCompany ? ` (${row.billCompany})` : ""}</div>
                          <div className="text-xs text-muted-foreground">{row.monthIdentifier} · {row.transactionCount} transaction{row.transactionCount === 1 ? "" : "s"}</div>
                        </div>
                        <div className="text-foreground font-medium">{currency}{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {preview.unmatched.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Not matched — {preview.unmatched.length} merchant{preview.unmatched.length === 1 ? "" : "s"}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">Add a mapping below (with the exact or a distinctive part of the merchant text) and re-upload to include these.</p>
                  <div className="space-y-1 text-sm">
                    {preview.unmatched.map((row, i) => (
                      <div key={i} className="flex items-center justify-between p-2 text-muted-foreground">
                        <span className="truncate">{row.description} <span className="opacity-60">×{row.count}</span></span>
                        <span>{currency}{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleImport}
                  disabled={isImporting || included.size === 0}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isImporting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Import {included.size} bill{included.size === 1 ? "" : "s"}
                </button>
                <button onClick={() => { setPreview(null); setError(null); if (fileInputRef.current) fileInputRef.current.value = "" }} className="text-sm text-muted-foreground hover:text-foreground">
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Merchant Mappings
                </h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Map text that appears on your statement to a bill name, so imports know what each transaction is.
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

              <div className="border-t border-border pt-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Upload Statement (CSV)
                </h3>
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-[18px] p-8 cursor-pointer hover:border-primary transition-colors">
                  {isParsing ? <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
                  <span className="text-sm text-muted-foreground">{isParsing ? "Parsing..." : "Click to choose a .csv file"}</span>
                  <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileChange} disabled={isParsing} />
                </label>
                {error && <p className="text-negative text-sm mt-3">{error}</p>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
