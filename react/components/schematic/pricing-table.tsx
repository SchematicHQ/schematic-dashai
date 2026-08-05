"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCurrency,
  formatNumber,
  getDisplayPrice,
  getPlanPrice,
  pluralize,
  type Catalog,
  type CatalogPlan,
} from "@/lib/schematic";

export interface PricingTableProps {
  catalog: Catalog;
  /** Wire this up when checkout ships; omitted → disabled "coming soon" buttons. */
  onSelectPlan?: (plan: CatalogPlan, period: string) => void;
}

function entitlementLabel(plan: CatalogPlan): string[] {
  return (plan.entitlements ?? []).flatMap((entitlement) => {
    const feature = entitlement.feature;
    if (!feature) {
      return [];
    }
    if (typeof entitlement.valueNumeric === "number") {
      const unit = pluralize(
        feature.singularName ?? feature.name,
        entitlement.valueNumeric,
      ).toLowerCase();
      return [`${formatNumber(entitlement.valueNumeric)} ${unit}`];
    }
    if (entitlement.valueType === "unlimited") {
      return [`Unlimited ${(feature.pluralName ?? feature.name).toLowerCase()}`];
    }
    return [feature.name];
  });
}

/** Catalog of purchasable plans; works in both public and company modes. */
export function PricingTable({ catalog, onSelectPlan }: PricingTableProps) {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const { plans, displaySettings } = catalog;

  if (plans.length === 0) {
    return null;
  }

  const hasYearlyPrices = plans.some((plan) => plan.yearlyPrice);
  const showToggle = displaySettings.showPeriodToggle && hasYearlyPrices;

  return (
    <div className="space-y-6">
      {showToggle && (
        <div className="flex justify-center gap-1 rounded-lg bg-secondary p-1 w-fit mx-auto">
          {(["month", "year"] as const).map((option) => (
            <Button
              key={option}
              variant={period === option ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod(option)}
            >
              {option === "month" ? "Monthly" : "Yearly"}
            </Button>
          ))}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const price = getPlanPrice(plan, period);
          const features = entitlementLabel(plan);
          const isFree = !price || price.price === 0;
          const display = getDisplayPrice(
            price?.price ?? 0,
            period,
            displaySettings.showAsMonthlyPrices,
          );

          return (
            <Card key={plan.id} className={plan.current ? "border-accent" : undefined}>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.current && <Badge>Current plan</Badge>}
                </div>
                {plan.description && (
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="text-3xl font-bold">
                  {plan.custom ? (
                    <span className="text-2xl">
                      {plan.customPlanConfig?.priceText || "Custom"}
                    </span>
                  ) : isFree && displaySettings.showZeroPriceAsFree ? (
                    "Free"
                  ) : (
                    <>
                      {formatCurrency(display.amount, price?.currency, {
                        // A yearly price ÷ 12 can repeat; show it as money, not
                        // as a sub-cent rate.
                        significantDigits: !display.isMonthlyEquivalent,
                      })}
                      <span className="text-sm font-normal text-muted-foreground">
                        {display.suffix}
                      </span>
                    </>
                  )}
                </p>

                {features.length > 0 && (
                  <ul className="flex-1 space-y-2 text-sm">
                    {features.map((label, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
                        <span>{label}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {plan.custom ? (
                  <Button variant="outline" asChild>
                    <a
                      href={plan.customPlanConfig?.ctaWebSite || "#"}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {plan.customPlanConfig?.ctaText || "Talk to sales"}
                    </a>
                  </Button>
                ) : plan.current ? (
                  <Button variant="secondary" disabled>
                    Your plan
                  </Button>
                ) : (
                  <Button
                    onClick={onSelectPlan ? () => onSelectPlan(plan, period) : undefined}
                    disabled={!onSelectPlan || plan.valid === false}
                    title={
                      !onSelectPlan
                        ? "Checkout is coming soon"
                        : plan.valid === false
                          ? (plan.invalidReason ??
                            "This plan is not available for your account")
                          : undefined
                    }
                  >
                    {plan.isTrialable && plan.companyCanTrial ? "Start trial" : "Choose plan"}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
