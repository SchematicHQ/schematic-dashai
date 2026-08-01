import crypto from "crypto";

import {
  ComponentspublicApi,
  Configuration,
} from "@/components/api/componentspublic";
import { PricingTable, toPricingTablePlans } from "@/components/pricing-table";
import type { PricingTablePeriod } from "@/components/pricing-table";

export default async function Page() {
  const publishableKey = process.env.NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY;
  if (!publishableKey) {
    return (
      <div className="min-h-screen bg-background text-white p-6">
        No Schematic key
      </div>
    );
  }

  const componentsPublicApi = new ComponentspublicApi(
    new Configuration({
      apiKey: publishableKey,
      headers: {
        "X-Schematic-Components-Version":
          process.env.SCHEMATIC_COMPONENTS_VERSION || "unknown",
        "X-Schematic-Session-ID": crypto.randomUUID(),
      },
    }),
  );

  const { data: catalog } = await componentsPublicApi.getPublicPlans();
  const periods: PricingTablePeriod[] = [
    { label: "Billed monthly", value: "month" },
    { label: "Billed yearly", value: "year" },
  ];

  const plans = toPricingTablePlans(
    catalog.activePlans,
    periods.map(({ value }) => value),
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-4">
        <PricingTable plans={plans} periods={periods} />
      </div>
    </div>
  );
}
