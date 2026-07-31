import { Fragment, type ReactNode } from "react";

import {
  EntitlementPriceBehavior,
  EntitlementValueType,
  FeatureType,
  type FeatureUsageResponseData,
} from "@/components/api/checkoutexternal";
import {
  entitlementHasHardLimit,
  formatConsumptionRate,
  formatCurrency,
  getEntitlementPrice,
  getFeatureName,
  getUsageDetails,
  shortenPeriod,
} from "@/components/utils";

interface UsageDetailsProps {
  entitlement: FeatureUsageResponseData;
  period: string;
  currency?: string;
  showCredits: boolean;
  showHardLimit: boolean;
}

export function UsageDetails({
  entitlement,
  period,
  currency,
  showCredits,
  showHardLimit,
}: UsageDetailsProps) {
  const { feature, priceBehavior } = entitlement;

  if (
    (priceBehavior === EntitlementPriceBehavior.CreditBurndown &&
      !showCredits) ||
    !feature?.name
  ) {
    return null;
  }

  const { billingPrice, limit, cost = 0 } = getUsageDetails(
    entitlement,
    period,
    currency,
  );
  const { price } = getEntitlementPrice(entitlement, period, currency) || {};
  const packageSize = billingPrice?.packageSize ?? 1;

  // a credit burndown entitlement is described by its consumption rate rather
  // than by an allowance
  const quantity =
    priceBehavior !== EntitlementPriceBehavior.CreditBurndown
      ? limit
      : undefined;

  const description: ReactNode[] = [];

  if (priceBehavior === EntitlementPriceBehavior.Overage) {
    description.push(<Fragment key="overage">Additional: </Fragment>);
  }

  if (priceBehavior === EntitlementPriceBehavior.Tier) {
    description.push(<Fragment key="tier">Tier-based</Fragment>);
  }

  if (
    (priceBehavior === EntitlementPriceBehavior.PayAsYouGo ||
      priceBehavior === EntitlementPriceBehavior.Overage) &&
    typeof price === "number"
  ) {
    description.push(
      <Fragment key="price">
        {formatCurrency(price, billingPrice?.currency)}
        <sub>
          /{packageSize > 1 && <>{packageSize} </>}
          {getFeatureName(feature, packageSize)}
          {feature.featureType === FeatureType.Trait && (
            <>/{shortenPeriod(period)}</>
          )}
        </sub>
      </Fragment>,
    );
  }

  if (
    showCredits &&
    priceBehavior === EntitlementPriceBehavior.CreditBurndown &&
    entitlement.planEntitlement?.consumptionRate &&
    entitlement.planEntitlement?.valueCredit
  ) {
    description.push(
      <Fragment key="consumption">
        {formatConsumptionRate(entitlement.planEntitlement.consumptionRate)}{" "}
        {getFeatureName(
          entitlement.planEntitlement.valueCredit,
          entitlement.planEntitlement.consumptionRate,
        )}{" "}
        per use
      </Fragment>,
    );
  }

  return (
    <div className="flex justify-between items-center flex-wrap gap-2">
      <span className="font-medium">
        {typeof quantity === "number" ? (
          <>
            {quantity} {getFeatureName(feature, quantity, true)}
          </>
        ) : (
          feature.name
        )}
      </span>

      <span>
        {description.length > 0 && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}

        {/* only pay-in-advance entitlements show a cost here; the other price
            behaviors carry their price in the description */}
        {priceBehavior === EntitlementPriceBehavior.PayInAdvance && (
          <>
            {" "}
            {formatCurrency(cost, billingPrice?.currency)}
            {feature.featureType === FeatureType.Trait && (
              <sub className="text-muted-foreground">
                /{shortenPeriod(period)}
              </sub>
            )}
          </>
        )}

        {showHardLimit &&
          entitlementHasHardLimit(entitlement) &&
          entitlement.allocationType === EntitlementValueType.Numeric &&
          typeof entitlement.allocation === "number" && (
            <span className="text-sm text-muted-foreground">
              {" "}
              (up to {entitlement.allocation}{" "}
              {getFeatureName(feature, entitlement.allocation)})
            </span>
          )}
      </span>
    </div>
  );
}
