"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import {
  helpers,
  type Catalog,
  type CatalogPlan,
} from "@schematichq/schematic-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const {
  formatCurrency,
  formatNumber,
  getAddOnPrice,
  getDisplayPrice,
  getPlanPrice,
  pluralize,
} = helpers;

export interface PricingTableProps {
  catalog: Catalog;
  onSelectPlan?: (plan: CatalogPlan, period: string) => void;
  onSelectAddOn?: (addOn: CatalogPlan, period: string) => void;
}

/**
 * Why a plan cannot be selected, as text the customer can actually read.
 */
function ineligibilityReason(plan: CatalogPlan): string | undefined {
  if (plan.valid !== false) {
    return undefined;
  }

  if (plan.invalidReason === "downgrade_not_permitted") {
    return "Downgrading to this plan is not available self-service — contact support to change plans.";
  }

  const violations = (plan.usageViolations ?? []).flatMap(
    (violation) => violation.feature?.name ?? [],
  );
  return violations.length > 0
    ? `Cannot change to this plan while over the limit on ${violations.join(", ")}.`
    : "This plan is not available for your account.";
}

function entitlementLabel(plan: CatalogPlan): string[] {
  return (plan.entitlements ?? []).flatMap((entitlement) => {
    const feature = entitlement.feature;
    if (!feature) {
      return [];
    }

    if (typeof entitlement.valueNumeric === "number") {
      const unit = pluralize(
        feature.singularName || feature.name,
        entitlement.valueNumeric,
      ).toLowerCase();
      return [`${formatNumber(entitlement.valueNumeric)} ${unit}`];
    }

    if (entitlement.valueType === "unlimited") {
      return [
        `Unlimited ${(feature.pluralName || feature.name).toLowerCase()}`,
      ];
    }

    return [feature.name];
  });
}

/** Catalog of purchasable plans; works in both public and company modes. */
export function PricingTable({
  catalog,
  onSelectPlan,
  onSelectAddOn,
}: PricingTableProps) {
  const [period, setPeriod] = useState<"month" | "year">("month");
  const { plans, addOns, displaySettings } = catalog;

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
          // No price for the selected period means the plan is not sold that
          // way — not that it costs nothing. Only a real zero price, or a plan
          // the API marks free, is free.
          const isFree = price ? price.price === 0 : plan.isFree === true;
          const unsoldThisPeriod = !plan.custom && !price && !isFree;
          // Only reached once unsoldThisPeriod is ruled out, so the 0 fallback
          // is a real zero price rather than a missing one.
          const display = getDisplayPrice(
            price?.price ?? 0,
            period,
            displaySettings.showAsMonthlyPrices,
          );
          const note = unsoldThisPeriod
            ? `${plan.name} is only available ${period === "month" ? "yearly" : "monthly"}.`
            : (ineligibilityReason(plan) ??
              (onSelectPlan ? undefined : "Checkout is coming soon."));

          return (
            <Card
              key={plan.id}
              className={plan.current ? "border-accent" : undefined}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.current && <Badge>Current plan</Badge>}
                </div>

                {plan.description && (
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                )}
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="text-3xl font-bold">
                  {plan.custom ? (
                    <span className="text-2xl">
                      {plan.customPlanConfig?.priceText || "Custom"}
                    </span>
                  ) : unsoldThisPeriod ? (
                    <span className="text-2xl text-muted-foreground">
                      Not available {period === "month" ? "monthly" : "yearly"}
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
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-accent"
                          aria-hidden
                        />
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
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={
                        onSelectPlan
                          ? () => onSelectPlan(plan, period)
                          : undefined
                      }
                      disabled={
                        !onSelectPlan ||
                        plan.valid === false ||
                        unsoldThisPeriod
                      }
                    >
                      {plan.valid === false
                        ? "Over plan limit"
                        : plan.isTrialable && plan.companyCanTrial
                          ? "Start trial"
                          : "Choose plan"}
                    </Button>

                    {note && (
                      <p className="text-xs text-muted-foreground">{note}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {addOns.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Add-ons</h2>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {addOns.map((addOn) => {
              // One-time add-ons are priced off oneTimePrice, so an add-on with
              // no price for the selected period is genuinely unavailable.
              const price = getAddOnPrice(addOn, period);
              return (
                <Card key={addOn.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle>{addOn.name}</CardTitle>
                      {addOn.current && <Badge>Active</Badge>}
                    </div>

                    {addOn.description && (
                      <p className="text-sm text-muted-foreground">
                        {addOn.description}
                      </p>
                    )}
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-4">
                    <p className="text-xl font-semibold">
                      {price ? (
                        <>
                          {formatCurrency(price.price, price.currency)}
                          <span className="text-sm font-normal text-muted-foreground">
                            {addOn.chargeType === "one_time"
                              ? " one-time"
                              : period === "month"
                                ? "/mo"
                                : "/yr"}
                          </span>
                        </>
                      ) : (
                        <span className="text-base font-normal text-muted-foreground">
                          Not available{" "}
                          {period === "month" ? "monthly" : "yearly"}
                        </span>
                      )}
                    </p>

                    <div className="mt-auto space-y-2">
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={
                          onSelectAddOn
                            ? () => onSelectAddOn(addOn, period)
                            : undefined
                        }
                        disabled={!onSelectAddOn || !price || addOn.current}
                      >
                        {addOn.current ? "Added" : "Add"}
                      </Button>

                      {!onSelectAddOn && !addOn.current && (
                        <p className="text-xs text-muted-foreground">
                          Checkout is coming soon.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
