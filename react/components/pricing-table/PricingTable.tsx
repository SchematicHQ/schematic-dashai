"use client";

import { useState } from "react";

import { formatCurrency } from "@/components/utils";

export interface PricingTablePeriod {
  value: string;
  label: string;
}

export interface PricingTablePrice {
  /** Amount in the currency's minor units, e.g. cents for USD. */
  amount: number;
  /** ISO 4217 code, e.g. "usd". Defaults to USD when omitted. */
  currency?: string;
}

export interface PricingTableFeature {
  id: string;
  name: string;
}

export interface PricingTablePlan {
  id: string;
  name: string;
  description?: string;
  /** Price per billing period, keyed by `PricingTablePeriod.value`. */
  prices?: Record<string, PricingTablePrice | undefined>;
  features?: PricingTableFeature[];
}

interface PricingTableProps {
  plans: PricingTablePlan[];
  periods: PricingTablePeriod[];
  /** Period selected on mount. Falls back to the first period. */
  defaultPeriod?: string;
  onSelectPlan?: (plan: PricingTablePlan) => void;
}

export function PricingTable({
  plans,
  periods,
  defaultPeriod,
  onSelectPlan,
}: PricingTableProps) {
  const [selectedPeriod, setSelectedPeriod] = useState(
    defaultPeriod ?? periods[0]?.value,
  );

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
        {plans.map((plan) => {
          const price = selectedPeriod
            ? plan.prices?.[selectedPeriod]
            : undefined;

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

              {typeof price?.amount === "number" && (
                <div className="text-3xl font-semibold tracking-tight mb-8">
                  {formatCurrency(price.amount, price.currency)}
                </div>
              )}

              <ul className="grow list-disc pl-4 space-y-1 mb-8">
                {plan.features?.map((feature) => (
                  <li key={feature.id}>{feature.name}</li>
                ))}
              </ul>

              <div>
                <button
                  type="button"
                  onClick={() => onSelectPlan?.(plan)}
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
