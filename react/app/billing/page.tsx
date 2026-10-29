"use client"

import { InvoicesSection } from "@/components/billing/invoices-section"
import { MeteredFeaturesSection } from "@/components/billing/metered-features-section"
import { PlanManagerSection } from "@/components/billing/plan-manager-section"
import { UpcomingBillSection } from "@/components/billing/upcoming-bill-section"

// A custom customer portal: Schematic's hooks and derivations rendered in
// DashAI's own shadcn components, no Schematic UI on the page.
export default function BillingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Your plan, usage, and payment history.
          </p>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <PlanManagerSection />
            <MeteredFeaturesSection />
          </div>
          <div className="flex flex-col gap-6">
            <UpcomingBillSection />
            <InvoicesSection />
          </div>
        </div>
      </div>
    </div>
  )
}
