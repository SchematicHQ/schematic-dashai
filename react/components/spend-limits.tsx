"use client"

import { Clock } from "lucide-react"
import type { CreditSpendPolicy } from "@schematichq/schematic-react"
import { useNow } from "@/hooks/use-now"
import { cn } from "@/lib/utils"
import { formatCredits, formatDuration, policyName, policyOwner, windowName } from "@/lib/spend-policies"

/** Replaces the out-of-credits banner when a spend policy, not the balance, stops the next prompt. */
export function SpendLimitBanner({ policy, balance }: { policy: CreditSpendPolicy; balance: number }) {
  const owner = policyOwner(policy)
  const limit = formatCredits(policy.limit)

  const message =
    policy.kind === "window" && policy.window
      ? `You've reached ${owner} limit of ${limit} credits ${windowName(policy.window)}. Your ${formatCredits(balance)} remaining credits unlock when it resets.`
      : `${owner.charAt(0).toUpperCase() + owner.slice(1)} limit caps each request at ${limit} credits, which is less than a prompt costs. Ask an admin to raise it.`

  return (
    <div className="mt-4 rounded-lg border border-violet-200 dark:border-violet-800/80 bg-violet-50/80 dark:bg-violet-950/40 p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Clock className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-violet-900 dark:text-violet-100">Spend limit reached</p>
          <p className="text-xs text-violet-700 dark:text-violet-300">{message}</p>
        </div>
      </div>
      {policy.resetsAt && (
        <span className="shrink-0 rounded-full border border-violet-300 dark:border-violet-700 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300">
          <Countdown to={policy.resetsAt} prefix="Resets in " ended="Resetting now" />
        </span>
      )}
    </div>
  )
}

/** Live time left until `to`, as `prefix` plus a duration; `ended` once it passes. */
export function Countdown({ to, prefix, ended }: { to: Date; prefix: string; ended: string }) {
  const now = useNow(1000)
  const ms = to.getTime() - now

  return (
    <span className="tabular-nums" title={to.toLocaleString()}>
      {ms > 0 ? `${prefix}${formatDuration(ms)}` : ended}
    </span>
  )
}

// Mounted only while the hover card is open, so the clock ticks only then.
export function SpendPolicyList({ policies }: { policies: CreditSpendPolicy[] }) {
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
  const name = policyName(policy)

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
  const period = windowName(policy.window)

  return (
    <div className="flex flex-col gap-1.5">
      <PolicyHeader name={name} period={period.charAt(0).toUpperCase() + period.slice(1)} />
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
            {periodEnded ? "Period reset" : `Resets in ${formatDuration(msUntilReset)}`}
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
