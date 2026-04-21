"use client"

import { useSchematicEntitlement, useSchematicIsPending } from "@schematichq/schematic-react"

export function CreditsBadge() {
  const isPending = useSchematicIsPending()
  const { creditRemaining } = useSchematicEntitlement("dashboard-prompt")

  if (isPending || creditRemaining == null) {
    return null
  }

  return (
    <div className="inline-flex items-center rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
      <span className="mr-1 h-2 w-2 rounded-full bg-emerald-500" />
      <span>{creditRemaining.toLocaleString()} credits remaining</span>
    </div>
  )
}
