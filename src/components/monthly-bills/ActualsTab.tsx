"use client"

import { useState } from "react"
import { addMonthlyBill, deleteMonthlyBill, updateMonthlyBill, copyTemplatesToMonth } from "@/actions/monthly-bills"
import { Trash2, Plus, Pencil, Check, Copy } from "lucide-react"
import type { MonthlyBill, Month } from "@prisma/client"
import { useSettings } from "@/components/providers/SettingsProvider"
import { cn } from "@/lib/utils"

type SerializedMonthlyBill = Omit<MonthlyBill, "amount"> & { amount: number }

export function ActualsTab({ 
  months, 
  bills,
  templates 
}: { 
  months: Month[], 
  bills: SerializedMonthlyBill[],
  templates: any[]
}) {
  const [selectedMonthId, setSelectedMonthId] = useState<string>(months[0]?.id || "")
  const [isPending, setIsPending] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { currency } = useSettings()

  const currentBills = bills.filter(b => b.monthId === selectedMonthId)
  
  const currentMonthObj = months.find(m => m.id === selectedMonthId)
  const monthDate = currentMonthObj ? new Date(`1 ${currentMonthObj.identifier}`) : new Date(NaN)
  const isValidDate = !isNaN(monthDate.getTime())
  
  const now = new Date()
  // Strip time for strict day comparison
  const todayTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

  const processedBills = currentBills.map(bill => {
    let isPending = false
    
    if (isValidDate && bill.dayOfMonth) {
      const dueDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), bill.dayOfMonth).getTime()
      if (todayTime < dueDate) {
        isPending = true
      }
    } else {
      isPending = true
    }

    return { ...bill, isPending }
  })

  const totalPending = processedBills.filter(b => b.isPending).reduce((sum, b) => sum + b.amount, 0)
  const totalPaid = processedBills.filter(b => !b.isPending).reduce((sum, b) => sum + b.amount, 0)

  const missingTemplates = templates.filter(t => 
    !currentBills.some(cb => cb.name === t.name && cb.company === t.company)
  )
  
  const hasMissing = missingTemplates.length > 0
  async function handleCreate(formData: FormData) {
    setIsPending(true)
    await addMonthlyBill(formData)
    setIsPending(false)
    const form = document.getElementById("add-monthly-bill-form") as HTMLFormElement
    if (form) form.reset()
  }

  const handleBlur = async (id: string, field: string, value: string | boolean) => {
    await updateMonthlyBill(id, field, value)
  }

  const handleCopy = async () => {
    setIsPending(true)
    await copyTemplatesToMonth(selectedMonthId)
    setIsPending(false)
  }

  if (months.length === 0) {
    return (
      <div className="bg-card rounded-2xl p-12 text-center border border-border border-dashed">
        <p className="text-muted-foreground text-lg">No months tracked yet.</p>
        <p className="text-muted-foreground opacity-80 text-sm mt-2">Go to Cash Flow to create your first month.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Month Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-muted-foreground">Select Month:</label>
        <select
          value={selectedMonthId}
          onChange={(e) => setSelectedMonthId(e.target.value)}
          className="px-4 py-2 bg-input border border-border rounded-lg text-base text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
        >
          {months.map(m => (
            <option key={m.id} value={m.id}>{m.identifier}</option>
          ))}
        </select>
      </div>

      {/* Add Bill Form */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Add Bill for {months.find(m => m.id === selectedMonthId)?.identifier}</h2>
          {hasMissing && (
            <button
              onClick={handleCopy}
              disabled={isPending}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {currentBills.length === 0 ? "Copy from Recurring" : "Sync Missing from Recurring"}
            </button>
          )}
        </div>
        <form id="add-monthly-bill-form" action={handleCreate} className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <input type="hidden" name="monthId" value={selectedMonthId} />
          <input
            type="text"
            name="name"
            placeholder="Type (e.g. Mortgage)"
            required
            className="w-full md:flex-1 px-4 py-2 bg-input border border-border rounded-lg text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
          />
          <input
            type="text"
            name="company"
            placeholder="Company (e.g. HSBC)"
            className="w-full md:flex-1 px-4 py-2 bg-input border border-border rounded-lg text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
          />
          <div className="relative w-full md:w-32">
            <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">{currency}</span>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0"
              placeholder="0.00"
              required
              className="w-full pl-7 pr-4 py-2 bg-input border border-border rounded-lg text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
            />
          </div>
          <input
            type="number"
            name="dayOfMonth"
            min="1"
            max="31"
            placeholder="Day (1-31)"
            className="w-full md:w-32 px-4 py-2 bg-input border border-border rounded-lg text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
          />
          <button
            type="submit"
            disabled={isPending}
            className="w-full md:w-auto px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 h-[42px]"
          >
            <Plus className="w-4 h-4" />
            {isPending ? "Adding..." : "Add"}
          </button>
        </form>
      </div>

      {/* Bills List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {currentBills.length === 0 ? (
          <div className="p-12 text-center border-dashed">
            <p className="text-muted-foreground text-lg">No bills logged for this month.</p>
            <p className="text-muted-foreground opacity-80 text-sm mt-2">Add one manually or copy from your recurring bills.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="p-4 font-semibold text-foreground border-b border-border">Type</th>
                  <th className="p-4 font-semibold text-foreground border-b border-border">Company</th>
                  <th className="p-4 font-semibold text-foreground text-center border-b border-border">Day</th>
                  <th className="p-4 font-semibold text-foreground text-right border-b border-border">Amount</th>
                  <th className="p-4 w-24 border-b border-border text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {processedBills.map(bill => {
                  const isEditing = editingId === bill.id

                  return (
                    <tr key={bill.id} className={cn(
                      "border-b border-border transition-colors group",
                      !bill.isPending ? "bg-emerald-500/5 hover:bg-emerald-500/10" : "hover:bg-muted/50"
                    )}>
                      <td className="p-0 border-r border-border/50">
                        {isEditing ? (
                          <input
                            type="text"
                            defaultValue={bill.name}
                            onBlur={(e) => handleBlur(bill.id, "name", e.target.value)}
                            className="w-full px-4 py-4 bg-background border-none text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 font-medium"
                          />
                        ) : (
                          <div className={cn("px-4 py-4 font-medium", !bill.isPending ? "text-emerald-700 dark:text-emerald-400" : "text-foreground")}>
                            {bill.name}
                          </div>
                        )}
                      </td>
                      <td className="p-0 border-r border-border/50">
                        {isEditing ? (
                          <input
                            type="text"
                            defaultValue={bill.company || ""}
                            placeholder="--"
                            onBlur={(e) => handleBlur(bill.id, "company", e.target.value)}
                            className="w-full px-4 py-4 bg-background border-none text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                          />
                        ) : (
                          <div className={cn("px-4 py-4", !bill.isPending ? "text-emerald-700/80 dark:text-emerald-400/80" : "text-muted-foreground")}>
                            {bill.company || "--"}
                          </div>
                        )}
                      </td>
                      <td className="p-0 border-r border-border/50 w-24">
                        {isEditing ? (
                          <input
                            type="number"
                            defaultValue={bill.dayOfMonth || ""}
                            placeholder="--"
                            min="1"
                            max="31"
                            onBlur={(e) => handleBlur(bill.id, "dayOfMonth", e.target.value)}
                            className="w-full px-4 py-4 bg-background border-none text-center text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                          />
                        ) : (
                          <div className={cn("px-4 py-4 text-center", !bill.isPending ? "text-emerald-700/80 dark:text-emerald-400/80" : "text-muted-foreground")}>
                            {bill.dayOfMonth || "--"}
                          </div>
                        )}
                      </td>
                      <td className="p-0 border-r border-border/50">
                        {isEditing ? (
                          <div className="relative flex items-center h-full">
                            <span className="absolute left-4 text-muted-foreground text-sm">{currency}</span>
                            <input
                              type="number"
                              defaultValue={bill.amount}
                              step="0.01"
                              onBlur={(e) => handleBlur(bill.id, "amount", e.target.value)}
                              className="w-full pl-8 pr-4 py-4 bg-background border-none text-right text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary/50"
                            />
                          </div>
                        ) : (
                          <div className={cn("px-4 py-4 text-right font-semibold", !bill.isPending ? "text-emerald-700 dark:text-emerald-400" : "text-foreground")}>
                            {currency}{bill.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {isEditing ? (
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-emerald-500 hover:text-emerald-400 p-2 transition-colors"
                              title="Done Editing"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingId(bill.id)}
                              className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-2"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteMonthlyBill(bill.id)}
                            className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-muted/30">
                {totalPending > 0 && (
                  <tr className="bg-yellow-500/10 dark:bg-yellow-900/20 border-t border-yellow-500/20">
                    <td colSpan={4} className="p-4 font-bold text-yellow-700 dark:text-yellow-400 text-lg">Total Pending</td>
                    <td className="p-4 text-right font-bold text-yellow-700 dark:text-yellow-400 text-lg">
                      {currency}{totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td></td>
                  </tr>
                )}
                <tr className="bg-emerald-500/10 dark:bg-emerald-900/20 border-t border-emerald-500/20">
                  <td colSpan={4} className="p-4 font-bold text-emerald-700 dark:text-emerald-400 text-lg">Total Paid</td>
                  <td className="p-4 text-right font-bold text-emerald-700 dark:text-emerald-400 text-lg">
                    {currency}{totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
