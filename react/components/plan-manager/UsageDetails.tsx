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
import { Row } from "./layout";

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

  const { limit, cost = 0 } = getUsageDetails(entitlement, period, currency);
  const billingPrice = getEntitlementPrice(entitlement, period, currency);
  const packageSize = billingPrice?.packageSize ?? 1;
  const { consumptionRate, valueCredit } = entitlement.planEntitlement ?? {};

  // traits are held over a period, so their price reads as a rate
  const perPeriod = feature.featureType === FeatureType.Trait && (
    <>/{shortenPeriod(period)}</>
  );

  const unitPrice = typeof billingPrice?.price === "number" && (
    <>
      {formatCurrency(billingPrice.price, billingPrice.currency)}
      <sub>
        /{packageSize > 1 && `${packageSize} `}
        {getFeatureName(feature, packageSize)}
        {perPeriod}
      </sub>
    </>
  );

  // every price behavior but pay-in-advance carries its price in the
  // description; pay-in-advance shows a cost after it instead
  const description =
    priceBehavior === EntitlementPriceBehavior.Overage ? (
      <>Additional: {unitPrice}</>
    ) : priceBehavior === EntitlementPriceBehavior.PayAsYouGo ? (
      unitPrice
    ) : priceBehavior === EntitlementPriceBehavior.Tier ? (
      "Tier-based"
    ) : priceBehavior === EntitlementPriceBehavior.CreditBurndown &&
      consumptionRate &&
      valueCredit ? (
      <>
        {formatConsumptionRate(consumptionRate)}{" "}
        {getFeatureName(valueCredit, consumptionRate)} per use
      </>
    ) : null;

  // a credit burndown entitlement is described by its consumption rate rather
  // than by an allowance
  const quantity =
    priceBehavior !== EntitlementPriceBehavior.CreditBurndown
      ? limit
      : undefined;

  return (
    <Row
      label={
        typeof quantity === "number" ? (
          <>
            {quantity} {getFeatureName(feature, quantity, true)}
          </>
        ) : (
          feature.name
        )
      }
    >
      <span>
        {description && (
          <span className="text-sm text-muted-foreground">{description}</span>
        )}

        {priceBehavior === EntitlementPriceBehavior.PayInAdvance && (
          <>
            {" "}
            {formatCurrency(cost, billingPrice?.currency)}
            {perPeriod && (
              <sub className="text-muted-foreground">{perPeriod}</sub>
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
    </Row>
  );
}
