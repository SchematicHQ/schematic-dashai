"use client";

import {
  useInvoices,
  useSubscription,
  type InvoiceResponseData,
  type SchematicHookResult,
} from "@schematichq/schematic-react";

import { schematicCustomer } from "@/lib/schematic-client";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonList } from "@/components/ui/skeleton";
import { CreditUsage } from "@/components/schematic/credit-usage";
import { IncludedFeatures } from "@/components/schematic/included-features";
import { Invoices } from "@/components/schematic/invoices";
import { MeteredFeatures } from "@/components/schematic/metered-features";
import { PlanManager } from "@/components/schematic/plan-manager";
import { UpcomingBill } from "@/components/schematic/upcoming-bill";

function InvoicesSection({
  invoices,
}: {
  invoices: SchematicHookResult<InvoiceResponseData[]>;
}) {
  if (invoices.error) {
    return (
      <ErrorState
        card
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
    return <SkeletonList className="space-y-4" itemClassName="h-40 w-full" />;
  }

  if (billing.error) {
    return (
      <ErrorState
        card
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
