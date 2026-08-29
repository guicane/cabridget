import { cn } from "@/lib/utils"

type Point = { identifier: string; total: number; hasData: boolean }

// A compact, label-free version of the Net Worth page's trend chart, sized
// for a dashboard card. No client state needed — renders fully on the
// server, same as the rest of the Dashboard.
export function NetWorthTrendMini({ points }: { points: Point[] }) {
  const totalsWithData = points.filter(p => p.hasData).map(p => p.total)
  if (totalsWithData.length === 0) return null

  const maxTotal = Math.max(...totalsWithData, 0)
  const minTotal = Math.min(...totalsWithData, 0)
  const baseline = Math.min(minTotal, 0)
  const range = Math.max(maxTotal - baseline, 1)

  let previousTotal: number | null = null
  const bars = points.map(point => {
    const delta = point.hasData && previousTotal !== null ? point.total - previousTotal : null
    if (point.hasData) previousTotal = point.total
    return { ...point, delta }
  })

  return (
    <div className="flex items-end gap-1 h-12">
      {bars.map((bar, i) => {
        const heightPct = bar.hasData ? Math.max(((bar.total - baseline) / range) * 100, 10) : 0
        const isUp = bar.delta !== null && bar.delta > 0
        const isDown = bar.delta !== null && bar.delta < 0

        return (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-t transition-all",
              !bar.hasData ? "bg-border" : isUp ? "bg-primary" : isDown ? "bg-negative" : "bg-muted-foreground/40"
            )}
            style={{ height: bar.hasData ? `${heightPct}%` : "3px" }}
            title={`${bar.identifier}: ${bar.hasData ? bar.total.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "no data"}`}
          />
        )
      })}
    </div>
  )
}
