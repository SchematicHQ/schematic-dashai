"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deriveInvoiceList,
  plural,
  useResolvedLocale,
} from "@schematichq/schematic-components/elements";

const LIMIT = 10;

const STATUS_TONE = {
  paid: "border-green-700/30 bg-green-700/10 text-green-700 dark:text-green-400",
  open: "border-amber-600/30 bg-amber-600/15 text-amber-700 dark:text-amber-400",
  uncollectible: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function Invoices({ page, onLoadMore, loadingMore, error }) {
  const locale = useResolvedLocale();
  const [expanded, setExpanded] = useState(false);
  const list = deriveInvoiceList(page, { locale });
  const canCollapse = list.rows.length > LIMIT;
  const showingAll = !canCollapse || expanded;
  const rows = showingAll ? list.rows : list.rows.slice(0, LIMIT);
  const noun = plural(locale, list.count, {
    one: "invoice",
    other: "invoices",
  });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <CardTitle className="text-[0.8125rem] font-semibold tracking-wider text-muted-foreground uppercase">
          Invoices
        </CardTitle>
        {rows.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {rows.length < list.count
              ? `${rows.length} of ${list.count} ${noun}`
              : `${list.count} ${noun}`}
          </span>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No invoices created yet
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                // The date link stretches over the row, so the whole line opens it.
                <TableRow
                  key={row.id}
                  className={
                    row.url === null
                      ? undefined
                      : "group relative cursor-pointer has-[a:focus-visible]:bg-muted/50"
                  }
                >
                  <TableCell>
                    {row.url === null ? (
                      <span>{row.dateText}</span>
                    ) : (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        className="outline-none transition-colors group-hover:text-primary after:absolute after:inset-0 after:content-['']"
                      >
                        {row.dateText || "View invoice"}
                      </a>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {row.isCredit ? (
                      <span
                        className="cursor-help text-muted-foreground"
                        title="Credit applied to your account"
                      >
                        ({row.amountText})
                      </span>
                    ) : (
                      row.amountText
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {row.status !== null && (
                      <Badge
                        variant="outline"
                        className={`rounded-full capitalize ${STATUS_TONE[row.status] ?? "text-muted-foreground"}`}
                      >
                        {row.status}
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {(canCollapse || (showingAll && list.hasMore)) && (
          <div className="flex items-center gap-3">
            {canCollapse && (
              <Button
                variant="outline"
                size="sm"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? "See less" : "See more"}
              </Button>
            )}
            {showingAll && list.hasMore && (
              <Button
                variant="outline"
                size="sm"
                disabled={loadingMore}
                onClick={() => {
                  setExpanded(true);
                  onLoadMore();
                }}
              >
                Load more
              </Button>
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            There was a problem retrieving your invoices.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
