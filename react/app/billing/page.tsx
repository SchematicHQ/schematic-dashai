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
  type InvoiceResponseData,
  type SchematicHookResult,
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

function InvoicesSection({
  invoices,
}: {
  invoices: SchematicHookResult<InvoiceResponseData[]>;
}) {
  if (invoices.error) {
    return (
      <ErrorState
        message={`Failed to load invoices: ${invoices.error.message}`}
        onRetry={() => void invoices.refetch()}
      />
    );
  }

  return <Invoices invoices={invoices.data ?? []} />;
}

function BillingSections() {
  const billing = useSubscription({ client: schematicCustomer });
  const invoices = useInvoices({ client: schematicCustomer });

  if (billing.isPending) {
    return <LoadingState />;
  }

  if (billing.error) {
    return (
      <ErrorState
        message={`Failed to load billing data: ${billing.error.message}`}
        onRetry={() => void billing.refetch()}
      />
    );
  }

  if (!billing.data) {
    return null;
  }

  const billingData = billing.data;

  return (
    <div className="space-y-4">
      <PlanManager billing={billingData} />
      <IncludedFeatures features={billingData.features} />
      <UpcomingBill
        upcomingInvoice={billingData.upcomingInvoice}
        subscription={billingData.subscription}
      />
      <InvoicesSection invoices={invoices} />
      <MeteredFeatures billing={billingData} />
      <CreditUsage billing={billingData} />
    </div>
  );
}

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-2xl px-6 py-4">
        <h1 className="text-2xl font-bold mb-1">Billing</h1>
        <p className="text-muted-foreground mb-6">
          Your plan, usage, and invoices.
        </p>

        <BillingSections />
      </div>
    </div>
  );
}
