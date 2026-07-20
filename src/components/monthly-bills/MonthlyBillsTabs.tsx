"use client"

import { useState } from "react"
import { TemplatesTab } from "./TemplatesTab"
import { ActualsTab } from "./ActualsTab"
import { cn } from "@/lib/utils"

export function MonthlyBillsTabs({ 
  templates, 
  months, 
  monthlyBills 
}: { 
  templates: any[], 
  months: any[], 
  monthlyBills: any[] 
}) {
  const [activeTab, setActiveTab] = useState<"actuals" | "templates">("actuals")

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex p-1 space-x-1 bg-muted rounded-xl w-full max-w-sm">
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
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === "actuals" ? (
          <ActualsTab months={months} bills={monthlyBills} templates={templates} />
        ) : (
          <TemplatesTab initialBills={templates} />
        )}
      </div>
    </div>
  )
}
