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
import {
  FeatureType,
  useInvoices,
  useSubscription,
} from "@schematichq/schematic-react";

import { schematicCustomer } from "@/lib/schematic-client";

function LoadingState() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-40 w-full" />
      ))}
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
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
  const billing = useSubscription({ client: schematicCustomer });
  // Invoices lists filters client-side (zero-amount, voided, the upcoming
  // preview), so the fetch has to be generous enough that a page of noise does
  // not hide every real invoice. 100 is the API default; the max is 250.
  const invoices = useInvoices({ client: schematicCustomer, limit: 100 });

  // MeteredFeatures owns event/trait entitlements; leaving them in
  // IncludedFeatures too renders each one twice, with two different usage
  // strings for pay-as-you-go and overage features.
  const includedFeatures = (billing.data?.features ?? []).filter(
    (feature) =>
      feature.feature?.featureType !== FeatureType.Event &&
      feature.feature?.featureType !== FeatureType.Trait,
  );

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
            <IncludedFeatures features={includedFeatures} />
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
