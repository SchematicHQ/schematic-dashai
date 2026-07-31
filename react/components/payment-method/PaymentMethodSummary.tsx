import type { PaymentMethodResponseData } from "@/components/api/checkoutexternal";

import { getPaymentMethodDisplay } from "./utils";

export function PaymentMethodSummary({
  paymentMethod,
}: {
  paymentMethod?: PaymentMethodResponseData;
}) {
  if (!paymentMethod) {
    return <span className="leading-none">No payment method added yet</span>;
  }

  const display = getPaymentMethodDisplay(paymentMethod);

  return (
    <span className="flex items-center gap-2 leading-none">
      <display.Icon className="h-5 w-5" aria-hidden />
      {display.label}
      {display.last4 && <span className="font-semibold">{display.last4}</span>}
    </span>
  );
}
