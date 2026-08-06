"use client"

import Link from "next/link"
import { useSchematicEntitlement, useSchematicIsPending } from "@schematichq/schematic-react"

export function CreditsBadge() {
  const isPending = useSchematicIsPending()
  const { value, creditRemaining } = useSchematicEntitlement("dashboard-prompt")

  if (isPending || creditRemaining == null) {
    return null
  }

  if (!value) {
    return (
      <Link
        href="/plan"
        className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
      >
        <span className="mr-1 h-2 w-2 rounded-full bg-amber-500" />
        <span>Buy more credits</span>
      </Link>
    )
  }

  return (
    <div className="inline-flex items-center rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
      <span className="mr-1 h-2 w-2 rounded-full bg-emerald-500" />
      <span>{creditRemaining.toLocaleString()} credits remaining</span>
    </div>
  )
}
