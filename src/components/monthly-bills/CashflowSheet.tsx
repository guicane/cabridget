"use client"

import { useState } from "react"
import {
  addMonthlyBill, upsertMonthlyBillEntry, deleteMonthlyBillSeries, renameBillSeries, updateMonthlyBill,
  addRecurringIncome, upsertIncomeEntry, deleteIncomeSeries, renameIncomeSeries, updateIncome,
  addCreditCard, deleteCreditCardStatementSeries, updateCreditCard, toggleCreditCardActive,
  upsertCreditCardStatement, clearMonth,
} from "@/actions/monthly-bills"
import { CheckCircle2, Circle, Pencil, Check, Plus, Trash2, Eraser } from "lucide-react"
import type { Month } from "@prisma/client"
import { useSettings } from "@/components/providers/SettingsProvider"
import { sumAmounts } from "@/lib/money"
import { cn } from "@/lib/utils"

type SerializedMonthlyBill = { id: string, monthId: string, name: string, company: string | null, amount: number, isPaid: boolean }
type SerializedIncome = { id: string, monthId: string, source: string, amount: number, isPaid: boolean }
type SerializedStatement = { id: string, monthId: string, creditCardId: string, balance: number }
type CardTemplate = { id: string, name: string, active: boolean }

// A month cell that's always editable, whether or not an entry exists yet
// for that row/month — typing a value creates it, clearing it deletes it.
// This replaces the old "sync templates into this month first" step.
function MoneyCell({
  amount, currency, isPaid, onBlur, onTogglePaid,
}: {
  amount: number | undefined
  currency: string
  isPaid?: boolean
  onBlur: (value: string) => void
  onTogglePaid?: () => void
}) {
  const [value, setValue] = useState(amount !== undefined ? String(amount) : "")

  return (
    <td className={cn("p-0 border-r border-border/50 relative transition-colors", isPaid ? "bg-primary/10" : "")}>
      <div className="flex items-center justify-between px-3 py-3 h-full gap-2">
        {onTogglePaid && (
          <button
            onClick={onTogglePaid}
            className={cn("flex-shrink-0 transition-colors", isPaid ? "text-primary hover:text-primary/80" : "text-muted-foreground hover:text-foreground")}
          >
            {isPaid ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
          </button>
        )}
        <div className="relative flex items-center w-full">
          <span className="absolute left-2 text-muted-foreground text-sm">{currency}</span>
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={(e) => onBlur(e.target.value)}
            className={cn(
              "w-full pl-6 pr-2 py-1 bg-transparent border-none text-right focus:outline-none focus:bg-background rounded transition-all font-medium",
              isPaid ? "text-primary" : "text-foreground"
            )}
          />
        </div>
      </div>
    </td>
  )
}

function AddRowForm({ placeholder, onAdd }: { placeholder: string, onAdd: (name: string) => void }) {
  const [value, setValue] = useState("")
  return (
    <tr className="border-b border-border">
      <td className="p-2 sticky left-0 z-10 bg-card" colSpan={1}>
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!value.trim()) return
            onAdd(value.trim())
            setValue("")
          }}
        >
          <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </form>
      </td>
    </tr>
  )
}

function RowLabel({
  name, isEditing, onEdit, onCommit, onDelete, extra,
}: {
  name: string
  isEditing: boolean
  onEdit: () => void
  onCommit: (value: string) => void
  onDelete: () => void
  extra?: React.ReactNode
}) {
  const [value, setValue] = useState(name)

  return (
    <td className="p-4 border-r border-border/50 relative pr-10 sticky left-0 z-10 bg-card shadow-[4px_0_12px_rgba(0,0,0,0.02)]">
      <div className="flex items-center gap-2">
        {extra}
        {isEditing ? (
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => onCommit(value)}
            onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur() }}
            className="font-medium text-foreground bg-transparent border-b border-primary/50 focus:outline-none w-full"
          />
        ) : (
          <span className="font-medium text-foreground">{name}</span>
        )}
      </div>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isEditing && (
          <button onClick={onEdit} className="text-muted-foreground hover:text-primary p-1" title="Rename">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
        <button onClick={onDelete} className="text-muted-foreground hover:text-negative p-1" title="Delete from all months">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </td>
  )
}

