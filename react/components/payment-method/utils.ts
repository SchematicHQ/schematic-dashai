import { CreditCard, Landmark, Link, Wallet } from "lucide-react";

import type { PaymentMethodResponseData } from "@/components/api/checkoutexternal";

export function getExpirationDate({
  cardExpMonth,
  cardExpYear,
}: PaymentMethodResponseData) {
  if (typeof cardExpMonth !== "number" || typeof cardExpYear !== "number") {
    return undefined;
  }

  return `${cardExpMonth}/${String(cardExpYear).slice(-2)}`;
}

export function getMonthsToExpiration({
  cardExpMonth,
  cardExpYear,
}: PaymentMethodResponseData) {
  if (typeof cardExpMonth !== "number" || typeof cardExpYear !== "number") {
    return undefined;
  }

  const now = new Date();
  return (
    (cardExpYear - now.getFullYear()) * 12 + (cardExpMonth - 1 - now.getMonth())
  );
}

interface PaymentMethodDisplay {
  Icon: typeof CreditCard;
  label: string;
  last4?: string | null;
}

export function getPaymentMethodDisplay({
  accountLast4,
  accountName,
  bankName,
  billingEmail,
  billingName,
  cardLast4,
  paymentMethodType,
}: PaymentMethodResponseData): PaymentMethodDisplay {
  switch (paymentMethodType) {
    case "card":
      return { Icon: CreditCard, label: "Card ending in", last4: cardLast4 };
    case "us_bank_account":
      return {
        Icon: Landmark,
        label: bankName || billingEmail || "Bank account",
        last4: accountLast4,
      };
    case "apple_pay":
      return {
        Icon: Wallet,
        label: cardLast4 ? "Apple Pay ending in" : "Apple Pay",
        last4: cardLast4,
      };
    case "google_pay":
      return {
        Icon: Wallet,
        label: cardLast4 ? "Google Pay ending in" : "Google Pay",
        last4: cardLast4,
      };
    case "paypal":
      return {
        Icon: Wallet,
        label: accountName || billingEmail || "PayPal account",
      };
    case "link":
      return {
        Icon: Link,
        label: billingEmail || accountName || "Link account",
      };
    default:
      return {
        Icon: CreditCard,
        label:
          billingName ||
          billingEmail ||
          accountName ||
          bankName ||
          "Payment method",
      };
  }
}
