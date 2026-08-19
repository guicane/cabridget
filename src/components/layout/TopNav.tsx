"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/layout/ThemeToggle"

const navItems = [
  { name: "Dashboard", href: "/" },
  { name: "Cash Flow", href: "/cash-flow" },
  { name: "Monthly Cashflow", href: "/monthly-bills" },
  { name: "Credit Cards", href: "/credit-cards" },
  { name: "Net Worth", href: "/net-worth" },
  { name: "Settings", href: "/settings" },
]

export function TopNav() {
  const pathname = usePathname()

  return (
    <div className="mb-6 md:mb-9">
      <header className="flex items-center justify-between gap-6 mb-6 md:mb-9">
        <div className="flex items-center gap-4 md:gap-[22px]">
          <div className="w-14 h-14 md:w-[84px] md:h-[84px] rounded-2xl md:rounded-[20px] bg-[#08070c] border border-border grid place-items-center overflow-hidden shrink-0">
            <Image src="/logo-mark.png" alt="Cabridget" width={66} height={70} className="w-11 h-12 md:w-[66px] md:h-[70px] object-contain" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="text-xl md:text-[34px] tracking-tight leading-none text-foreground">
              cabridget
            </div>
            <div className="text-[11px] md:text-xs tracking-[0.18em] uppercase text-muted-foreground">
              Budget Console
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            v{process.env.NEXT_PUBLIC_APP_VERSION || "dev"}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <nav className="flex gap-2.5 flex-wrap">
        {navItems.map((item) => {
          const isActive = pathname === item.href

          return (
            <Link key={item.name} href={item.href} className="relative block">
              {isActive && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute inset-0 bg-gradient-primary rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div
                className={cn(
                  "relative rounded-full border px-5 py-3 text-sm tracking-wide transition-colors",
                  isActive
                    ? "border-transparent text-[#0c0b12] font-medium"
                    : "border-border text-foreground hover:border-primary"
                )}
              >
                {item.name}
              </div>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
