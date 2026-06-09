"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Wallet, LineChart } from "lucide-react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Cash Flow", href: "/cash-flow", icon: Wallet },
  { name: "Net Worth", href: "/net-worth", icon: LineChart },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 h-full glass border-r border-white/5 pt-8 pb-4">
      <div className="px-6 mb-12">
        <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Cabridget
        </h1>
        <p className="text-xs text-white/40 mt-1 uppercase tracking-wider font-semibold">Macro Tracker</p>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link key={item.name} href={item.href} className="relative block">
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-lg"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                isActive ? "text-primary" : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              )}>
                <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-slate-500")} />
                {item.name}
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="px-6 mt-auto">
        <div className="text-xs text-slate-500 text-center">
          v0.0.4
        </div>
      </div>
    </div>
  )
}
