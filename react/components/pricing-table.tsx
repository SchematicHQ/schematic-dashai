"use client";

import { useState } from "react";
import type { PublicPlansResponseData } from "@/components/api/componentspublic";

import { PricingTablePeriod } from "@/app/pricing/page";
import { formatCurrency, getPlanPrice } from "@/components/utils";

interface PricingTableProps {
  catalog: PublicPlansResponseData;
  periods: PricingTablePeriod[];
}

export function PricingTable({ catalog, periods }: PricingTableProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  return (
    <div className="pt-16">
      <div
        role="radiogroup"
        aria-label="Billing period"
        className="flex self-center rounded-full border border-border float-end mb-4"
      >
        {periods.map((period) => {
          const isSelected = period.value === selectedPeriod;

          return (
            <button
              key={period.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-selected={isSelected || undefined}
              onClick={() => setSelectedPeriod(period.value)}
              className="flex grow basis-1/2 font-medium text-white px-6 py-3 text-nowrap leading-none rounded-full transition-all data-selected:font-semibold data-selected:bg-border"
            >
              {period.label}
            </button>
          );
        })}
      </div>

      <h2 className="text-2xl font-semibold text-white mb-4">Plans</h2>

      <ul className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 flex-wrap clear-right">
        {catalog?.activePlans.map((plan) => {
          const planPrice = getPlanPrice(plan, selectedPeriod)?.price;

          return (
            <li
              key={plan.id}
              className="relative flex flex-col text-white border border-border bg-card rounded-xl p-6 shadow-2xl"
            >
              <h3 className="text-4xl font-bold leading-none tracking-tight">
                {plan.name}
              </h3>
              <p className="text-muted-foreground text-lg mb-4">
                {plan.description}
              </p>

              {typeof planPrice === "number" && (
                <div className="text-3xl font-semibold tracking-tight mb-8">
                  {formatCurrency(planPrice)}
                </div>
              )}

              <ul className="grow list-disc pl-4 space-y-1 mb-8">
                {plan.entitlements?.map((entitlement) => (
                  <li key={entitlement.id}>{entitlement.feature?.name}</li>
                ))}
              </ul>

              <div>
                <button
                  type="button"
                  className="flex justify-center w-full p-4 text-lg font-medium leading-none text-white bg-accent border border-accent rounded-lg transition-all"
                >
                  Choose plan
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
