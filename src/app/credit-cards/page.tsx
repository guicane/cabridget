export const dynamic = "force-dynamic"

import { getCreditCardsData } from "@/actions/credit-cards"
import { CreditCardGrid } from "@/components/credit-cards/CreditCardGrid"
import { YearSelector } from "@/components/YearSelector"

export default async function CreditCardsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const yearStr = searchParams?.year;
  const year = yearStr ? parseInt(yearStr as string, 10) : new Date().getFullYear();

  const { cards, months } = await getCreditCardsData(year)

  const serializedCards = cards.map((c: any) => ({
    ...c,
    statements: c.statements.map((s: any) => ({
      ...s,
      balance: Number(s.balance)
    }))
  }))

  const serializedMonths = months.map((m: any) => ({
    id: m.id,
    identifier: m.identifier
  }))

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Credit Cards</h1>
          <p className="text-muted-foreground">Track your credit card balances month over month.</p>
        </div>
        <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
          <YearSelector currentYear={year} />
        </div>
      </div>

      <CreditCardGrid cards={serializedCards} months={serializedMonths} />
    </div>
  )
}
