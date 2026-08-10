import * as React from "react";

import { FeatureIcon } from "@/components/ui/feature-icon";
import { Progress } from "@/components/ui/progress";

export interface UsageMeterProps {
  icon?: string | null;
  name: string;
  summary: React.ReactNode;
  description?: string | null;
  used?: number;
  limit?: number;
  children?: React.ReactNode;
}

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
