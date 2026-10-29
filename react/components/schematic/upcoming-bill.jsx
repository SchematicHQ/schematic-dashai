"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  deriveUpcomingInvoice,
  useResolvedLocale,
} from "@schematichq/schematic-components/elements";

export function UpcomingBill({ invoice, error }) {
  const locale = useResolvedLocale();
  const bill =
    invoice === null ? null : deriveUpcomingInvoice(invoice, { locale });
  const hasRows =
    bill !== null &&
    (bill.balanceApplied !== null ||
      bill.balanceRemaining !== null ||
      bill.discounts.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[0.8125rem] font-semibold tracking-wider text-muted-foreground uppercase">
          Next bill
        </CardTitle>
      </CardHeader>
      <CardContent>
        {bill === null ? (
          <p className="text-sm text-muted-foreground">No upcoming invoice</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-4xl leading-none font-extrabold tabular-nums">
                  {bill.amountDueText}
                </p>
                <p className="text-sm text-muted-foreground">Estimated bill</p>
              </div>
              {bill.dueAt !== null && (
                <p className="text-sm text-muted-foreground">
                  Due {bill.dueAt.text}
                </p>
              )}
            </div>

            {hasRows && (
              <div className="space-y-4 text-sm">
                {bill.balanceApplied !== null && (
                  <Row label="Applied balance towards next invoice">
                    {bill.balanceApplied.amountText}
                  </Row>
                )}
                {bill.balanceRemaining !== null && (
                  <Row label="Remaining balance after next invoice">
                    {bill.balanceRemaining.amountText}
                  </Row>
                )}
                {bill.discounts.length > 0 && (
                  <Row label="Discount">
                    <ul className="flex flex-col items-end gap-2">
                      {bill.discounts.map((discount, index) => (
                        <li
                          key={`${discount.couponName}-${index}`}
                          className="inline-flex items-start gap-2"
                        >
                          {discount.code !== null && (
                            <Badge
                              variant="secondary"
                              className="rounded-full uppercase"
                            >
                              {discount.code}
                            </Badge>
                          )}
                          {discountText(discount)}
                        </li>
                      ))}
                    </ul>
                  </Row>
                )}
              </div>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            There was a problem retrieving your upcoming invoice.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="font-medium">{label}</span>
      <span className="text-right tabular-nums">{children}</span>
    </div>
  );
}

function discountText({ valueText, months }) {
  if (months === null) return `${valueText} off`;
  return months === 1
    ? `${valueText} off for next month`
    : `${valueText} off for next ${months} months`;
}
