import * as React from "react";

import { FeatureIcon } from "@/components/ui/feature-icon";
import { Progress } from "@/components/ui/progress";

export interface UsageMeterProps {
  icon?: string | null;
  name: string;
  /** Right-aligned summary of the usage. */
  summary: React.ReactNode;
  description?: string | null;
  used?: number;
  /**
   * Total the usage is measured against. The bar renders only when this is a
   * number, so callers suppress it by leaving it undefined.
   */
  limit?: number;
  /** Extra rows beneath the bar: price details, reset dates, expandable grants. */
  children?: React.ReactNode;
}

/**
 * One feature's usage: icon, name, summary, and an optional progress bar.
 */
export function UsageMeter({
  icon,
  name,
  summary,
  description,
  used = 0,
  limit,
  children,
}: UsageMeterProps) {
  return (
    <div className="flex items-start gap-3">
      <FeatureIcon icon={icon} />

      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {summary}
          </p>
        </div>

        {description && (
          <p className="truncate text-xs text-muted-foreground">
            {description}
          </p>
        )}

        {typeof limit === "number" && (
          <Progress
            value={limit > 0 ? Math.min(100, (used / limit) * 100) : 0}
            aria-label={`${name} usage`}
          />
        )}

        {children}
      </div>
    </div>
  );
}
