"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Wallet, LineChart, Settings, Receipt } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Cash Flow", href: "/cash-flow", icon: Wallet },
  { name: "Monthly Bills", href: "/monthly-bills", icon: Receipt },
  { name: "Net Worth", href: "/net-worth", icon: LineChart },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background z-40">
        <div className="w-9" />
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Cabridget
        </h1>
        <ThemeToggle />
      </div>

      {/* Navigation Bar (Bottom on Mobile, Left on Desktop) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-row items-center justify-around border-t border-border bg-background/95 backdrop-blur-md pb-safe-bottom
                      md:relative md:flex-col md:w-64 md:h-full md:justify-start md:border-t-0 md:border-r md:pt-8 md:pb-4 md:bg-background md:backdrop-blur-none md:z-auto">
        
        {/* Desktop Logo */}
        <div className="hidden md:block px-6 mb-12 w-full">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Cabridget
          </h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Macro Tracker</p>
        </div>

        <nav className="flex-1 flex flex-row w-full justify-around px-2 py-2 md:flex-col md:justify-start md:px-4 md:space-y-2 md:py-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link key={item.name} href={item.href} className="relative block flex-1 md:flex-none">
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-primary/10 rounded-lg md:border md:border-primary/20"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <div className={cn(
                  "relative flex flex-col items-center justify-center gap-1 py-2 rounded-lg text-[10px] font-medium transition-colors h-full",
                  "md:flex-row md:justify-start md:gap-3 md:px-4 md:py-3 md:text-base",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground md:hover:bg-muted"
                )}>
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground")} />
                  <span className="md:inline">{item.name}</span>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Desktop Footer Version */}
        <div className="hidden md:flex px-6 mt-auto w-full items-center justify-between">
          <div className="text-xs text-muted-foreground">
            v{process.env.NEXT_PUBLIC_APP_VERSION || "dev"}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </>
  )
}
