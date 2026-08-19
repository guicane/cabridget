"use client"

import { useState } from "react"
import { addRecurringIncome, deleteRecurringIncome, updateRecurringIncome } from "@/actions/monthly-bills"
import { Trash2, Plus, Pencil, Check } from "lucide-react"
import type { RecurringIncome } from "@prisma/client"
import { useSettings } from "@/components/providers/SettingsProvider"

type SerializedRecurringIncome = RecurringIncome

export function IncomeTab({ initialIncomes }: { initialIncomes: SerializedRecurringIncome[] }) {
  const [isPending, setIsPending] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const { currency } = useSettings()

  async function handleCreate(formData: FormData) {
    setIsPending(true)
    await addRecurringIncome(formData)
    setIsPending(false)
    const form = document.getElementById("add-income-form") as HTMLFormElement
    if (form) form.reset()
  }

  const handleBlur = async (id: string, field: string, value: string) => {
    await updateRecurringIncome(id, field, value)
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Add Income Form */}
      <div className="bg-card rounded-[18px] border border-border p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Add Recurring Income</h2>
        <form id="add-income-form" action={handleCreate} className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <input
            type="text"
            name="source"
            placeholder="Source (e.g. Salary, Dividend)"
            required
            className="w-full md:flex-1 px-4 py-2 bg-input border border-border rounded-lg text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
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

      {/* Incomes List */}
      <div className="bg-card rounded-[18px] border border-border overflow-hidden">
        {initialIncomes.length === 0 ? (
          <div className="p-12 text-center border-dashed">
            <p className="text-muted-foreground text-lg">No recurring income added yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted">
                  <th className="p-4 font-semibold text-foreground border-b border-border">Source</th>
                  <th className="p-4 w-24 border-b border-border text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {initialIncomes.map(inc => {
                  const isEditing = editingId === inc.id

                  return (
                    <tr key={inc.id} className="border-b border-border hover:bg-muted/50 transition-colors group">
                      <td className="p-0 border-r border-border/50">
                        {isEditing ? (
                          <input
                            type="text"
                            defaultValue={inc.source}
                            onBlur={(e) => handleBlur(inc.id, "source", e.target.value)}
                            className="w-full px-4 py-4 bg-background border-none text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 font-medium"
                          />
                        ) : (
                          <div className="px-4 py-4 font-medium text-foreground">{inc.source}</div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          {isEditing ? (
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-primary hover:text-primary/80 p-2 transition-colors"
                              title="Done Editing"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingId(inc.id)}
                              className="text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity p-2"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteRecurringIncome(inc.id)}
                            className="text-muted-foreground hover:text-negative opacity-0 group-hover:opacity-100 transition-opacity p-2"
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
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
