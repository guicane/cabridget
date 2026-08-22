"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { ImportStatementModal } from "./ImportStatementModal"

export function ImportStatementButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-card border border-border hover:border-primary text-foreground text-sm rounded-lg transition-colors"
      >
        <Upload className="w-4 h-4" />
        Import Statement
      </button>
      {isOpen && <ImportStatementModal onClose={() => setIsOpen(false)} />}
    </>
  )
}
