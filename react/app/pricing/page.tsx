"use client";

import { useRouter } from "next/navigation";
import { useCatalog, type CatalogPlan } from "@schematichq/schematic-react";

import { schematicCustomer } from "@/lib/schematic/customer-client";
import { PricingTable } from "@/components/schematic/pricing-table";
import { ErrorState } from "@/components/ui/error-state";
import { SkeletonList } from "@/components/ui/skeleton";

function PricingPlans() {
  const router = useRouter();
  const catalog = useCatalog({ client: schematicCustomer });

  // Checkout is being reworked and useCheckout does not exist yet, so plan
  // selection hands off to the plan portal, which still runs the embed's
  // working checkout flow. Replace with useCheckout when it lands.
  const handoff = (params: Record<string, string>) => {
    router.push(`/plan?${new URLSearchParams(params).toString()}`);
  };

  const handleSelectPlan = (plan: CatalogPlan, period: string) => {
    handoff({ plan: plan.id, period });
  };

  const handleSelectAddOn = (addOn: CatalogPlan, period: string) => {
    handoff({ addOn: addOn.id, period });
  };

  if (catalog.isPending) {
    return (
      <SkeletonList
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        itemClassName="h-80 w-full"
      />
    );
  }

  if (catalog.error) {
    return (
      <ErrorState
        message={`Failed to load pricing: ${catalog.error.message}`}
        onRetry={() => void catalog.refetch()}
      />
    );
  }

  if (!catalog.data) {
    return null;
  }

  return (
    <PricingTable
      catalog={catalog.data}
      onSelectPlan={handleSelectPlan}
      onSelectAddOn={handleSelectAddOn}
    />
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-4">
        <h1 className="text-2xl font-bold mb-1">Pricing</h1>
        <p className="text-muted-foreground mb-6">
          Plans for teams of every size.
        </p>

        <PricingPlans />
      </div>
    </div>
  );
}
