"use client"

import Link from "next/link"
import type { CreditSpendPolicy } from "@schematichq/schematic-react"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Countdown, SpendPolicyList } from "@/components/spend-limits"
import { usePromptCredits, useRefreshWhenWindowEnds } from "@/hooks/use-prompt-credits"
import { cn } from "@/lib/utils"

export function CreditsBadge() {
  const { isPending, value, creditRemaining, policies, blockingPolicy } = usePromptCredits()

  // The header renders this badge on every page, so it owns the refresh.
  useRefreshWhenWindowEnds(blockingPolicy?.resetsAt)

  if (isPending || creditRemaining == null) {
    return null
  }

  if (blockingPolicy) {
    return (
      <PolicyHoverCard policies={policies}>
        <BadgePill className="border-amber-500/40 bg-amber-500/10 font-medium text-amber-600 dark:text-amber-400 data-[state]:hover:bg-amber-500/20">
          <span className="mr-1 h-2 w-2 rounded-full bg-amber-500" />
          {blockingPolicy.resetsAt ? (
            <Countdown to={blockingPolicy.resetsAt} prefix="Spend limit resets in " ended="Spend limit resetting…" />
          ) : (
            <span>Spend limit reached</span>
          )}
        </BadgePill>
      </PolicyHoverCard>
    )
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
    <PolicyHoverCard policies={policies}>
      <BadgePill className="bg-muted/40 text-muted-foreground data-[state]:hover:bg-muted/70 data-[state]:hover:text-foreground">
        <span className="mr-1 h-2 w-2 rounded-full bg-emerald-500" />
        <span>{creditRemaining.toLocaleString()} credits remaining</span>
      </BadgePill>
    </PolicyHoverCard>
  )
}

// Hover styles key on data-state, which only the hover card trigger sets.
function BadgePill({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "inline-flex cursor-default items-center rounded-full border px-3 py-1 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      {...props}
    />
  )
}

/** Shows the spend policies on hover, or renders the badge alone when there are none. */
function PolicyHoverCard({ policies, children }: { policies: CreditSpendPolicy[]; children: React.ReactElement }) {
  if (policies.length === 0) {
    return children
  }

  return (
    <HoverCard openDelay={100} closeDelay={150}>
      <HoverCardTrigger asChild tabIndex={0}>
        {children}
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-80 p-0">
        <SpendPolicyList policies={policies} />
      </HoverCardContent>
    </HoverCard>
  )
}
