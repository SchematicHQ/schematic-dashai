"use client"

import { useRouter } from "next/navigation"

// Where the billing sections send people. Anything that buys something goes
// through the custom checkout on /billing/upgrade.
export function useBillingNav() {
  const router = useRouter()
  return {
    openPricing: () => router.push("/billing/upgrade"),
    openAddMore: (_featureId?: string) => router.push("/billing/upgrade"),
    openAutoTopup: () => router.push("/billing/auto-topup"),
  }
}
