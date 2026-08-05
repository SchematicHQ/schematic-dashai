"use client";

import { useState } from "react";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatDate,
  formatNumber,
  pluralize,
  type FeatureUsageResponseData,
} from "@/lib/schematic";

import { FeatureIcon } from "./feature-icon";

export interface IncludedFeaturesProps {
  features: FeatureUsageResponseData[];
  /** How many rows to show before the "See all" toggle. */
  collapseAfter?: number;
}

function usageSummary(feature: FeatureUsageResponseData): string | undefined {
  const name = feature.feature?.name ?? "";
  const unit = (count: number) =>
    pluralize(feature.feature?.singularName ?? name, count).toLowerCase();

  if (feature.isUnlimited || feature.allocationType === "unlimited") {
    return "No limit";
  }
  if (typeof feature.creditRemaining === "number" && feature.creditRemaining >= 0) {
    return `${formatNumber(feature.creditRemaining)} remaining`;
  }
  if (typeof feature.allocation === "number") {
    const used = typeof feature.usage === "number" ? feature.usage : 0;
    return `${formatNumber(used)} of ${formatNumber(feature.allocation)} ${unit(feature.allocation)} used`;
  }
  if (typeof feature.usage === "number") {
    return `${formatNumber(feature.usage)} ${unit(feature.usage)} used`;
  }
  return undefined;
}

/** Every feature the customer is entitled to, boolean and metered alike. */
export function IncludedFeatures({ features, collapseAfter = 4 }: IncludedFeaturesProps) {
  const [showAll, setShowAll] = useState(false);

  if (features.length === 0) {
    return null;
  }

  const visible = showAll ? features : features.slice(0, collapseAfter);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
          Included features
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {visible.map((feature) => {
          const summary = usageSummary(feature);
          return (
            <div key={feature.entitlementId} className="flex items-center gap-3">
              <FeatureIcon icon={feature.feature?.icon} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{feature.feature?.name}</p>
                {feature.feature?.description && (
                  <p className="truncate text-xs text-muted-foreground">
                    {feature.feature.description}
                  </p>
                )}
                {feature.entitlementExpirationDate && (
                  <p className="text-xs text-muted-foreground">
                    Expires {formatDate(feature.entitlementExpirationDate)}
                  </p>
                )}
              </div>
              <div className="text-right text-sm text-muted-foreground">
                {summary ?? <Check className="size-4 text-accent" aria-label="Included" />}
              </div>
            </div>
          );
        })}
        {features.length > collapseAfter && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? "Hide all" : `See all (${features.length})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
