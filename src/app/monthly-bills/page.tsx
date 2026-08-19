import { getRecurringBills, getMonths, getRecurringIncomes } from "@/actions/monthly-bills"
import { prisma } from "@/lib/prisma"
import { MonthlyBillsTabs } from "@/components/monthly-bills/MonthlyBillsTabs"
import { YearSelector } from "@/components/YearSelector"

export const dynamic = "force-dynamic"

export default async function MonthlyBillsPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const yearStr = searchParams?.year;
  const year = yearStr ? parseInt(yearStr as string, 10) : new Date().getFullYear();

  const initialBills = await getRecurringBills()
  const initialIncomes = await getRecurringIncomes()
  const months = await getMonths(year)

  const allMonthlyBills = await prisma.monthlyBill.findMany({
    orderBy: [
      { dayOfMonth: { sort: 'asc', nulls: 'last' } },
      { amount: 'desc' }
    ]
  })

  const allIncomes = await prisma.income.findMany({
    orderBy: [
      { amount: 'desc' }
    ]
  })

  const allCreditCards = await prisma.creditCard.findMany({
    orderBy: [
      { name: 'asc' }
    ]
  })

  const allCreditCardStatements = await prisma.creditCardStatement.findMany()

  // Serialize Decimal to number for the client component
  // Defensively remove 'amount' from templates in case it lingers in cache
  const serializedTemplates = initialBills.map((bill: any) => {
    const { amount, ...rest } = bill
    return rest
  })

  const serializedMonthlyBills = allMonthlyBills.map((bill: any) => ({
    ...bill,
    amount: Number(bill.amount)
  }))

  const serializedIncomeTemplates = initialIncomes.map((inc: any) => {
    const { amount, ...rest } = inc
    return rest
  })

  const serializedIncomes = allIncomes.map((inc: any) => ({
    ...inc,
    amount: Number(inc.amount)
  }))

  const serializedCreditCards = allCreditCards.map((card: any) => ({
    id: card.id,
    name: card.name
  }))

  const serializedCreditCardStatements = allCreditCardStatements.map((stmt: any) => ({
    id: stmt.id,
    creditCardId: stmt.creditCardId,
    monthId: stmt.monthId,
    balance: Number(stmt.balance)
  }))

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Monthly Cashflow</h1>
          <p className="text-muted-foreground">Track actual monthly bills and manage your templates.</p>
        </div>
        <YearSelector currentYear={year} />
      </div>

      <MonthlyBillsTabs 
        templates={serializedTemplates} 
        months={months} 
        monthlyBills={serializedMonthlyBills}
        incomeTemplates={serializedIncomeTemplates}
        incomes={serializedIncomes}
        creditCards={serializedCreditCards}
        creditCardStatements={serializedCreditCardStatements}
      />
    </div>
  )
}

