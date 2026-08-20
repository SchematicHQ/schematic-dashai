"use client";

import {
  type CompanySubscriptionResponseData,
  type InvoiceResponseData,
} from "@schematichq/schematic-react";

import {
  deriveAppliedBalance,
  formatCurrency,
  formatDate,
} from "@/lib/schematic/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface UpcomingBillProps {
  upcomingInvoice?: InvoiceResponseData;
  subscription?: CompanySubscriptionResponseData;
}

/**
 * The next invoice: amount, due date, active discounts, and any customer
 * balance applied. Hidden entirely when there is no subscription or the
 * subscription is winding down.
 */
export function UpcomingBill({
  upcomingInvoice,
  subscription,
}: UpcomingBillProps) {
  if (!upcomingInvoice || !subscription || subscription.cancelAt) {
    return null;
  }

  const discounts = subscription.discounts.filter(
    (discount) =>
      discount.isActive && (discount.percentOff || discount.amountOff),
  );
  const balance = deriveAppliedBalance(upcomingInvoice);
  const currency = upcomingInvoice.currency;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Next bill due{" "}
          {formatDate(upcomingInvoice.dueDate ?? upcomingInvoice.createdAt)}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-3xl font-bold">
          {formatCurrency(upcomingInvoice.amountDue, currency)}
        </p>

        {discounts.length > 0 && (
          <div className="space-y-1">
            {discounts.map((discount) => (
              <div
                key={discount.discountExternalId}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {discount.couponName ||
                    discount.customerFacingCode ||
                    "Discount"}
                </span>
                <span className="text-accent">
                  {discount.percentOff
                    ? `−${discount.percentOff}%`
                    : `−${formatCurrency(discount.amountOff ?? 0, discount.currency || currency)}`}
                </span>
              </div>
            ))}
          </div>
        )}

        {balance && balance.applied > 0 && (
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Applied balance towards next invoice
              </span>
              <span>{formatCurrency(-balance.applied, currency)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Remaining balance after next invoice
              </span>
              <span>{formatCurrency(balance.remaining, currency)}</span>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          This is an estimate; usage-based charges are finalized at the end of
          the billing period.
        </p>
      </CardContent>
    </Card>
  );
}
