"use client"

import { createContext, useContext, ReactNode } from "react"
import type { Settings } from "@prisma/client"

const SettingsContext = createContext<Settings | null>(null)

export function SettingsProvider({ 
  settings, 
  children 
}: { 
  settings: Settings
  children: ReactNode 
}) {
  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}
