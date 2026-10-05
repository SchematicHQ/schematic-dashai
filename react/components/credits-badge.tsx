"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  useSchematicCreditSpendPolicies,
  useSchematicEntitlement,
  useSchematicIsPending,
  type CreditSpendPolicy,
} from "@schematichq/schematic-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"

export function CreditsBadge() {
  const isPending = useSchematicIsPending()
  const { value, creditId, creditRemaining } = useSchematicEntitlement("dashboard-prompt")
  const { policies } = useSchematicCreditSpendPolicies()

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

  // Older payloads omit creditId; show every policy rather than none.
  const creditPolicies = creditId ? policies.filter((policy) => policy.creditId === creditId) : policies

  const badgeContent = (
    <>
      <span className="mr-1 h-2 w-2 rounded-full bg-emerald-500" />
      <span>{creditRemaining.toLocaleString()} credits remaining</span>
    </>
  )

  if (creditPolicies.length === 0) {
    return (
      <div className="inline-flex items-center rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
        {badgeContent}
      </div>
    )
  }

  return (
    <HoverCard openDelay={100} closeDelay={150}>
      <HoverCardTrigger asChild>
        <div
          tabIndex={0}
          className="inline-flex cursor-default items-center rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground transition-colors outline-none hover:bg-muted/70 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {badgeContent}
        </div>
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-80 p-0">
        <SpendPolicyList policies={creditPolicies} />
      </HoverCardContent>
    </HoverCard>
  )
}

// Mounted only while the hover card is open, so the countdown ticks only then.
function SpendPolicyList({ policies }: { policies: CreditSpendPolicy[] }) {
  const now = useNow(1000)

  return (
    <div className="flex flex-col">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-medium">Spend limits</p>
        <p className="text-xs text-muted-foreground">Limits on how fast these credits can be spent.</p>
      </div>
      <ul className="flex flex-col gap-4 px-4 py-3">
        {policies.map((policy) => (
          <li key={policy.id}>
            <SpendPolicyRow policy={policy} now={now} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function SpendPolicyRow({ policy, now }: { policy: CreditSpendPolicy; now: number }) {
  const name = policy.label || scopeName(policy.scope)

  if (policy.kind === "per_draw") {
    return (
      <div className="flex flex-col gap-1">
        <PolicyHeader name={name} period="Per request" />
        <p className="text-xs text-muted-foreground">
          Up to <span className="text-foreground">{formatCredits(policy.limit)}</span> credits per request
        </p>
      </div>
    )
  }

  if (policy.kind !== "window" || !policy.window) {
    return (
      <div className="flex flex-col gap-1">
        <PolicyHeader name={name} />
        <p className="text-xs text-muted-foreground">
          <span className="text-foreground">{formatCredits(policy.limit)}</span> credit limit
        </p>
      </div>
    )
  }

  // Once the period ends, the SDK says to read consumed as 0 until the next update arrives.
  const msUntilReset = policy.resetsAt ? policy.resetsAt.getTime() - now : undefined
  const periodEnded = msUntilReset != null && msUntilReset <= 0
  const consumed = periodEnded ? 0 : policy.consumed
  const remaining = Math.max(policy.limit - consumed, 0)
  const usedRatio = policy.limit > 0 ? Math.min(consumed / policy.limit, 1) : 1

  return (
    <div className="flex flex-col gap-1.5">
      <PolicyHeader name={name} period={windowName(policy.window)} />
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            usedRatio >= 1 ? "bg-red-500" : usedRatio >= 0.8 ? "bg-amber-500" : "bg-emerald-500",
          )}
          style={{ width: `${usedRatio * 100}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          <span className="text-foreground">{formatCredits(remaining)}</span> of {formatCredits(policy.limit)} left
        </span>
        {msUntilReset != null && (
          <span className="tabular-nums" title={policy.resetsAt?.toLocaleString()}>
            {periodEnded ? "Resetting now" : `Resets in ${formatDuration(msUntilReset)}`}
          </span>
        )}
      </div>
    </div>
  )
}

function PolicyHeader({ name, period }: { name: string; period?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="truncate text-xs font-medium text-foreground">{name}</span>
      {period && <span className="shrink-0 text-xs text-muted-foreground">{period}</span>}
    </div>
  )
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}

function scopeName(scope: CreditSpendPolicy["scope"]) {
  switch (scope) {
    case "company":
      return "Company limit"
    case "user":
      return "Your limit"
    case "group":
      return "Group limit"
    default:
      return "Limit"
  }
}

function windowName({ unit, count }: NonNullable<CreditSpendPolicy["window"]>) {
  if (unit === "billing_period") {
    return "Per billing period"
  }
  if (count === 1) {
    return `Per ${unit}`
  }
  return `Per ${count} ${unit}s`
}

function formatCredits(amount: number) {
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatDuration(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}
