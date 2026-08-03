import type { CompanyPlanWithBillingSubView } from "@/components/api/checkoutexternal";

import { formatCurrency, shortenPeriod } from "@/components/utils";
import { Row } from "./layout";

interface AddOnProps {
  addOn: CompanyPlanWithBillingSubView;
  currency?: string;
  period?: string;
}

export function AddOn({ addOn, currency, period }: AddOnProps) {
  // a one-time add-on keeps its own period; everything else follows the
  // subscription
  const resolvedPeriod =
    addOn.planPeriod === "one-time"
      ? addOn.planPeriod
      : (period ?? addOn.planPeriod);
  const periodLabel = resolvedPeriod
    ? shortenPeriod(resolvedPeriod)
    : undefined;

  return (
    <Row label={addOn.name}>
      {typeof addOn.planPrice === "number" && resolvedPeriod && (
        <span>
          {formatCurrency(addOn.planPrice, currency)}
          {periodLabel && (
            <sub className="text-muted-foreground">/{periodLabel}</sub>
          )}
        </span>
      )}
    </Row>
  );
}