export function CashflowSheet({
  months,
  bills,
  templates,
  incomes,
  incomeTemplates,
  creditCards = [],
  creditCardStatements = []
}: {
  months: Month[]
  bills: SerializedMonthlyBill[]
  templates: any[]
  incomes: SerializedIncome[]
  incomeTemplates: any[]
  creditCards?: CardTemplate[]
  creditCardStatements?: SerializedStatement[]
}) {
  const { currency } = useSettings()
  const [editingKey, setEditingKey] = useState<string | null>(null)

  const handleClearMonth = (monthId: string, label: string) => {
    if (window.confirm(`Permanently clear ALL income, bills, and credit card statements for ${label}? This cannot be undone.`)) {
      clearMonth(monthId)
    }
  }

  const incomeRowMap = new Map<string, { source: string }>()
  incomes.forEach(i => incomeRowMap.set(i.source, { source: i.source }))
  incomeTemplates.forEach(t => incomeRowMap.set(t.source, { source: t.source }))
  const uniqueIncomeRows = Array.from(incomeRowMap.values()).sort((a, b) => a.source.localeCompare(b.source))

  const billRowMap = new Map<string, { name: string, company: string | null }>()
  bills.forEach(b => billRowMap.set(`${b.name}-${b.company || ''}`, { name: b.name, company: b.company }))
  templates.forEach(t => billRowMap.set(`${t.name}-${t.company || ''}`, { name: t.name, company: t.company }))
  const uniqueBillRows = Array.from(billRowMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  if (months.length === 0) {
    return (
      <div className="bg-card rounded-[18px] p-12 text-center border border-border border-dashed">
        <p className="text-muted-foreground text-lg">No months tracked yet.</p>
        <p className="text-muted-foreground opacity-80 text-sm mt-2">Go to Cash Flow to create your first month.</p>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-[18px] border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted">
              <th className="p-4 font-semibold text-foreground border-b border-border min-w-[200px] sticky left-0 z-20 bg-muted">Line Item</th>
              {months.map(month => (
                <th key={month.id} className="p-4 font-semibold text-foreground border-b border-border min-w-[180px]">
                  <div className="flex items-center justify-between gap-2">
                    <span>{month.identifier}</span>
                    <button
                      onClick={() => handleClearMonth(month.id, month.identifier)}
                      className="text-muted-foreground hover:text-negative p-1 font-normal shrink-0"
                      title={`Clear all data for ${month.identifier}`}
                    >
                      <Eraser className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="p-4 font-semibold text-foreground text-right border-b border-border min-w-[120px] sticky right-0 z-20 bg-muted shadow-[-4px_0_12px_rgba(0,0,0,0.05)]">Total</th>
            </tr>
          </thead>
          <tbody>
            {/* INCOME */}
            <tr className="bg-muted/50">
              <td colSpan={months.length + 2} className="p-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Income</td>
            </tr>
            {uniqueIncomeRows.map(row => {
              const key = `income-${row.source}`
              return (
                <tr key={key} className="border-b border-border hover:bg-muted/30 transition-colors group">
                  <RowLabel
                    name={row.source}
                    isEditing={editingKey === key}
                    onEdit={() => setEditingKey(key)}
                    onCommit={(value) => { setEditingKey(null); if (value && value !== row.source) renameIncomeSeries(row.source, value) }}
                    onDelete={() => { if (window.confirm("Delete this income from all months?")) deleteIncomeSeries(row.source) }}
                  />
                  {months.map(month => {
                    const income = incomes.find(i => i.monthId === month.id && i.source === row.source)
                    return (
                      <MoneyCell
                        key={month.id}
                        amount={income?.amount}
                        currency={currency}
                        isPaid={income?.isPaid}
                        onTogglePaid={income ? () => updateIncome(income.id, "isPaid", !income.isPaid) : undefined}
                        onBlur={(value) => upsertIncomeEntry(month.id, row.source, value)}
                      />
                    )
                  })}
                  <td className="p-4 border-l border-border/50 text-right font-bold text-foreground sticky right-0 z-10 bg-card shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
                    {(() => {
                      const total = sumAmounts(incomes.filter(i => i.source === row.source).map(i => i.amount))
                      return total > 0 ? `${currency}${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "--"
                    })()}
                  </td>
                </tr>
              )
            })}
            <AddRowForm placeholder="Add income source..." onAdd={(name) => {
              const fd = new FormData(); fd.set("source", name); addRecurringIncome(fd)
            }} />

            {/* BILLS */}
            <tr className="bg-muted/50">
              <td colSpan={months.length + 2} className="p-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bills</td>
            </tr>
            {uniqueBillRows.map(row => {
              const key = `bill-${row.name}-${row.company}`
              return (
                <tr key={key} className="border-b border-border hover:bg-muted/30 transition-colors group">
                  <RowLabel
                    name={row.name}
                    isEditing={editingKey === key}
                    onEdit={() => setEditingKey(key)}
                    onCommit={(value) => { setEditingKey(null); if (value && value !== row.name) renameBillSeries(row.name, row.company, value, row.company) }}
                    onDelete={() => { if (window.confirm("Delete this bill from all months?")) deleteMonthlyBillSeries(row.name, row.company) }}
                  />
                  {months.map(month => {
                    const bill = bills.find(b => b.monthId === month.id && b.name === row.name && b.company === row.company)
                    return (
                      <MoneyCell
                        key={month.id}
                        amount={bill?.amount}
                        currency={currency}
                        isPaid={bill?.isPaid}
                        onTogglePaid={bill ? () => updateMonthlyBill(bill.id, "isPaid", !bill.isPaid) : undefined}
                        onBlur={(value) => upsertMonthlyBillEntry(month.id, row.name, row.company, value)}
                      />
                    )
                  })}
                  <td className="p-4 border-l border-border/50 text-right font-bold text-foreground sticky right-0 z-10 bg-card shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
                    {(() => {
                      const total = sumAmounts(bills.filter(b => b.name === row.name && b.company === row.company).map(b => b.amount))
                      return total > 0 ? `${currency}${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "--"
                    })()}
                  </td>
                </tr>
              )
            })}
            <AddRowForm placeholder="Add bill..." onAdd={(name) => {
              const fd = new FormData(); fd.set("name", name); addMonthlyBill(fd)
            }} />

            {/* CREDIT CARDS */}
            <tr className="bg-muted/50">
              <td colSpan={months.length + 2} className="p-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Credit Cards</td>
            </tr>
            {creditCards.map(card => {
              const key = `card-${card.id}`
              return (
                <tr key={key} className={cn("border-b border-border hover:bg-muted/30 transition-colors group", !card.active && "opacity-50")}>
                  <RowLabel
                    name={card.name}
                    isEditing={editingKey === key}
                    onEdit={() => setEditingKey(key)}
                    onCommit={(value) => { setEditingKey(null); if (value && value !== card.name) updateCreditCard(card.id, "name", value) }}
                    onDelete={() => { if (window.confirm("Delete this card's statements from all months?")) deleteCreditCardStatementSeries(card.id) }}
                    extra={
                      <button
                        onClick={() => toggleCreditCardActive(card.id, !card.active)}
                        className={card.active ? "text-primary hover:text-primary/80 shrink-0" : "text-muted-foreground hover:text-foreground shrink-0"}
                        title={card.active ? "Active — click to archive" : "Archived — click to reactivate"}
                      >
                        {card.active ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </button>
                    }
                  />
                  {months.map(month => {
                    const stmt = creditCardStatements.find(s => s.monthId === month.id && s.creditCardId === card.id)
                    return (
                      <MoneyCell
                        key={month.id}
                        amount={stmt?.balance}
                        currency={currency}
                        onBlur={(value) => upsertCreditCardStatement(card.id, month.id, value)}
                      />
                    )
                  })}
                  <td className="p-4 border-l border-border/50 text-right font-bold text-foreground sticky right-0 z-10 bg-card shadow-[-4px_0_12px_rgba(0,0,0,0.02)]">
                    {(() => {
                      const total = sumAmounts(creditCardStatements.filter(s => s.creditCardId === card.id).map(s => s.balance))
                      return total > 0 ? `${currency}${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "--"
                    })()}
                  </td>
                </tr>
              )
            })}
            <AddRowForm placeholder="Add credit card..." onAdd={(name) => {
              const fd = new FormData(); fd.set("name", name); addCreditCard(fd)
            }} />
          </tbody>
          <tfoot className="bg-muted/30">
            <tr>
              <td className="p-4 font-bold text-foreground border-r border-border/50 sticky left-0 z-20 bg-muted">Total Paid</td>
              {months.map(month => {
                const total = sumAmounts(bills.filter(b => b.monthId === month.id && b.isPaid).map(b => b.amount))
                return (
                  <td key={month.id} className="p-4 text-right font-bold text-primary border-r border-border/50">
                    {total > 0 ? `${currency}${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "--"}
                  </td>
                )
              })}
              <td className="p-4 text-right font-bold text-primary border-l border-border/50 sticky right-0 z-20 bg-muted shadow-[-4px_0_12px_rgba(0,0,0,0.05)]">
                {(() => {
                  const total = sumAmounts(bills.filter(b => b.isPaid).map(b => b.amount))
                  return total > 0 ? `${currency}${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "--"
                })()}
              </td>
            </tr>
            <tr>
              <td className="p-4 font-bold text-foreground border-r border-border/50 sticky left-0 z-20 bg-muted">Total Pending</td>
              {months.map(month => {
                const total = sumAmounts(bills.filter(b => b.monthId === month.id && !b.isPaid).map(b => b.amount))
                return (
                  <td key={month.id} className="p-4 text-right font-bold text-yellow-600 dark:text-yellow-400 border-r border-border/50">
                    {total > 0 ? `${currency}${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "--"}
                  </td>
                )
              })}
              <td className="p-4 text-right font-bold text-yellow-600 dark:text-yellow-400 border-l border-border/50 sticky right-0 z-20 bg-muted shadow-[-4px_0_12px_rgba(0,0,0,0.05)]">
                {(() => {
                  const total = sumAmounts(bills.filter(b => !b.isPaid).map(b => b.amount))
                  return total > 0 ? `${currency}${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "--"
                })()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
