import {
  EntitlementPriceBehavior,
  type BillingProductPriceTierResponseData,
  type CompanySubscriptionResponseData,
  type FeatureUsageResponseData,
} from "./api/checkoutexternal";

/**
 * Structural price shape shared by BillingPriceResponseData and
 * BillingPriceView (the generated models differ only in extra fields).
 */
export interface PriceData {
  price: number;
  priceDecimal?: string | null;
  currency: string;
  interval?: string;
  priceTier?: BillingProductPriceTierResponseData[];
  tiersMode?: string | null;
  packageSize?: number;
}

/** Structural plan shape shared by CatalogPlan and PlanDetailResponseData. */
export interface PricedPlan {
  chargeType?: string;
  monthlyPrice?: PriceData;
  quarterlyPrice?: PriceData;
  yearlyPrice?: PriceData;
  oneTimePrice?: PriceData;
}

/**
 * Resolves a display period from an interval + interval_count pair. Quarterly
 * prices are stored as interval="month" with interval_count=3, so they must be
 * detected here rather than inferred from `interval` alone.
 */
export function derivePeriod(
  interval?: string | null,
  intervalCount?: number | null,
): string | undefined {
  if (!interval) {
    return undefined;
  }
  if (interval === "month" && intervalCount === 3) {
    return "quarter";
  }
  return interval;
}

/**
 * The effective period of the current subscription, preferring the recurring
 * products' interval + interval_count (so quarterly is surfaced even when the
 * legacy `interval` field reports "month").
 */
export function getSubscriptionPeriod(
  subscription?: CompanySubscriptionResponseData | null,
): string | undefined {
  if (!subscription) {
    return undefined;
  }
  const product = subscription.products.find(
    (p) => p.interval && p.interval !== "one-time",
  );
  return (
    derivePeriod(product?.interval, product?.intervalCount) ??
    derivePeriod(subscription.interval)
  );
}

/** Prefers the lossless decimal representation when the API provides one. */
export function getPriceValue(price: PriceData): number {
  return typeof price.priceDecimal === "string" ? Number(price.priceDecimal) : price.price;
}

function selectPriceForPeriod<T extends PricedPlan>(
  source: T,
  period: string,
): PriceData | undefined {
  switch (period) {
    case "year":
      return source.yearlyPrice;
    case "quarter":
      return source.quarterlyPrice;
    default:
      return source.monthlyPrice;
  }
}

export function getPlanPrice(plan: PricedPlan, period = "month"): PriceData | undefined {
  const price = selectPriceForPeriod(plan, period);
  if (price) {
    return { ...price, price: getPriceValue(price) };
  }
}

export function getAddOnPrice(addOn: PricedPlan, period = "month"): PriceData | undefined {
  const price =
    addOn.chargeType === "one_time" ? addOn.oneTimePrice : selectPriceForPeriod(addOn, period);
  if (price) {
    return { ...price, price: getPriceValue(price) };
  }
}

/**
 * The usage-based price attached to a feature-usage entitlement for the given
 * period. For overage pricing, the last price tier carries the per-unit
 * overage cost.
 */
export function getEntitlementPrice(
  entitlement: FeatureUsageResponseData,
  period = "month",
): PriceData | undefined {
  const source = selectPriceForPeriod(
    {
      monthlyPrice: entitlement.monthlyUsageBasedPrice,
      quarterlyPrice: entitlement.quarterlyUsageBasedPrice,
      yearlyPrice: entitlement.yearlyUsageBasedPrice,
    },
    period,
  );
  if (!source) {
    return undefined;
  }

  const price: PriceData = { ...source };
  if (
    entitlement.priceBehavior === EntitlementPriceBehavior.Overage &&
    price.priceTier?.length
  ) {
    const overageTier = price.priceTier[price.priceTier.length - 1];
    if (typeof overageTier.perUnitPrice === "number") {
      price.price = overageTier.perUnitPrice;
    }
    // Realign priceDecimal with the overage tier so getPriceValue does not
    // return the parent tiered price's stale decimal (typically "0").
    price.priceDecimal =
      typeof overageTier.perUnitPriceDecimal === "string"
        ? overageTier.perUnitPriceDecimal
        : null;
  }

  return { ...price, price: getPriceValue(price) };
}

