"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { UpgradeCheckout } from "@/components/billing/upgrade-checkout"

export default function UpgradePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="space-y-2">
          <Link
            href="/billing"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Billing
          </Link>
          <h1 className="text-2xl font-bold">Change plan</h1>
        </div>
        <UpgradeCheckout />
      </div>
    </div>
  )
}
