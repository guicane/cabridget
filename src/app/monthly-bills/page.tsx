import { getRecurringBills, getMonths } from "@/actions/monthly-bills"
import { prisma } from "@/lib/prisma"
import { MonthlyBillsTabs } from "@/components/monthly-bills/MonthlyBillsTabs"

export const dynamic = "force-dynamic"

export default async function MonthlyBillsPage() {
  const initialBills = await getRecurringBills()
  const months = await getMonths()

  const allMonthlyBills = await prisma.monthlyBill.findMany({
    orderBy: [
      { dayOfMonth: { sort: 'asc', nulls: 'last' } },
      { amount: 'desc' }
    ]
  })

  // Serialize Decimal to number for the client component
  const serializedTemplates = initialBills.map(bill => ({
    ...bill,
    amount: Number(bill.amount)
  }))

  const serializedMonthlyBills = allMonthlyBills.map(bill => ({
    ...bill,
    amount: Number(bill.amount)
  }))

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Monthly Bills</h1>
        <p className="text-muted-foreground">Track actual monthly bills and manage your templates.</p>
      </div>

      <MonthlyBillsTabs 
        templates={serializedTemplates} 
        months={months} 
        monthlyBills={serializedMonthlyBills} 
      />
    </div>
  )
}
