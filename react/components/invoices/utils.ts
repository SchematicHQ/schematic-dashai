import {
  InvoiceStatus,
  type InvoiceResponseData,
} from "@/components/api/checkoutexternal";
import { formatCurrency, toPrettyDate } from "@/components/utils";

const EXCLUDED_STATUSES: InvoiceStatus[] = [
  InvoiceStatus.Void,
  InvoiceStatus.Draft,
  InvoiceStatus.Uncollectible,
];

export interface FormattedInvoice {
  id: string;
  amount: string;
  amountDue: number;
  date: string;
  url?: string;
}

interface FormatInvoicesOptions {
  hideUpcoming?: boolean;
}

export function formatInvoices(
  invoices: InvoiceResponseData[] = [],
  { hideUpcoming = true }: FormatInvoicesOptions = {},
): FormattedInvoice[] {
  const now = new Date();

  return invoices
    .filter(({ amountDue, dueDate, externalId, status }) => {
      if (amountDue === 0) {
        return false;
      }

      if (externalId?.startsWith("upcoming_")) {
        return false;
      }

      if (status && EXCLUDED_STATUSES.includes(status)) {
        return false;
      }

      // an unpaid invoice is only history once it has actually come due
      if (
        hideUpcoming &&
        status !== InvoiceStatus.Paid &&
        !(dueDate && +dueDate <= +now)
      ) {
        return false;
      }

      return true;
    })
    .sort((a, b) => +(b.dueDate ?? b.createdAt) - +(a.dueDate ?? a.createdAt))
    .map(({ id, amountDue, createdAt, currency, dueDate, url }) => {
      const formatted = formatCurrency(Math.abs(amountDue), currency);

      return {
        id,
        // credits read as parentheses rather than a minus sign.
        amount: amountDue < 0 ? `(${formatted})` : formatted,
        amountDue,
        date: toPrettyDate(dueDate ?? createdAt),
        url: url || undefined,
      };
    });
}
