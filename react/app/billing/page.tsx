"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditUsage } from "@/components/schematic/credit-usage";
import { IncludedFeatures } from "@/components/schematic/included-features";
import { Invoices } from "@/components/schematic/invoices";
import { MeteredFeatures } from "@/components/schematic/metered-features";
import { PlanManager } from "@/components/schematic/plan-manager";
import { UpcomingBill } from "@/components/schematic/upcoming-bill";
import { useBilling, useInvoices } from "@/lib/schematic";
import { schematicBilling } from "@/lib/schematic-client";

function LoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-40 w-full" />
      ))}
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="space-y-3 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </CardContent>
    </Card>
  );
}

export default function BillingPage() {
  const billing = useBilling(schematicBilling);
  const invoices = useInvoices(schematicBilling, { limit: 12 });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-6 py-4">
        <h1 className="text-2xl font-bold mb-1">Billing</h1>
        <p className="text-muted-foreground mb-6">
          Your plan, usage, and invoices.
        </p>

        {billing.isPending ? (
          <LoadingState />
        ) : billing.error ? (
          <ErrorState
            message={`Failed to load billing data: ${billing.error.message}`}
            onRetry={() => void billing.refetch()}
          />
        ) : billing.data ? (
          <div className="space-y-4">
            <PlanManager billing={billing.data} />
            <IncludedFeatures features={billing.data.features} />
            <UpcomingBill
              upcomingInvoice={billing.data.upcomingInvoice}
              subscription={billing.data.subscription}
            />
            {invoices.error ? (
              <ErrorState
                message={`Failed to load invoices: ${invoices.error.message}`}
                onRetry={() => void invoices.refetch()}
              />
            ) : (
              <Invoices invoices={invoices.data ?? []} />
            )}
            <MeteredFeatures billing={billing.data} />
            <CreditUsage billing={billing.data} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
