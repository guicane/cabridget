"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { X, Upload, Loader2, CheckCircle2, Circle, Plus } from "lucide-react"
import { previewStatementImport, commitStatementImport, addMerchantMapping, type ImportPreview, type UnmatchedRow } from "@/actions/statement-import"
import { useSettings } from "@/components/providers/SettingsProvider"
import { cn } from "@/lib/utils"

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function ImportStatementModal({ onClose }: { onClose: () => void }) {
  const { currency } = useSettings()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const now = new Date()
  // Default to whatever year the sheet is currently showing (the "year"
  // query param YearSelector drives), not the real current year — a
  // statement dated in a year other than what's on screen otherwise looks
  // like the import silently did nothing, since that year's columns
  // aren't rendered at all.
  const pageYear = parseInt(searchParams.get("year") || "", 10) || now.getFullYear()
  const [month, setMonth] = useState(MONTH_NAMES[now.getMonth()])
  const [year, setYear] = useState(pageYear)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [included, setIncluded] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [done, setDone] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<File | null>(null)

  // Inline "create a mapping" form state for the Not-matched section.
  const [expandedUnmatched, setExpandedUnmatched] = useState<number | null>(null)
  const [mappingType, setMappingType] = useState<"Bill" | "Income">("Bill")
  const [mappingPattern, setMappingPattern] = useState("")
  const [mappingTargetName, setMappingTargetName] = useState("")
  const [mappingTargetCompany, setMappingTargetCompany] = useState("")
  const [isSavingMapping, setIsSavingMapping] = useState(false)

  const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i)

  const runPreview = async (file: File) => {
    const formData = new FormData()
    formData.set("file", file)
    formData.set("month", month)
    formData.set("year", String(year))
    const result = await previewStatementImport(formData)

    if ("error" in result) {
      setError(result.error)
      return false
    }
    setPreview(result)
    setIncluded(new Set(result.matched.map((_, i) => i)))
    return true
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    fileRef.current = file

    setIsParsing(true)
    setError(null)
    setPreview(null)
    await runPreview(file)
    setIsParsing(false)
  }

  const openMappingForm = (i: number, row: UnmatchedRow) => {
    setExpandedUnmatched(i)
    setMappingType(row.direction === "in" ? "Income" : "Bill")
    setMappingPattern(row.description)
    setMappingTargetName("")
    setMappingTargetCompany("")
  }

  // Creates the mapping, then re-runs the preview against the same file so
  // the newly-matched transaction moves out of "Not matched" immediately —
  // without this, the user would have to leave the modal, go add the
  // mapping in Settings, and re-upload the file from scratch.
  const handleSaveMapping = async () => {
    if (!mappingPattern.trim() || !mappingTargetName.trim() || !fileRef.current) return
    setIsSavingMapping(true)

    const fd = new FormData()
    fd.set("pattern", mappingPattern.trim())
    fd.set("type", mappingType)
    fd.set("targetName", mappingTargetName.trim())
    if (mappingType === "Bill") fd.set("targetCompany", mappingTargetCompany.trim())
    await addMerchantMapping(fd)
    await runPreview(fileRef.current)

    setIsSavingMapping(false)
    setExpandedUnmatched(null)
  }

  const handleImport = async () => {
    if (!preview) return
    setIsImporting(true)
    const rowsToImport = preview.matched.filter((_, i) => included.has(i))
    await commitStatementImport(rowsToImport)
    setIsImporting(false)
    setDone(rowsToImport.length)
  }

  // Neither revalidatePath nor the Server-Action-side refresh() reliably
  // updated the already-mounted sheet in this app — a real browser
  // navigation is the one thing confirmed to work, so use it explicitly
  // instead of trusting the framework's implicit client refresh.
  const handleDone = () => {
    if (year !== pageYear) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("year", String(year))
      window.location.href = `${pathname}?${params.toString()}`
    } else {
      window.location.reload()
    }
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
              <button onClick={handleDone} className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
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
                    Create a mapping below, or add one in <Link href="/settings" className="text-primary hover:underline">Settings</Link> and re-upload to include these.
                  </p>
                  <div className="space-y-1 text-sm">
                    {preview.unmatched.map((row, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between gap-2 p-2 text-muted-foreground">
                          <span className="truncate flex-1">
                            <span className="opacity-60">{row.direction === "in" ? "money in ·" : "money out ·"}</span> {row.description} <span className="opacity-60">×{row.count}</span>
                          </span>
                          <span className="shrink-0">{currency}{row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <button
                            onClick={() => expandedUnmatched === i ? setExpandedUnmatched(null) : openMappingForm(i, row)}
                            className="shrink-0 p-1 rounded hover:bg-muted/50 hover:text-primary transition-colors"
                            title="Create a mapping for this"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        {expandedUnmatched === i && (
                          <div className="p-3 mb-1 bg-muted/30 rounded-lg space-y-2">
                            <div className="flex gap-2">
                              {(["Bill", "Income"] as const).map(t => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setMappingType(t)}
                                  className={cn(
                                    "px-3 py-1 rounded-lg text-xs font-medium transition-colors",
                                    mappingType === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                            <input
                              value={mappingPattern}
                              onChange={e => setMappingPattern(e.target.value)}
                              placeholder="Statement text to match"
                              className="w-full px-3 py-1.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                            />
                            <input
                              value={mappingTargetName}
                              onChange={e => setMappingTargetName(e.target.value)}
                              placeholder={mappingType === "Income" ? "Income source (e.g. Salary)" : "Bill name (e.g. Netflix)"}
                              className="w-full px-3 py-1.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                            />
                            {mappingType === "Bill" && (
                              <input
                                value={mappingTargetCompany}
                                onChange={e => setMappingTargetCompany(e.target.value)}
                                placeholder="Company (optional)"
                                className="w-full px-3 py-1.5 bg-input border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                              />
                            )}
                            <div className="flex items-center gap-3 pt-1">
                              <button
                                onClick={handleSaveMapping}
                                disabled={isSavingMapping || !mappingPattern.trim() || !mappingTargetName.trim()}
                                className="px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                              >
                                {isSavingMapping && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                Save &amp; match
                              </button>
                              <button onClick={() => setExpandedUnmatched(null)} className="text-xs text-muted-foreground hover:text-foreground">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
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
