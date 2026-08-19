"use client"

import { useState } from "react"
import { addMonthlyBill, updateMonthlyBill, copyTemplatesToMonth, deleteMonthlyBillSeries, updateIncome, deleteIncomeSeries, updateCreditCardStatement, deleteCreditCardStatementSeries } from "@/actions/monthly-bills"
import { CheckCircle2, Circle, Copy, Plus, Trash2 } from "lucide-react"
import type { Month } from "@prisma/client"
import { useSettings } from "@/components/providers/SettingsProvider"
import { cn } from "@/lib/utils"
import { sumAmounts } from "@/lib/money"

type SerializedMonthlyBill = { id: string, monthId: string, name: string, company: string | null, amount: number, dayOfMonth: number | null, isPaid: boolean }
type SerializedIncome = { id: string, monthId: string, source: string, amount: number, isPaid: boolean }

export function ActualsTab({ 
  months, 
  bills,
  templates,
  incomes,
  incomeTemplates,
  creditCards = [],
  creditCardStatements = []
}: { 
  months: Month[], 
  bills: SerializedMonthlyBill[],
  templates: any[],
  incomes: SerializedIncome[],
  incomeTemplates: any[],
  creditCards?: any[],
  creditCardStatements?: any[]
}) {
  const { currency } = useSettings()
  const [isPending, setIsPending] = useState(false)
  const [selectedMonthId, setSelectedMonthId] = useState<string>(months[0]?.id || "")

  // Find unique rows for Bills
  const rowMap = new Map<string, { name: string, company: string | null }>()
  bills.forEach(b => rowMap.set(`${b.name}-${b.company || ''}`, { name: b.name, company: b.company }))
  templates.forEach(t => rowMap.set(`${t.name}-${t.company || ''}`, { name: t.name, company: t.company }))
  const uniqueBillRows = Array.from(rowMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  // Find unique rows for Incomes
  const incomeRowMap = new Map<string, { source: string }>()
  incomes.forEach(i => incomeRowMap.set(i.source, { source: i.source }))
  incomeTemplates.forEach(t => incomeRowMap.set(t.source, { source: t.source }))
  const uniqueIncomeRows = Array.from(incomeRowMap.values()).sort((a, b) => a.source.localeCompare(b.source))

  const handleTogglePaid = async (billId: string, currentPaid: boolean) => {
    await updateMonthlyBill(billId, "isPaid", !currentPaid)
  }

  const handleAmountBlur = async (billId: string, val: string) => {
    await updateMonthlyBill(billId, "amount", val)
  }

  const handleIncomeTogglePaid = async (incomeId: string, currentPaid: boolean) => {
    await updateIncome(incomeId, "isPaid", !currentPaid)
  }

  const handleIncomeAmountBlur = async (incomeId: string, val: string) => {
    await updateIncome(incomeId, "amount", val)
  }

  const handleStatementAmountBlur = async (statementId: string, val: string) => {
    await updateCreditCardStatement(statementId, val)
  }

  async function handleCreate(formData: FormData) {
    setIsPending(true)
    await addMonthlyBill(formData)
    setIsPending(false)
    const form = document.getElementById("add-monthly-bill-form") as HTMLFormElement
    if (form) form.reset()
  }

  if (months.length === 0) {
    return (
      <div className="bg-card rounded-[18px] p-12 text-center border border-border border-dashed">
        <p className="text-muted-foreground text-lg">No months tracked yet.</p>
        <p className="text-muted-foreground opacity-80 text-sm mt-2">Go to Cash Flow to create your first month.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-[18px] border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="p-4 font-semibold text-foreground border-b border-border min-w-[200px] sticky left-0 z-20 bg-muted">Line Item</th>
                {months.map(month => {
                  const monthBills = bills.filter(b => b.monthId === month.id)
                  const hasMissing = templates.some(t => !monthBills.some(mb => mb.name === t.name && mb.company === t.company))
                  
                  const monthIncomes = incomes.filter(i => i.monthId === month.id)
                  const hasMissingIncome = incomeTemplates.some(t => !monthIncomes.some(mi => mi.source === t.source))
                  
                  const monthStatements = (creditCardStatements || []).filter(s => s.monthId === month.id)
                  const hasMissingCards = (creditCards || []).some(c => !monthStatements.some(ms => ms.creditCardId === c.id))
                  
                  return (
                    <th key={month.id} className="p-4 font-semibold text-foreground border-b border-border min-w-[180px]">
                      <div className="flex items-center justify-between">
                        <span>{month.identifier}</span>
                        {(hasMissing || hasMissingIncome || hasMissingCards) && (
                          <button 
                            onClick={() => copyTemplatesToMonth(month.id)}
                            className="text-xs flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded hover:bg-primary/20 transition-colors"
                            title="Sync missing items from templates"
                          >
                            <Copy className="w-3 h-3" /> Sync
                          </button>
                        )}
                      </div>
                    </th>
                  )
                })}
                <th className="p-4 font-semibold text-foreground text-right border-b border-border min-w-[120px] sticky right-0 z-20 bg-muted shadow-[-4px_0_12px_rgba(0,0,0,0.05)]">Total</th>
              </tr>
            </thead>
            <tbody>
              {/* INCOMES SECTION */}
              {uniqueIncomeRows.length > 0 && (
                <tr className="bg-muted/50">
                  <td colSpan={months.length + 2} className="p-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Income
                  </td>
                </tr>
              )}
              {uniqueIncomeRows.map(row => (
                <tr key={`income-${row.source}`} className="border-b border-border hover:bg-muted/30 transition-colors group">
                  <td className="p-4 border-r border-border/50 relative pr-10 sticky left-0 z-10 bg-card shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                    <div className="font-medium text-foreground">{row.source}</div>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this?")) {
                          deleteIncomeSeries(row.source)
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-negative opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete income from all months"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                  {months.map(month => {
                    const income = incomes.find(i => i.monthId === month.id && i.source === row.source)
                    if (!income) {
                      return <td key={`income-${month.id}`} className="p-4 border-r border-border/50 text-center text-muted-foreground/30">--</td>
                    }
                    
                    return (
                      <td key={`income-${month.id}`} className={cn(
                        "p-0 border-r border-border/50 relative transition-colors",
                        income.isPaid ? "bg-primary/10" : ""
                      )}>
                        <div className="flex items-center justify-between px-3 py-3 h-full gap-2">
                          <button 
                            onClick={() => handleIncomeTogglePaid(income.id, income.isPaid)}
                            className={cn(
                              "flex-shrink-0 transition-colors",
                              income.isPaid ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {income.isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </button>
                          
                          <div className="relative flex items-center w-full">
                            <span className="absolute left-2 text-muted-foreground text-sm">{currency}</span>
                            <input
                              type="number"
                              defaultValue={income.amount}
                              step="0.01"
                              onBlur={(e) => handleIncomeAmountBlur(income.id, e.target.value)}
                              className={cn(
                                "w-full pl-6 pr-2 py-1 bg-transparent border-none text-right focus:outline-none focus:bg-background rounded transition-all",
                                income.isPaid ? "text-primary font-medium" : "text-foreground font-medium"
                              )}
                            />
                          </div>
                        </div>
                      </td>
                    )
                  })}
                  <td className="p-4 border-l border-border/50 text-right font-bold text-foreground sticky right-0 z-10 bg-card shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
                    {(() => {
                      const rowTotal = sumAmounts(incomes.filter(i => i.source === row.source).map(i => i.amount))
                      return rowTotal > 0 ? `${currency}${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "--"
                    })()}
                  </td>
                </tr>
              ))}

              {/* BILLS SECTION */}
              {uniqueBillRows.length > 0 && (
                <tr className="bg-muted/50">
                  <td colSpan={months.length + 2} className="p-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Bills
                  </td>
                </tr>
              )}
              {uniqueBillRows.map(row => (
                <tr key={`bill-${row.name}-${row.company}`} className="border-b border-border hover:bg-muted/30 transition-colors group">
                  <td className="p-4 border-r border-border/50 relative pr-10 sticky left-0 z-10 bg-card shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                    <div className="font-medium text-foreground">{row.name}</div>
                    {row.company && <div className="text-xs text-muted-foreground">{row.company}</div>}
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this?")) {
                          deleteMonthlyBillSeries(row.name, row.company)
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-negative opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete bill from all months"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                  {months.map(month => {
                    const bill = bills.find(b => b.monthId === month.id && b.name === row.name && b.company === row.company)
                    if (!bill) {
                      return <td key={`bill-${month.id}`} className="p-4 border-r border-border/50 text-center text-muted-foreground/30">--</td>
                    }
                    
                    return (
                      <td key={`bill-${month.id}`} className={cn(
                        "p-0 border-r border-border/50 relative transition-colors",
                        bill.isPaid ? "bg-primary/10" : ""
                      )}>
                        <div className="flex items-center justify-between px-3 py-3 h-full gap-2">
                          <button 
                            onClick={() => handleTogglePaid(bill.id, bill.isPaid)}
                            className={cn(
                              "flex-shrink-0 transition-colors",
                              bill.isPaid ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {bill.isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </button>
                          
                          <div className="relative flex items-center w-full">
                            <span className="absolute left-2 text-muted-foreground text-sm">{currency}</span>
                            <input
                              type="number"
                              defaultValue={bill.amount}
                              step="0.01"
                              onBlur={(e) => handleAmountBlur(bill.id, e.target.value)}
                              className={cn(
                                "w-full pl-6 pr-2 py-1 bg-transparent border-none text-right focus:outline-none focus:bg-background rounded transition-all",
                                bill.isPaid ? "text-primary font-medium" : "text-foreground font-medium"
                              )}
                            />
                          </div>
                        </div>
                      </td>
                    )
                  })}
                  <td className="p-4 border-l border-border/50 text-right font-bold text-foreground sticky right-0 z-10 bg-card shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
                    {(() => {
                      const rowTotal = sumAmounts(bills.filter(b => b.name === row.name && b.company === row.company).map(b => b.amount))
                      return rowTotal > 0 ? `${currency}${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "--"
                    })()}
                  </td>
                </tr>
              ))}

              {/* CREDIT CARDS SECTION */}
              {(creditCards || []).length > 0 && (
                <tr className="bg-muted/50">
                  <td colSpan={months.length + 2} className="p-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Credit Cards
                  </td>
                </tr>
              )}
              {(creditCards || []).map(card => (
                <tr key={`card-${card.id}`} className="border-b border-border hover:bg-muted/30 transition-colors group">
                  <td className="p-4 border-r border-border/50 relative pr-10 sticky left-0 z-10 bg-card shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
                    <div className="font-medium text-foreground">{card.name}</div>
                    <button
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this?")) {
                          deleteCreditCardStatementSeries(card.id)
                        }
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-negative opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete credit card from all months"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                  {months.map(month => {
                    const stmt = (creditCardStatements || []).find(s => s.monthId === month.id && s.creditCardId === card.id)
                    if (!stmt) {
                      return <td key={`card-${month.id}`} className="p-4 border-r border-border/50 text-center text-muted-foreground/30">--</td>
                    }
                    
                    return (
                      <td key={`card-${month.id}`} className="p-0 border-r border-border/50 relative transition-colors">
                        <div className="flex items-center justify-between px-3 py-3 h-full gap-2">
                          <div className="relative flex items-center w-full">
                            <span className="absolute left-2 text-muted-foreground text-sm">{currency}</span>
                            <input
                              type="number"
                              defaultValue={stmt.balance}
                              step="0.01"
                              onBlur={(e) => handleStatementAmountBlur(stmt.id, e.target.value)}
                              className="w-full pl-6 pr-2 py-1 bg-transparent border-none text-right focus:outline-none focus:bg-background rounded transition-all text-foreground font-medium"
                            />
                          </div>
                        </div>
                      </td>
                    )
                  })}
                  <td className="p-4 border-l border-border/50 text-right font-bold text-foreground sticky right-0 z-10 bg-card shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
                    {(() => {
                      const rowTotal = sumAmounts((creditCardStatements || []).filter(s => s.creditCardId === card.id).map(s => s.balance))
                      return rowTotal > 0 ? `${currency}${rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "--"
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-muted/30">
              <tr>
                <td className="p-4 font-bold text-foreground border-r border-border/50 sticky left-0 z-20 bg-muted">Total Paid</td>
                {months.map(month => {
                  const totalPaidBills = sumAmounts(bills.filter(b => b.monthId === month.id && b.isPaid).map(b => b.amount))
                  return (
                    <td key={month.id} className="p-4 text-right font-bold text-primary border-r border-border/50">
                      {totalPaidBills > 0 ? `${currency}${totalPaidBills.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "--"}
                    </td>
                  )
                })}
                <td className="p-4 text-right font-bold text-primary border-l border-border/50 sticky right-0 z-20 bg-muted shadow-[-4px_0_12px_rgba(0,0,0,0.05)]">
                  {(() => {
                    const grandTotalPaid = sumAmounts(bills.filter(b => b.isPaid).map(b => b.amount))
                    return grandTotalPaid > 0 ? `${currency}${grandTotalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "--"
                  })()}
                </td>
              </tr>
              <tr>
                <td className="p-4 font-bold text-foreground border-r border-border/50 sticky left-0 z-20 bg-muted">Total Pending</td>
                {months.map(month => {
                  const totalPendingBills = sumAmounts(bills.filter(b => b.monthId === month.id && !b.isPaid).map(b => b.amount))
                  return (
                    <td key={month.id} className="p-4 text-right font-bold text-yellow-600 dark:text-yellow-400 border-r border-border/50">
                      {totalPendingBills > 0 ? `${currency}${totalPendingBills.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "--"}
                    </td>
                  )
                })}
                <td className="p-4 text-right font-bold text-yellow-600 dark:text-yellow-400 border-l border-border/50 sticky right-0 z-20 bg-muted shadow-[-4px_0_12px_rgba(0,0,0,0.05)]">
                  {(() => {
                    const grandTotalPending = sumAmounts(bills.filter(b => !b.isPaid).map(b => b.amount))
                    return grandTotalPending > 0 ? `${currency}${grandTotalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "--"
                  })()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
