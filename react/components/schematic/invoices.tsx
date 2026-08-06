"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  helpers,
  type InvoiceResponseData,
} from "@schematichq/schematic-react";

const { filterInvoicesForDisplay, formatCurrency, formatDate } = helpers;

export interface InvoicesProps {
  invoices: InvoiceResponseData[];
  /** Rows visible before expanding. */
  defaultVisible?: number;
  /** Rows visible after expanding. */
  maxVisible?: number;
}

/** Recent invoice history, filtered to what a customer actually cares about. */
export function Invoices({
  invoices,
  defaultVisible = 2,
  maxVisible = 12,
}: InvoicesProps) {
  const [expanded, setExpanded] = useState(false);
  const display = useMemo(() => filterInvoicesForDisplay(invoices), [invoices]);

  if (display.length === 0) {
    return null;
  }

  const visible = display.slice(0, expanded ? maxVisible : defaultVisible);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
          Invoices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visible.map((invoice) => {
          const row = (
            <div className="flex items-center justify-between py-1 text-sm">
              <span className="text-muted-foreground">
                {formatDate(invoice.dueDate ?? invoice.createdAt)}
              </span>
              <span className="flex items-center gap-1.5">
                {formatCurrency(invoice.amountDue, invoice.currency)}
                {invoice.url && (
                  <ExternalLink
                    className="size-3.5 text-muted-foreground"
                    aria-hidden
                  />
                )}
              </span>
            </div>
          );
          return invoice.url ? (
            <a
              key={invoice.id}
              href={invoice.url}
              target="_blank"
              rel="noreferrer"
              className="block rounded-sm hover:bg-secondary/50"
            >
              {row}
            </a>
          ) : (
            <div key={invoice.id}>{row}</div>
          );
        })}
        {display.length > defaultVisible && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded
              ? "Show fewer"
              : `See all (${Math.min(display.length, maxVisible)})`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
