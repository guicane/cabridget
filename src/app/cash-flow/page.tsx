export const dynamic = "force-dynamic";

import { getMonths } from "@/actions/cash-flow"
import { CashFlowGrid } from "@/components/cash-flow/CashFlowGrid"
import { YearSelector } from "@/components/YearSelector"
import { RowCreator } from "@/components/cash-flow/RowCreator"

export default async function CashFlowPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const yearStr = searchParams?.year;
  const year = yearStr ? parseInt(yearStr as string, 10) : new Date().getFullYear();

  const rawMonths = await getMonths(year)
  const months = [...rawMonths]

  const entries = months.flatMap(m => {
    const incomes = m.incomes.map(i => ({
      id: i.id,
      monthId: m.id,
      type: "Income" as const,
      description: i.source,
      amount: Number(i.amount)
    }))
    const bills = m.monthlyBills.map(b => ({
      id: b.id,
      monthId: m.id,
      type: "Bill" as const,
      description: b.name,
      amount: Number(b.amount)
    }))
    const cards = m.creditCardStatements.map(c => ({
      id: c.id,
      monthId: m.id,
      type: "CreditCard" as const,
      description: c.creditCard.name,
      amount: Number(c.balance)
    }))
    return [...incomes, ...bills, ...cards]
  })

  const strippedMonths = months.map(m => ({ id: m.id, identifier: m.identifier }))

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Cash Flow</h1>
          <p className="text-muted-foreground">Track your macro-level income and major expenses.</p>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
          <YearSelector currentYear={year} />
        </div>
      </div>

      <CashFlowGrid months={strippedMonths as any} entries={entries} />
    </div>
  )
}
