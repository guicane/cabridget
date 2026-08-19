import { Wallet, LineChart, Receipt, ArrowUpRight } from "lucide-react"
import Link from "next/link"

const cards = [
  {
    href: "/cash-flow",
    icon: Wallet,
    title: "Cash Flow",
    description: "Track your macro-level monthly income and major expenses without sweating the small stuff.",
  },
  {
    href: "/net-worth",
    icon: LineChart,
    title: "Net Worth",
    description: "Log monthly snapshots of your investment accounts to see your long-term growth.",
  },
  {
    href: "/monthly-bills",
    icon: Receipt,
    title: "Monthly Cashflow",
    description: "Track your expected recurring bills and baseline expenses templates.",
  },
] as const

export default function Home() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out">
      <div>
        <h1 className="text-4xl tracking-tight text-foreground mb-2">Welcome back</h1>
        <p className="text-muted-foreground text-lg">Here is the high-level trajectory of your finances.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[18px]">
        {cards.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="block group">
            <div className="bg-card rounded-[18px] p-6 h-full border border-border transition-colors duration-300 hover:border-primary relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gradient-primary text-[#0c0b12]">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl text-card-foreground">{title}</h2>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 transition-all duration-300" />
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
