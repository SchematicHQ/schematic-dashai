"use client";

import { useState } from "react";
import type { PaymentMethodResponseData } from "@/components/api/checkoutexternal";

import { getMonthsToExpiration } from "./utils";
import { PaymentDialog } from "./PaymentDialog";
import { PaymentMethodSummary } from "./PaymentMethodSummary";

interface PaymentMethodProps {
  paymentMethod?: PaymentMethodResponseData;
  paymentMethods?: PaymentMethodResponseData[];
}

export function PaymentMethod({
  paymentMethod,
  paymentMethods = [],
}: PaymentMethodProps) {
  const [isEditing, setIsEditing] = useState(false);

  const monthsToExpiration =
    paymentMethod && getMonthsToExpiration(paymentMethod);
  const otherMethods = paymentMethods.filter(
    (method) => method.id !== paymentMethod?.id,
  );

  return (
    <div className="flex flex-col gap-4 text-white border border-border bg-card rounded-xl p-6 shadow-2xl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Payment Details</h2>

        {typeof monthsToExpiration === "number" && monthsToExpiration < 4 && (
          <span className="text-sm text-red-400">
            {monthsToExpiration > 0
              ? `Expires in ${monthsToExpiration} month${monthsToExpiration === 1 ? "" : "s"}`
              : "Expired"}
          </span>
        )}
      </div>

      <div className="flex justify-between items-center gap-4 rounded-full bg-border px-6 py-3">
        <PaymentMethodSummary paymentMethod={paymentMethod} />

        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="font-medium leading-none text-accent transition-all hover:underline"
        >
          {paymentMethod ? "Edit" : "Add"}
        </button>
      </div>

      <PaymentDialog
        open={isEditing}
        onClose={() => setIsEditing(false)}
        currentMethod={paymentMethod}
        otherMethods={otherMethods}
      />
    </div>
  );
}
