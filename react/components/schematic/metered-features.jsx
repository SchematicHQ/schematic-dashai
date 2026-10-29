"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFeatureUserUsage } from "@schematichq/schematic-react";
import {
  deriveMeteredFeatures,
  featureName,
  formatNumber,
  useResolvedLocale,
} from "@schematichq/schematic-components/elements";

const SHORT = { month: "mo", quarter: "qtr", year: "yr" };
const short = (period) => SHORT[period] ?? period;

const FILL = {
  ok: "bg-primary",
  overage: "bg-primary",
  tier: "bg-primary",
  warning: "bg-amber-500",
  critical: "bg-destructive",
};

export function MeteredFeatures({ features, onAddMore }) {
  const locale = useResolvedLocale();
  const rows = deriveMeteredFeatures(features, { locale });
  if (rows.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[0.8125rem] font-semibold tracking-wider text-muted-foreground uppercase">
          Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="@container space-y-7">
          {rows.map((row) => {
            const limit = [
              row.limit === null ? null : limitText(row.limit),
              row.resetsAt === null ? null : `Resets ${row.resetsAt}`,
            ]
              .filter((part) => part !== null)
              .join(" • ");
            return (
              <li key={row.featureId} className="space-y-3">
                <div className="flex items-start justify-between gap-x-6 gap-y-1 @max-xs:flex-col">
                  <div className="flex min-w-0 grow gap-3">
                    <FeatureIcon name={row.icon} />
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-lg font-bold">{row.name}</p>
                      {row.description !== null && (
                        <p className="text-sm text-muted-foreground">
                          {row.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-0.5 text-right tabular-nums @max-xs:text-left">
                    {row.headline !== null && (
                      <p className="text-sm font-semibold">
                        {headlineText(row.headline)}
                      </p>
                    )}
                    {limit !== "" && (
                      <p className="text-xs text-muted-foreground">{limit}</p>
                    )}
                  </div>
                </div>
                {row.meter !== null && (
                  <div className="flex items-center gap-3">
                    <div
                      role="meter"
                      aria-label={`${row.name} usage`}
                      aria-valuemin={0}
                      aria-valuemax={row.meter.total}
                      aria-valuenow={row.meter.value}
                      className={
                        "h-2 grow overflow-hidden rounded-full " +
                        (row.meter.tone === "overage"
                          ? "bg-amber-500"
                          : "bg-muted")
                      }
                    >
                      <div
                        className={`h-full ${FILL[row.meter.tone]}`}
                        style={{ width: `${row.meter.percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium tabular-nums">
                      {row.meter.valueText}/{row.meter.totalText}
                    </span>
                  </div>
                )}
                <PriceLine details={row.priceDetails} />
                {row.canAddMore && onAddMore && (
                  <Button
                    onClick={() => onAddMore(row.source)}
                    variant="outline"
                    size="sm"
                  >
                    Add more
                  </Button>
                )}
                {row.hasUsageByUser && <FeatureTeamUsage row={row} />}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

function FeatureIcon({ name }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xl text-primary"
    >
      {name !== null && (
        <i className={`schematic-icon schematic-icon--${name} text-inherit!`} />
      )}
    </span>
  );
}

function PriceLine({ details }) {
  if (details === null) return null;
  const period = details.period === null ? "" : `/${short(details.period)}`;
  return (
    <div className="flex flex-wrap justify-between gap-x-4 rounded-lg bg-muted/50 px-3 py-2 text-sm tabular-nums">
      {details.kind === "overage" ? (
        <>
          <span>
            Additional: {details.unitPrice}/
            {details.packageSize !== null && `${details.packageSize} `}
            {details.units}
            {period}
          </span>
          <span>
            {details.overage.amount} {details.overage.units} ·{" "}
            {details.overage.cost}
            {period}
          </span>
        </>
      ) : (
        <>
          <span>
            Tier: {details.from}
            {details.to === null
              ? "+"
              : details.to !== details.from
                ? `–${details.to}`
                : ""}
          </span>
          {details.cost !== null && (
            <span>
              {details.cost}
              {period}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function FeatureTeamUsage({ row }) {
  const { data } = useFeatureUserUsage(row.featureId);
  if (data === undefined) return null;
  return (
    <TeamUsage
      count={data.count}
      total={data.total}
      unit={row.unit}
      users={data.users.map((user) => ({
        amount: user.usage,
        id: user.userId,
        label: user.name ?? user.userId,
      }))}
    />
  );
}

function TeamUsage({ count, total, unit, users }) {
  const locale = useResolvedLocale();
  const [expanded, setExpanded] = useState(false);
  if (users.length === 0) return null;

  const amount = (value) =>
    `${formatNumber(value, locale)} ${featureName(unit, value, locale)}`;
  const sorted = [...users].sort((a, b) => b.amount - a.amount);
  const shown = expanded ? sorted : sorted.slice(0, 3);

  return (
    <div className="space-y-2 rounded-xl bg-muted/50 p-4">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold">Usage by user</p>
        <p className="text-xs text-muted-foreground">
          {amount(total)} used by your team this period
        </p>
      </div>
      <ul className="space-y-1.5 text-sm">
        {shown.map((user) => (
          <li key={user.id} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[0.625rem] font-semibold"
            >
              {(user.label.trim()[0] ?? "?").toUpperCase()}
            </span>
            <span className="min-w-0 grow truncate">{user.label}</span>
            <span className="shrink-0 text-right whitespace-nowrap tabular-nums text-muted-foreground">
              {amount(user.amount)}
            </span>
          </li>
        ))}
      </ul>
      {sorted.length > 3 && (
        <Button
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          variant="link"
          className="h-auto p-0"
        >
          {expanded ? "Show fewer" : `Show all ${count} users`}
        </Button>
      )}
    </div>
  );
}

function headlineText(headline) {
  if (headline.kind === "used")
    return `${headline.amount} ${headline.units} used`;
  return headline.amount === null
    ? headline.units
    : `${headline.amount} ${headline.units}`;
}

function limitText(limit) {
  switch (limit.kind) {
    case "tierUpTo":
      return `Up to ${limit.amount} ${limit.feature} in this tier`;
    case "tierUnlimited":
      return `Unlimited ${limit.feature} in this tier`;
    case "included":
      return `${limit.amount} included`;
    case "used":
      return `${limit.amount} used`;
    case "cost":
      return limit.cost;
    case "perUse":
      return `${limit.amount} ${limit.units} per use`;
    case "limitOf":
      return `Limit of ${limit.amount}`;
    case "noLimit":
      return "No limit";
  }
}