export function isTieredPrice(price?: PriceData): boolean {
  if (!price) {
    return false;
  }
  return (price.priceTier?.length ?? 0) > 1 || !!price.tiersMode;
}

export function calculateTieredCost(
  quantity: number,
  priceTiers: BillingProductPriceTierResponseData[],
  tiersMode?: string | null,
): number {
  let cost = 0;

  if (tiersMode === "volume") {
    let start = 0;
    const currentTier = priceTiers.find((tier) => {
      const end = tier.upTo ?? Infinity;
      const isCurrentTier = quantity >= start && quantity <= end;
      start = end + 1;
      return isCurrentTier;
    });

    if (quantity > 0) {
      const flatAmount = currentTier?.flatAmount ?? 0;
      const perUnitPrice =
        typeof currentTier?.perUnitPriceDecimal === "string"
          ? Number(currentTier.perUnitPriceDecimal)
          : (currentTier?.perUnitPrice ?? 0);
      cost += quantity * perUnitPrice + flatAmount;
    }
  } else {
    // graduated (the default): each tier charges for its own span
    let acc = 0;
    for (const tier of priceTiers) {
      const upTo = tier.upTo ?? Infinity;
      const flatAmount = tier.flatAmount ?? 0;
      const perUnitPrice =
        typeof tier.perUnitPriceDecimal === "string"
          ? Number(tier.perUnitPriceDecimal)
          : (tier.perUnitPrice ?? 0);

      if (acc < quantity) {
        const tierAmount = Math.min(upTo, quantity) - acc;
        cost += flatAmount;
        cost += tierAmount * perUnitPrice;
        acc += tierAmount;
      }
    }
  }

  return cost;
}

/** The current cost of a usage-based entitlement, by price behavior. */
export function getEntitlementCost(
  entitlement: FeatureUsageResponseData,
  period: string | null = "month",
): number | undefined {
  const resolvedPeriod = period ?? "month";
  const price = getEntitlementPrice(entitlement, resolvedPeriod);
  if (!price) {
    return undefined;
  }

  switch (entitlement.priceBehavior) {
    case EntitlementPriceBehavior.PayInAdvance: {
      if (typeof entitlement.allocation === "number" && entitlement.allocation > 0) {
        if (isTieredPrice(price) && price.priceTier) {
          return calculateTieredCost(entitlement.allocation, price.priceTier, price.tiersMode);
        }
        return entitlement.allocation * price.price;
      }
      return undefined;
    }
    case EntitlementPriceBehavior.PayAsYouGo: {
      if (typeof entitlement.usage === "number" && entitlement.usage > 0) {
        return entitlement.usage * price.price;
      }
      return undefined;
    }
    case EntitlementPriceBehavior.Overage: {
      if (typeof entitlement.usage !== "number" || entitlement.usage <= 0) {
        return undefined;
      }
      const overageTier = price.priceTier?.[price.priceTier.length - 1];
      if (!overageTier) {
        return undefined;
      }
      let cost = overageTier.flatAmount ?? 0;
      if (overageTier.perUnitPrice) {
        const amount = Math.max(0, entitlement.usage - (entitlement.softLimit ?? 0));
        cost += amount * overageTier.perUnitPrice;
      }
      return cost;
    }
    case EntitlementPriceBehavior.Tier: {
      if (typeof entitlement.usage === "number" && price.priceTier) {
        return calculateTieredCost(entitlement.usage, price.priceTier, price.tiersMode);
      }
      return undefined;
    }
    default:
      return undefined;
  }
}
