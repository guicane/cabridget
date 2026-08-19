"use client"

import { useState } from "react"
import { TemplatesTab } from "./TemplatesTab"
import { ActualsTab } from "./ActualsTab"
import { IncomeTab } from "./IncomeTab"
import { CreditCardsTab } from "./CreditCardsTab"
import { cn } from "@/lib/utils"

export function MonthlyBillsTabs({ 
  templates, 
  months, 
  monthlyBills,
  incomeTemplates,
  incomes,
  creditCards,
  creditCardStatements
}: { 
  templates: any[], 
  months: any[], 
  monthlyBills: any[],
  incomeTemplates: any[],
  incomes: any[],
  creditCards: any[],
  creditCardStatements: any[]
}) {
  const [activeTab, setActiveTab] = useState<"actuals" | "templates" | "income" | "credit-cards">("actuals")

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex p-1 space-x-1 bg-muted rounded-xl w-full max-w-2xl">
        <button
          onClick={() => setActiveTab("actuals")}
          className={cn(
            "w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all",
            activeTab === "actuals"
              ? "bg-background text-foreground shadow"
              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          Monthly Tracker
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={cn(
            "w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all",
            activeTab === "templates"
              ? "bg-background text-foreground shadow"
              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          Recurring Bills
        </button>
        <button
          onClick={() => setActiveTab("income")}
          className={cn(
            "w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all",
            activeTab === "income"
              ? "bg-background text-foreground shadow"
              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          Income
        </button>
        <button
          onClick={() => setActiveTab("credit-cards")}
          className={cn(
            "w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all",
            activeTab === "credit-cards"
              ? "bg-background text-foreground shadow"
              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
          )}
        >
          Credit Cards
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "actuals" ? (
          <ActualsTab 
            months={months} 
            bills={monthlyBills} 
            templates={templates} 
            incomes={incomes} 
            incomeTemplates={incomeTemplates}
            creditCards={creditCards}
            creditCardStatements={creditCardStatements}
          />
        ) : activeTab === "templates" ? (
          <TemplatesTab initialBills={templates} />
        ) : activeTab === "income" ? (
          <IncomeTab initialIncomes={incomeTemplates} />
        ) : (
          <CreditCardsTab initialCards={creditCards} />
        )}
      </div>
    </div>
  )
}

