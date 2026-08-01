import { getPlanPrice, type PlanPricing } from "@/components/utils";

import type {
  PricingTableFeature,
  PricingTablePlan,
  PricingTablePrice,
} from "./PricingTable";

export interface PlanEntitlements {
  entitlements?: Array<{
    id: string;
    feature?: { name: string } | null;
  }> | null;
}

export type AdaptablePlan = PlanPricing &
  PlanEntitlements & {
    id: string;
    name: string;
    description?: string;
  };

export function getPlanPricesByPeriod(
  plan: PlanPricing,
  periods: string[],
  currency?: string,
): Record<string, PricingTablePrice> {
  return periods.reduce<Record<string, PricingTablePrice>>((acc, period) => {
    const price = getPlanPrice(
      plan,
      period,
      { useSelectedPeriod: true },
      currency,
    );

    if (typeof price?.price === "number") {
      acc[period] = { amount: price.price, currency: price.currency };
    }

    return acc;
  }, {});
}

export function getPlanFeatures(plan: PlanEntitlements): PricingTableFeature[] {
  return (plan.entitlements ?? []).reduce<PricingTableFeature[]>(
    (acc, entitlement) => {
      if (entitlement.feature?.name) {
        acc.push({ id: entitlement.id, name: entitlement.feature.name });
      }

      return acc;
    },
    [],
  );
}

export function toPricingTablePlan(
  plan: AdaptablePlan,
  periods: string[],
  currency?: string,
): PricingTablePlan {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    prices: getPlanPricesByPeriod(plan, periods, currency),
    features: getPlanFeatures(plan),
  };
}

export function toPricingTablePlans(
  plans: AdaptablePlan[] = [],
  periods: string[],
  currency?: string,
): PricingTablePlan[] {
  return plans.map((plan) => toPricingTablePlan(plan, periods, currency));
}
