import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  formatCurrency,
  getPlanPrice,
} from "@schematichq/schematic-components";

import {
  ComponentspublicApi,
  Configuration,
  type PublicPlansResponseData,
} from "../components/api/componentspublic";
import { PricingTable } from "./headless/pricing-table";

export function PricingTableElement() {
  const periods = [
    { label: "Billed monthly", value: "month" },
    { label: "Billed yearly", value: "year" },
  ];

  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [catalog, setCatalog] = useState<PublicPlansResponseData>();

  const sessionId = useMemo(() => uuidv4(), []);
  const api = useMemo(
    () =>
      new ComponentspublicApi(
        new Configuration({
          apiKey: process.env.NEXT_PUBLIC_SCHEMATIC_PUBLISHABLE_KEY,
          headers: {
            "X-Schematic-Components-Version":
              process.env.SCHEMATIC_COMPONENTS_VERSION || "unknown",
            "X-Schematic-Session-ID": sessionId,
          },
        }),
      ),
    [sessionId],
  );

  useEffect(() => {
    api.getPublicPlans().then((res) => {
      setCatalog(res.data);
    });
  }, []);

  return (
    <PricingTable.Root
      className="pt-16"
      onPeriodChange={(period) => {
        setSelectedPeriod(period);
      }}
    >
      <PricingTable.PeriodToggle className="flex self-center rounded-full border border-border float-end mb-4">
        {periods.map((period) => (
          <PricingTable.PeriodOption
            key={period.value}
            value={period.value}
            className="flex grow basis-1/2 font-medium text-white px-6 py-3 text-nowrap leading-none rounded-full transition-all data-selected:font-semibold data-selected:bg-border"
          >
            {period.label}
          </PricingTable.PeriodOption>
        ))}
      </PricingTable.PeriodToggle>

      <PricingTable.Label className="text-2xl font-semibold text-white mb-4">
        Plans
      </PricingTable.Label>

      <PricingTable.Section className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 flex-wrap clear-right">
        {catalog?.activePlans.map((plan, idx) => {
          const planPrice = getPlanPrice(plan, selectedPeriod)?.price;

          return (
            <PricingTable.Card
              key={plan.id}
              className="relative flex flex-col text-white border border-border bg-card rounded-xl p-6 shadow-2xl outline-4 outline-transparent data-active:outline-accent"
            >
              <PricingTable.Name className="text-4xl font-bold leading-none tracking-tight">
                {plan.name}
              </PricingTable.Name>
              <PricingTable.Description className="text-muted-foreground text-lg mb-4">
                {plan.description}
              </PricingTable.Description>

              {typeof planPrice === "number" && (
                <PricingTable.Price className="text-3xl font-semibold tracking-tight mb-8">
                  {formatCurrency(planPrice)}
                </PricingTable.Price>
              )}

              <PricingTable.Entitlements className="grow list-disc pl-4 space-y-1 mb-8">
                {plan.entitlements?.map((entitlement) => (
                  <PricingTable.Entitlement key={entitlement.id}>
                    {entitlement.feature?.name}
                  </PricingTable.Entitlement>
                ))}
              </PricingTable.Entitlements>

              <PricingTable.Footer>
                <PricingTable.CallToAction className="flex justify-center w-full p-4 text-lg font-medium leading-none text-white bg-accent border border-accent rounded-lg transition-all">
                  Choose plan
                </PricingTable.CallToAction>
              </PricingTable.Footer>
            </PricingTable.Card>
          );
        })}
      </PricingTable.Section>
    </PricingTable.Root>
  );
}
