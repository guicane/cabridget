"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { X, Upload, Loader2, CheckCircle2, Circle } from "lucide-react"
import { previewStatementImport, commitStatementImport, type ImportPreview } from "@/actions/statement-import"
import { useSettings } from "@/components/providers/SettingsProvider"
import { cn } from "@/lib/utils"

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function ImportStatementModal({ onClose }: { onClose: () => void }) {
  const { currency } = useSettings()
  const now = new Date()
  const [month, setMonth] = useState(MONTH_NAMES[now.getMonth()])
  const [year, setYear] = useState(now.getFullYear())
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [included, setIncluded] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [done, setDone] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsParsing(true)
    setError(null)
    setPreview(null)

    const formData = new FormData()
    formData.set("file", file)
    formData.set("month", month)
    formData.set("year", String(year))
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
              <p className="text-foreground font-medium">Imported {done} item{done === 1 ? "" : "s"}.</p>
              <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
                Done
              </button>
            </div>
          ) : preview ? (
            <>
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Matched — {preview.matched.length} item{preview.matched.length === 1 ? "" : "s"} detected
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
                        <span className={cn(
                          "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0",
                          row.kind === "Income" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {row.kind}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-foreground font-medium">{row.targetName}{row.targetCompany ? ` (${row.targetCompany})` : ""}</div>
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
                  <p className="text-xs text-muted-foreground mb-3">
                    Add a mapping in <Link href="/settings" className="text-primary hover:underline">Settings</Link> and re-upload to include these.
                  </p>
                  <div className="space-y-1 text-sm">
                    {preview.unmatched.map((row, i) => (
                      <div key={i} className="flex items-center justify-between p-2 text-muted-foreground">
                        <span className="truncate">
                          <span className="opacity-60">{row.direction === "in" ? "money in ·" : "money out ·"}</span> {row.description} <span className="opacity-60">×{row.count}</span>
                        </span>
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
                  Import {included.size} item{included.size === 1 ? "" : "s"}
                </button>
                <button onClick={() => { setPreview(null); setError(null); if (fileInputRef.current) fileInputRef.current.value = "" }} className="text-sm text-muted-foreground hover:text-foreground">
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground mb-4">
                Matches transactions against the merchant mappings configured in <Link href="/settings" className="text-primary hover:underline">Settings</Link>.
              </p>

              <div className="mb-5">
                <label className="block text-sm font-medium text-muted-foreground mb-2">Import into</label>
                <div className="flex items-center gap-2">
                  <select
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                    className="px-3 py-1.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
                  >
                    {MONTH_NAMES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                    className="px-3 py-1.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
                  >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Every transaction in this statement will be imported into this one month, regardless of the individual dates on the statement.
                </p>
              </div>

              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-[18px] p-8 cursor-pointer hover:border-primary transition-colors">
                {isParsing ? <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" /> : <Upload className="w-6 h-6 text-muted-foreground" />}
                <span className="text-sm text-muted-foreground">{isParsing ? "Parsing..." : "Click to choose a .csv or .pdf file"}</span>
                <input ref={fileInputRef} type="file" accept=".csv,text/csv,.pdf,application/pdf" className="hidden" onChange={handleFileChange} disabled={isParsing} />
              </label>
              {error && <p className="text-negative text-sm mt-3">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
