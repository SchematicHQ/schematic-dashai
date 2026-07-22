"use client";

import { /* useEffect, useMemo, */ useState } from "react";
import type { Schematic } from "@schematichq/schematic-typescript-node";
import {
  formatCurrency,
  getPlanPrice,
} from "@schematichq/schematic-components";

/* import {
  ComponentspublicApi,
  Configuration,
} from "../components/api/componentspublic"; */
import { PricingTable as Headless } from "./headless/pricing-table";
import { PricingTablePeriod } from "@/app/pricing/page";

interface PricingTableProps {
  catalog: Schematic.PublicPlansResponseData;
  periods: PricingTablePeriod[];
}

export function PricingTable({ catalog, periods }: PricingTableProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  /* const sessionId = useMemo(() => uuidv4(), []);
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
  ); */

  return (
    <Headless.Root
      className="pt-16"
      onPeriodChange={(period) => {
        setSelectedPeriod(period);
      }}
    >
      <Headless.PeriodToggle className="flex self-center rounded-full border border-border float-end mb-4">
        {periods.map((period) => (
          <Headless.PeriodOption
            key={period.value}
            value={period.value}
            className="flex grow basis-1/2 font-medium text-white px-6 py-3 text-nowrap leading-none rounded-full transition-all data-selected:font-semibold data-selected:bg-border"
          >
            {period.label}
          </Headless.PeriodOption>
        ))}
      </Headless.PeriodToggle>

      <Headless.Label className="text-2xl font-semibold text-white mb-4">
        Plans
      </Headless.Label>

      <Headless.Section className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 flex-wrap clear-right">
        {catalog?.activePlans.map((plan, idx) => {
          const planPrice = getPlanPrice(plan, selectedPeriod)?.price;

          return (
            <Headless.Card
              key={plan.id}
              className="relative flex flex-col text-white border border-border bg-card rounded-xl p-6 shadow-2xl outline-4 outline-transparent data-active:outline-accent"
            >
              <Headless.Name className="text-4xl font-bold leading-none tracking-tight">
                {plan.name}
              </Headless.Name>
              <Headless.Description className="text-muted-foreground text-lg mb-4">
                {plan.description}
              </Headless.Description>

              {typeof planPrice === "number" && (
                <Headless.Price className="text-3xl font-semibold tracking-tight mb-8">
                  {formatCurrency(planPrice)}
                </Headless.Price>
              )}

              <Headless.Entitlements className="grow list-disc pl-4 space-y-1 mb-8">
                {plan.entitlements?.map((entitlement) => (
                  <Headless.Entitlement key={entitlement.id}>
                    {entitlement.feature?.name}
                  </Headless.Entitlement>
                ))}
              </Headless.Entitlements>

              <Headless.Footer>
                <Headless.CallToAction className="flex justify-center w-full p-4 text-lg font-medium leading-none text-white bg-accent border border-accent rounded-lg transition-all">
                  Choose plan
                </Headless.CallToAction>
              </Headless.Footer>
            </Headless.Card>
          );
        })}
      </Headless.Section>
    </Headless.Root>
  );
}
