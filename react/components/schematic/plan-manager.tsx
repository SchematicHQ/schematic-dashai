"use client";

import { AlertTriangle, ArrowDownRight, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getEntitlementPrice,
  getPlanManagerNotice,
  getSubscriptionPeriod,
  formatCurrency,
  formatDate,
  periodSuffix,
  type Billing,
} from "@/lib/schematic";

export interface PlanManagerProps {
  billing: Billing;
  /** Wire this up when checkout ships; omitted → disabled "coming soon" button. */
  onChangePlan?: () => void;
}

/**
 * Current plan summary: notice banner (trial / cancellation / scheduled
 * downgrade), plan name + price, active add-ons, usage-based entitlement
 * prices, and the change-plan action.
 */
export function PlanManager({ billing, onChangePlan }: PlanManagerProps) {
  const {
    company,
    subscription,
    scheduledDowngrade,
    displaySettings,
    features,
  } = billing;
  const plan = company?.plan;
  const addOns = company?.addOns ?? [];
  if (!plan && addOns.length === 0) {
    return null;
  }

  const notice = getPlanManagerNotice(subscription, scheduledDowngrade);
  const period =
    getSubscriptionPeriod(subscription) || plan?.planPeriod || "month";
  const usageBasedEntitlements = features.filter(
    (feature) => typeof feature.priceBehavior === "string",
  );

  const planPrice = plan?.planPrice ?? 0;
  const isFreePlan = planPrice === 0;
  const priceLabel =
    isFreePlan && usageBasedEntitlements.length > 0
      ? "Usage-based"
      : isFreePlan && displaySettings.showZeroPriceAsFree
        ? "Free"
        : `${formatCurrency(planPrice, subscription?.currency)}${periodSuffix(period)}`;

  return (
    <Card>
      <CardContent className="space-y-6">
        {notice && (
          <div className="flex items-center gap-2 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm">
            {notice.kind === "trial" && (
              <>
                <Clock className="size-4 shrink-0 text-accent" aria-hidden />
                <span>
                  Your trial ends in {notice.daysLeft}{" "}
                  {notice.daysLeft === 1 ? "day" : "days"} on{" "}
                  {formatDate(notice.trialEnd)}.
                </span>
              </>
            )}
            {notice.kind === "canceled" && (
              <>
                <AlertTriangle
                  className="size-4 shrink-0 text-destructive"
                  aria-hidden
                />
                <span>
                  Your subscription ends on {formatDate(notice.cancelAt)}.
                </span>
              </>
            )}
            {notice.kind === "downgrade" && (
              <>
                <ArrowDownRight
                  className="size-4 shrink-0 text-accent"
                  aria-hidden
                />
                <span>
                  Your plan changes to {notice.toPlanName} on{" "}
                  {formatDate(notice.effectiveAfter)}.
                </span>
              </>
            )}
          </div>
        )}

        {plan && (
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Current plan
              </p>
              <h2 className="text-2xl font-bold">{plan.name}</h2>
              {plan.description && (
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              )}
            </div>
            <p className="text-xl font-semibold whitespace-nowrap">
              {priceLabel}
            </p>
          </div>
        )}

        {addOns.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Add-ons
            </p>
            {addOns.map((addOn) => (
              <div
                key={addOn.id}
                className="flex items-center justify-between text-sm"
              >
                <span>{addOn.name}</span>
                <span className="text-muted-foreground">
                  {typeof addOn.planPrice === "number"
                    ? `${formatCurrency(addOn.planPrice, subscription?.currency)}${periodSuffix(addOn.planPeriod)}`
                    : null}
                </span>
              </div>
            ))}
          </div>
        )}

        {usageBasedEntitlements.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Usage-based
            </p>
            {usageBasedEntitlements.map((entitlement) => {
              const price = getEntitlementPrice(entitlement, period);
              const unit =
                entitlement.feature?.singularName ||
                entitlement.feature?.name ||
                "unit";
              return (
                <div
                  key={entitlement.entitlementId}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{entitlement.feature?.name}</span>
                  {price && (
                    <span className="text-muted-foreground">
                      {formatCurrency(price.price, price.currency)} per{" "}
                      {unit.toLowerCase()}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Button
          className="w-full"
          onClick={onChangePlan}
          disabled={!onChangePlan}
          title={onChangePlan ? undefined : "Checkout is coming soon"}
        >
          Change plan
        </Button>
      </CardContent>
    </Card>
  );
}
