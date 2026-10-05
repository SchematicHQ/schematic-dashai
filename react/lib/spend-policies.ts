import type { CreditSpendPolicy, CreditSpendWindow } from "@schematichq/schematic-react"

/** Credits the policy still lets a single spend draw, as of the server's last update.
 * Undefined for a kind this app does not know how to read. */
export function policyHeadroom(policy: CreditSpendPolicy) {
  if (policy.kind === "per_draw") return policy.limit
  if (policy.kind === "window") return policy.limit - policy.consumed
  return undefined
}

/**
 * The policy that turned the entitlement off, or undefined when an empty balance did.
 *
 * The flag check refuses a draw when its cost exceeds the balance or any policy's headroom,
 * but it does not tell the SDK which one refused. The cost is unknown here, so compare the
 * tightest policy with the balance instead: a policy with less headroom than the balance
 * refuses every draw the balance would, and a policy with no headroom refuses every draw.
 * Call this only when the entitlement is off.
 */
export function findBlockingPolicy(policies: CreditSpendPolicy[], balance: number) {
  let tightest: CreditSpendPolicy | undefined
  let tightestHeadroom = Infinity

  for (const policy of policies) {
    const headroom = policyHeadroom(policy)
    if (headroom != null && headroom < tightestHeadroom) {
      tightest = policy
      tightestHeadroom = headroom
    }
  }

  if (tightest && (tightestHeadroom <= 0 || tightestHeadroom < balance)) {
    return tightest
  }
  return undefined
}

export function policyName(policy: CreditSpendPolicy) {
  if (policy.label) return policy.label

  switch (policy.scope) {
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

/** Whose limit it is, for use inside a sentence. */
export function policyOwner(policy: CreditSpendPolicy) {
  switch (policy.scope) {
    case "company":
      return "your company's"
    case "user":
      return "your"
    case "group":
      return "your group's"
    default:
      return "a"
  }
}

export function windowName({ unit, count }: CreditSpendWindow) {
  if (unit === "billing_period") {
    return "per billing period"
  }
  if (count === 1) {
    return `per ${unit}`
  }
  return `per ${count} ${unit}s`
}

export function formatCredits(amount: number) {
  return amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export function formatDuration(ms: number) {
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
