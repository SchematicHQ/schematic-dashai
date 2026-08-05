"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  EntitlementPriceBehavior,
  FeatureType,
  formatCurrency,
  formatDate,
  formatNumber,
  getEntitlementCost,
  getEntitlementPrice,
  getSubscriptionPeriod,
  pluralize,
  type Billing,
  type FeatureUsageResponseData,
} from "@/lib/schematic";

import { FeatureIcon } from "./feature-icon";

export interface MeteredFeaturesProps {
  billing: Billing;
}

function usageLine(feature: FeatureUsageResponseData, period: string): string {
  const unit = (count: number) =>
    pluralize(
      feature.feature?.singularName ?? feature.feature?.name ?? "unit",
      count,
    ).toLowerCase();
  const usage = feature.usage ?? 0;
  const limit = feature.allocation ?? feature.softLimit ?? feature.effectiveLimit;

  switch (feature.priceBehavior) {
    case EntitlementPriceBehavior.Tier:
      return typeof limit === "number"
        ? `Up to ${formatNumber(limit)} ${unit(limit)} in this tier`
        : "Unlimited in this tier";
    case EntitlementPriceBehavior.Overage:
      return typeof feature.softLimit === "number"
        ? `${formatNumber(feature.softLimit)} ${unit(feature.softLimit)} included`
        : `${formatNumber(usage)} ${unit(usage)} used`;
    case EntitlementPriceBehavior.PayInAdvance:
      return `${formatNumber(usage)} of ${formatNumber(feature.allocation ?? 0)} ${unit(feature.allocation ?? 0)} used`;
    case EntitlementPriceBehavior.PayAsYouGo: {
      const cost = getEntitlementCost(feature, period);
      const currency = getEntitlementPrice(feature, period)?.currency;
      return cost !== undefined
        ? `${formatNumber(usage)} ${unit(usage)} used (${formatCurrency(cost, currency)})`
        : `${formatNumber(usage)} ${unit(usage)} used`;
    }
    case EntitlementPriceBehavior.CreditBurndown: {
      if (typeof feature.creditConsumptionRate === "number") {
        return `${formatNumber(feature.creditConsumptionRate)} ${pluralize("credit", feature.creditConsumptionRate)} per use`;
      }
      return typeof feature.creditRemaining === "number"
        ? `${formatNumber(feature.creditRemaining)} ${pluralize("credit", feature.creditRemaining ?? 0)} remaining`
        : `${formatNumber(usage)} ${unit(usage)} used`;
    }
    default:
      if (feature.isUnlimited || feature.allocationType === "unlimited") {
        return "No limit";
      }
      return typeof limit === "number"
        ? `${formatNumber(usage)} of ${formatNumber(limit)} ${unit(limit)} used`
        : `${formatNumber(usage)} ${unit(usage)} used`;
  }
}

function priceDetails(feature: FeatureUsageResponseData, period: string): string | undefined {
  if (
    feature.priceBehavior !== EntitlementPriceBehavior.Overage &&
    feature.priceBehavior !== EntitlementPriceBehavior.Tier
  ) {
    return undefined;
  }
  const price = getEntitlementPrice(feature, period);
  if (!price) {
    return undefined;
  }
  const unit = (feature.feature?.singularName ?? feature.feature?.name ?? "unit").toLowerCase();
  const label = `${formatCurrency(price.price, price.currency)} per ${unit}`;
  if (feature.priceBehavior === EntitlementPriceBehavior.Overage) {
    return `Then ${label}`;
  }
  const cost = getEntitlementCost(feature, period);
  return cost !== undefined ? `${label} · ${formatCurrency(cost, price.currency)} so far` : label;
}

/**
 * Usage against metered (event/trait) entitlements. Credit *grants* live in
 * CreditUsage; credit-burndown entitlements stay here because they are
 * features that consume those grants.
 */
export function MeteredFeatures({ billing }: MeteredFeaturesProps) {
  const period =
    getSubscriptionPeriod(billing.subscription) ?? billing.company?.plan?.planPeriod ?? "month";
  const metered = billing.features.filter(
    (feature) =>
      feature.feature?.featureType === FeatureType.Event ||
      feature.feature?.featureType === FeatureType.Trait,
  );

  if (metered.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
          Metered features
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {metered.map((feature) => {
          const usage = feature.usage ?? 0;
          const limit = feature.allocation ?? feature.softLimit ?? feature.effectiveLimit;
          const showMeter =
            feature.priceBehavior !== EntitlementPriceBehavior.PayAsYouGo &&
            feature.priceBehavior !== EntitlementPriceBehavior.CreditBurndown &&
            typeof limit === "number" &&
            limit > 0;
          const details = priceDetails(feature, period);

          return (
            <div key={feature.entitlementId} className="flex items-start gap-3">
              <FeatureIcon icon={feature.feature?.icon} />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{feature.feature?.name}</p>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">
                    {usageLine(feature, period)}
                  </p>
                </div>
                {showMeter && (
                  <Progress
                    value={Math.min(100, (usage / (limit as number)) * 100)}
                    aria-label={`${feature.feature?.name} usage`}
                  />
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{details}</span>
                  {feature.metricResetAt && <span>Resets {formatDate(feature.metricResetAt)}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
