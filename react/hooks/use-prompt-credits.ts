"use client"

import { useEffect, useMemo } from "react"
import {
  useSchematic,
  useSchematicCreditSpendPolicies,
  useSchematicEntitlement,
  useSchematicIsPending,
} from "@schematichq/schematic-react"
import { findBlockingPolicy } from "@/lib/spend-policies"

// Wait a little past the window end, so the server's clock has rolled over too.
const RESET_GRACE_MS = 1000
const RESET_RETRY_MS = 30_000
const RESET_MAX_ATTEMPTS = 5

/** The dashboard-prompt credit entitlement, the spend policies on its credit, and the policy blocking it, if any. */
export function usePromptCredits() {
  const isPending = useSchematicIsPending()
  const { value, creditId, creditRemaining } = useSchematicEntitlement("dashboard-prompt")
  const { policies } = useSchematicCreditSpendPolicies()

  // Older payloads omit creditId; show every policy rather than none.
  const creditPolicies = useMemo(
    () => (creditId ? policies.filter((policy) => policy.creditId === creditId) : policies),
    [policies, creditId],
  )

  const blockingPolicy =
    !value && creditRemaining != null ? findBlockingPolicy(creditPolicies, creditRemaining) : undefined

  return { isPending, value, creditRemaining, policies: creditPolicies, blockingPolicy }
}

/**
 * The server does not push an update when a spend window ends, so a flag the window turned off
 * stays off. Reconnect once the window ends, so the server checks the flag again.
 */
export function useRefreshWhenWindowEnds(resetsAt: Date | undefined) {
  const { client } = useSchematic()
  const resetsAtMs = resetsAt?.getTime()

  useEffect(() => {
    if (resetsAtMs == null) return

    let attempts = 0
    let timer: ReturnType<typeof setTimeout>
    const schedule = (delay: number) => {
      timer = setTimeout(() => {
        attempts++
        void client.forceReconnect()
        // A successful refresh changes resetsAt or clears the block, which cancels this timer.
        if (attempts < RESET_MAX_ATTEMPTS) schedule(RESET_RETRY_MS)
      }, delay)
    }
    schedule(Math.max(resetsAtMs - Date.now(), 0) + RESET_GRACE_MS)

    return () => clearTimeout(timer)
  }, [client, resetsAtMs])
}
