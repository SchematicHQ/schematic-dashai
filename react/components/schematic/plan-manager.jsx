"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  derivePlanManager,
  useResolvedLocale,
} from "@schematichq/schematic-components/elements";

const HEADING =
  "text-[0.8125rem] font-semibold tracking-wider text-muted-foreground uppercase";

const SHORT = { month: "mo", quarter: "qtr", year: "yr" };
const short = (period) => SHORT[period] ?? period;
const UNITS = {
  day: ["day", "days"],
  hour: ["hour", "hours"],
  minute: ["minute", "minutes"],
};

export function PlanManager({
  company,
  usage,
  credits,
  onChangePlan,
  onEditAutoTopup,
}) {
  const locale = useResolvedLocale();
  const view = derivePlanManager(
    { company, featureUsage: usage, creditBalances: credits },
    { locale },
  );
  const notice = view.notice === null ? null : noticeText(view.notice);

  return (
    <Card>
      <CardHeader>
        <CardTitle className={HEADING}>Current plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {notice !== null && (
          <Alert role="status">
            <AlertDescription>{notice}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-5 rounded-xl border p-6">
          {view.plan === null ? (
            <p className="text-sm text-muted-foreground">
              You are not on a plan.
            </p>
          ) : (
            <div className="flex items-baseline justify-between gap-4">
              <div className="space-y-1">
                <p className="text-3xl leading-none font-extrabold">
                  {view.plan.name}
                </p>
                {view.plan.description !== null && (
                  <p className="text-sm text-muted-foreground">
                    {view.plan.description}
                  </p>
                )}
              </div>
              {view.plan.price !== null && (
                <p className="font-semibold tabular-nums">
                  {priceText(view.plan.price)}
                </p>
              )}
            </div>
          )}
          {view.canChangePlan && onChangePlan && (
            <Button size="sm" onClick={onChangePlan}>
              Change plan
            </Button>
          )}
        </div>

        <PlanList title="Add-ons" rows={view.addOns}>
          {(addOn) => (
            <li key={addOn.id} className="flex justify-between gap-4">
              <span className="font-medium">{addOn.name}</span>
              {addOn.price !== null && (
                <span className="font-medium tabular-nums">
                  {addOn.price.period === "one-time"
                    ? `${addOn.price.amount} once`
                    : `${addOn.price.amount}/${short(addOn.price.period)}`}
                </span>
              )}
            </li>
          )}
        </PlanList>

        <PlanList title="Usage-based" rows={view.usageBased}>
          {(row) => {
            const detail = usageBasedDetail(row);
            return (
              <li key={row.featureId} className="flex justify-between gap-4">
                <span className="font-medium">
                  {row.quantity === null
                    ? row.name
                    : `${row.quantity.amount} ${row.quantity.units}`}
                </span>
                {detail.length > 0 && (
                  <span className="text-right text-muted-foreground tabular-nums">
                    {detail}
                  </span>
                )}
              </li>
            );
          }}
        </PlanList>

        <PlanList
          title="Credits in plan"
          rows={view.planCredits}
          truncate
          footer={
            view.autoTopup !== null && (
              <div className="flex items-start justify-between gap-4 rounded-xl bg-muted px-4 py-3 text-sm">
                <div className="space-y-1">
                  <p className="font-semibold">Auto top-up</p>
                  {view.autoTopup.lines.map((line) => (
                    <p key={line.creditId}>
                      {line.kind === "disabled"
                        ? `Off for ${line.unit}`
                        : `Adds ${line.amount} ${line.unit} when ${line.threshold} are left`}
                    </p>
                  ))}
                </div>
                {onEditAutoTopup && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={onEditAutoTopup}
                  >
                    Edit auto top-up
                  </Button>
                )}
              </div>
            )
          }
        >
          {(row) => (
            <li key={row.creditId} className="space-y-1">
              <div className="flex justify-between gap-4">
                <span className="font-medium">{planCreditText(row.text)}</span>
                <Used
                  amount={row.used}
                  tip={
                    row.autoTopup &&
                    `Tops up ${row.autoTopup.amount} credits when ${row.autoTopup.threshold} are left`
                  }
                />
              </div>
              {row.composition !== null && (
                <p className="text-sm text-muted-foreground">
                  {compositionText(row.composition)}
                </p>
              )}
            </li>
          )}
        </PlanList>

        {[
          ["Top-ups", view.topUps, true],
          ["Credit bundles", view.bundles, false],
          ["Promotional credits", view.promotional, false],
        ].map(([title, rows, countAlways]) => (
          <PlanList key={title} title={title} rows={rows} truncate>
            {(row) => (
              <li key={row.key} className="flex justify-between gap-4">
                <span className="font-medium">
                  {title === "Promotional credits"
                    ? `${row.quantity} ${row.creditName}`
                    : groupText(row, countAlways)}
                </span>
                <Used amount={row.used} />
              </li>
            )}
          </PlanList>
        ))}
      </CardContent>
    </Card>
  );
}

function PlanList({ title, rows, truncate = false, footer, children }) {
  const [all, setAll] = useState(!truncate);
  if (rows.length === 0) return null;
  const shown = all ? rows : rows.slice(0, 3);

  return (
    <div className="space-y-3">
      <h3 className={HEADING}>{title}</h3>
      <ul className="space-y-3 text-[0.9375rem]">{shown.map(children)}</ul>
      {truncate && rows.length > 3 && (
        <Button
          variant="link"
          className="h-auto p-0"
          aria-expanded={all}
          onClick={() => setAll(!all)}
        >
          {all ? "Show fewer" : `See all (${rows.length})`}
        </Button>
      )}
      {footer}
    </div>
  );
}

function Used({ amount, tip }) {
  if (amount === null) return null;
  return (
    <span
      title={tip}
      className="text-sm whitespace-nowrap text-muted-foreground tabular-nums"
    >
      {amount} used{tip && " ↻"}
    </span>
  );
}

function noticeText(notice) {
  const plan = notice.planName ?? "your plan";
  switch (notice.kind) {
    case "trial": {
      if (notice.endsIn === null) return null;
      if (notice.endsIn === "soon")
        return "Your trial ends in less than a minute.";
      if (notice.endsIn === "ended") return "Your trial has ended.";
      const [one, many] = UNITS[notice.endsIn.unit];
      return `Your trial ends in ${notice.endsIn.amount} ${notice.endsIn.amount === 1 ? one : many}.`;
    }
    case "canceled":
      return notice.date === null
        ? "Your subscription is canceled."
        : `Your subscription is canceled. You keep ${plan} until ${notice.date}.`;
    case "customPlanBilling":
      return notice.awaitingActivation
        ? `Pay the invoice by ${notice.date} to activate ${plan}.`
        : `Pay the invoice by ${notice.date} to keep ${plan}.`;
    case "scheduledDowngrade":
      return notice.date === null
        ? `You move to ${notice.toPlanName} at the end of this period.`
        : `You move to ${notice.toPlanName} on ${notice.date}.`;
  }
}

function priceText(price) {
  if (price.kind === "usageBased") return "Pay as you go";
  if (price.kind === "free") return "Free";
  return price.period === null
    ? price.amount
    : `${price.amount}/${short(price.period)}`;
}

function usageBasedDetail(row) {
  const figure = (key, text) => (
    <span key={key} className="font-medium text-foreground">
      {text}
    </span>
  );
  const parts = [];
  if (row.tierBased) parts.push("Tiered pricing");
  if (row.unitPrice !== null) {
    const per =
      row.unitPrice.packageSize === null
        ? row.unitPrice.units
        : `${row.unitPrice.packageSize} ${row.unitPrice.units}`;
    const period =
      row.unitPrice.period === null ? "" : `/${short(row.unitPrice.period)}`;
    parts.push(
      <span key="price">
        {row.additional && "Additional "}
        {figure("cost", row.unitPrice.cost)} per {per}
        {period}
      </span>,
    );
  }
  if (row.perUse !== null)
    parts.push(`${row.perUse.amount} ${row.perUse.units} per use`);
  if (row.cost !== null)
    parts.push(
      figure(
        "allocation",
        row.cost.period === null
          ? row.cost.amount
          : `${row.cost.amount}/${short(row.cost.period)}`,
      ),
    );
  return parts.flatMap((part, i) =>
    i === 0 ? [part] : [<span key={`sep-${i}`}> · </span>, part],
  );
}

function planCreditText(text) {
  if (text.kind === "perLicense") {
    const plus =
      text.plus === null
        ? ""
        : `, plus ${text.plus.amount} ${text.plus.creditName} a ${text.plus.period}`;
    return `${text.amount} ${text.creditName} per ${text.licenseName}${plus}`;
  }
  return text.period === null
    ? `${text.amount} ${text.creditName}`
    : `${text.amount} ${text.creditName} a ${text.period}`;
}

function compositionText(c) {
  const fixed = c.fixed === null ? "" : ` + ${c.fixed}`;
  return `${c.total} ${c.creditName}/${short(c.period)} in all — ${c.quantity} ${c.licenseName} × ${c.perUnit}${fixed}`;
}

function groupText(row, countAlways) {
  const amount = `${row.quantity} ${row.creditName}`;
  const named =
    row.bundleName === null ? amount : `${row.bundleName} — ${amount}`;
  const counted =
    row.count > 1 && (countAlways || row.bundleName !== null)
      ? `(${row.count}) `
      : "";
  return counted + named;
}
