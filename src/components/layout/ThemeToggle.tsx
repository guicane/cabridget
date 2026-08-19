"use client"

import * as React from "react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-24 h-11 rounded-full bg-muted animate-pulse" />
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex items-center gap-[9px] whitespace-nowrap rounded-full border border-border bg-card text-foreground text-sm px-4 py-[9px] min-h-11 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      <span className="w-[9px] h-[9px] rounded-full bg-gradient-primary inline-block" />
      {theme === "dark" ? "Dark" : "Light"}
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}
