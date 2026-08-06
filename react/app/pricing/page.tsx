"use client";

import { useRouter } from "next/navigation";

import { PricingTable } from "@/components/schematic/pricing-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCatalog } from "@schematichq/schematic-react";

import { schematicCustomer } from "@/lib/schematic-client";

export default function PricingPage() {
  const router = useRouter();
  // "auto" uses the company-scoped catalog when an access token is available,
  // so a signed-in customer sees which plan is theirs and which they are
  // eligible for; it falls back to the publishable-key catalog otherwise.
  const catalog = useCatalog({ client: schematicCustomer });

  // Checkout is being reworked and useCheckout does not exist yet, so plan
  // selection hands off to the plan portal, which still runs the embed's
  // working checkout flow. Replace with useCheckout when it lands.
  const handleSelectPlan = () => {
    router.push("/plan");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-4">
        <h1 className="text-2xl font-bold mb-1">Pricing</h1>
        <p className="text-muted-foreground mb-6">
          Plans for teams of every size.
        </p>

        {catalog.isPending ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-80 w-full" />
            ))}
          </div>
        ) : catalog.error ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Failed to load pricing: {catalog.error.message}
            </p>
            <Button variant="outline" onClick={() => void catalog.refetch()}>
              Retry
            </Button>
          </div>
        ) : catalog.data ? (
          <PricingTable
            catalog={catalog.data}
            onSelectPlan={handleSelectPlan}
          />
        ) : null}
      </div>
    </div>
  );
}
