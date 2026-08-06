"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BillingCreditGrantReason,
  type CreditCompanyGrantView,
  type CustomerSubscription,
  helpers,
} from "@schematichq/schematic-react";

import { FeatureIcon } from "./feature-icon";

const { formatDate, formatNumber, groupCreditGrants, pluralize } = helpers;

export interface CreditUsageProps {
  billing: CustomerSubscription;
  /** Wire this up when checkout ships; omitted → no buy-more button. */
  onBuyMore?: (creditId: string) => void;
}

function grantLabel(grant: CreditCompanyGrantView): string {
  const unit = pluralize(
    grant.singularName || grant.creditName,
    grant.quantity,
  ).toLowerCase();
  const amount = `${formatNumber(grant.quantity)} ${unit}`;
  switch (grant.grantReason) {
    case BillingCreditGrantReason.Plan:
      return `${amount} included in plan`;
    case BillingCreditGrantReason.Purchased:
      return `${amount} bundle`;
    case BillingCreditGrantReason.BillingCreditAutoTopup:
      return `${amount} auto top-up`;
    default:
      return `${amount} grant`;
  }
}

/**
 * Credit balances grouped per credit type, with the individual grants behind
 * an expander. The split counterpart of MeteredFeatures: grants live here,
 * credit-burndown *entitlements* stay there.
 */
export function CreditUsage({ billing, onBuyMore }: CreditUsageProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const showCredits = billing.displaySettings.showCredits;
  const groups = groupCreditGrants(billing.creditGrants);

  if (!showCredits || groups.length === 0) {
    return null;
  }

  const toggle = (creditId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(creditId)) {
        next.delete(creditId);
      } else {
        next.add(creditId);
      }
      return next;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
          Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {groups.map((group) => {
          const isExpanded = expandedIds.has(group.creditId);
          return (
            <div key={group.creditId} className="space-y-2">
              <div className="flex items-start gap-3">
                <FeatureIcon icon={group.icon} />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{group.name}</p>
                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatNumber(group.total.used)} of{" "}
                      {formatNumber(group.total.value)} used
                    </p>
                  </div>
                  {group.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {group.description}
                    </p>
                  )}
                  <Progress
                    value={
                      group.total.value > 0
                        ? Math.min(
                            100,
                            (group.total.used / group.total.value) * 100,
                          )
                        : 0
                    }
                    aria-label={`${group.name} usage`}
                  />
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      onClick={() => toggle(group.creditId)}
                      aria-expanded={isExpanded}
                    >
                      {group.grants.length}{" "}
                      {pluralize("grant", group.grants.length)}
                      <ChevronDown
                        className={`size-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </Button>
                    {onBuyMore && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => onBuyMore(group.creditId)}
                      >
                        Buy more
                      </Button>
                    )}
                  </div>
                  {isExpanded && (
                    <ul className="space-y-1 border-l border-border pl-3 text-xs text-muted-foreground">
                      {group.grants.map((grant) => (
                        <li
                          key={grant.id}
                          className="flex items-center justify-between gap-2"
                        >
                          <span>{grantLabel(grant)}</span>
                          <span className="whitespace-nowrap">
                            {grant.grantReason ===
                              BillingCreditGrantReason.Plan &&
                            grant.renewalEnabled
                              ? grant.expiresAt
                                ? `Resets ${formatDate(grant.expiresAt)}`
                                : null
                              : grant.expiresAt
                                ? `Expires ${formatDate(grant.expiresAt)}`
                                : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
