"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import type { InvoiceResponseData } from "@/components/api/checkoutexternal";
import { formatInvoices } from "./utils";

const DEFAULT_LIMIT = 2;

// Expanding shows more history, but not an unbounded amount of it.
const MAX_VISIBLE_INVOICE_COUNT = 12;

interface InvoicesProps {
  invoices?: InvoiceResponseData[];
  limit?: number;
}

export function Invoices({ invoices, limit = DEFAULT_LIMIT }: InvoicesProps) {
  const [visibleCount, setVisibleCount] = useState(limit);

  const formattedInvoices = formatInvoices(invoices);
  const isExpanded = visibleCount !== limit;
  const ChevronIcon = isExpanded ? ChevronUp : ChevronDown;

  return (
    <div className="flex flex-col gap-4 text-white border border-border bg-card rounded-xl p-6 shadow-2xl">
      <h2 className="text-2xl font-semibold">Invoices</h2>

      {formattedInvoices.length > 0 ? (
        <>
          <ul className="flex flex-col gap-2">
            {formattedInvoices
              .slice(0, visibleCount)
              .map(({ id, amount, amountDue, date, url }) => (
                <li
                  key={id}
                  className="flex justify-between items-center gap-4 leading-none"
                >
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-accent transition-all hover:underline"
                    >
                      {date}
                    </a>
                  ) : (
                    <span>{date}</span>
                  )}

                  <span
                    title={
                      amountDue < 0
                        ? "Credit — this amount was returned to your account, typically due to a plan change or proration"
                        : "Charge — you were billed this amount"
                    }
                  >
                    {amount}
                  </span>
                </li>
              ))}
          </ul>

          {formattedInvoices.length > limit && (
            <button
              type="button"
              onClick={() =>
                setVisibleCount(isExpanded ? limit : MAX_VISIBLE_INVOICE_COUNT)
              }
              className="flex items-center gap-2 self-start font-medium leading-none text-accent transition-all hover:underline"
            >
              <ChevronIcon className="h-4 w-4" aria-hidden />
              {isExpanded ? "See less" : "See more"}
            </button>
          )}
        </>
      ) : (
        <span className="leading-none text-muted-foreground">
          No invoices created yet
        </span>
      )}
    </div>
  );
}
