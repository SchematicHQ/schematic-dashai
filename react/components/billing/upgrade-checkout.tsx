"use client"

import { useState } from "react"
import Link from "next/link"
import {
  useCatalog,
  useCheckout,
  useFeatureUsage,
  usePaymentMethods,
} from "@schematichq/schematic-react"
import {
  formatCurrency,
  useResolvedLocale,
} from "@schematichq/schematic-components/elements"
import { AlertCircle, CheckCircle2, Loader2, Minus, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Retry, Skeleton } from "@/components/billing/status"
import { cn } from "@/lib/utils"

type Period = "month" | "year"

// The catalog has no "featured" flag, so the plan to spotlight is ours to pick.
const MOST_POPULAR_PLAN = "Pro"

// A custom checkout on the checkout API: pick a plan, period and seat counts,
// the server prices the cart, then finalize charges it.
export function UpgradeCheckout() {
  const catalog = useCatalog()
  const { data: methods } = usePaymentMethods()
  const { data: usage } = useFeatureUsage()
  const {
    setSelections,
    finalize,
    reset,
    snapshot,
    problems,
    isPricing,
    isFinalizing,
    error,
    result,
  } = useCheckout()
  const locale = useResolvedLocale()
  const [period, setPeriod] = useState<Period>("year")
  const [planId, setPlanId] = useState<string>()
  // Seat counts by feature id, only for the ones the customer has touched.
  const [seats, setSeats] = useState<Record<string, number>>({})

  if (catalog.data === undefined) {
    return catalog.error ? (
      <Retry onClick={catalog.refetch} error={catalog.error} />
    ) : (
      <Skeleton className="h-96" />
    )
  }
  // The company's view of the catalog; signed out, there's nothing to buy.
  if (catalog.data.source !== "company") return null

  const plans = catalog.data.catalog.plans
  const money = (amount: number, currency: string) =>
    formatCurrency(amount, currency, locale)
  const priceFor = (plan: (typeof plans)[number], p: Period) =>
    p === "year" ? plan.yearlyPrice : plan.monthlyPrice
  const hasYearly = plans.some((plan) => plan.yearlyPrice)
  const blocking = problems.some((p) => p.blocking)
  const selectedPlan = plans.find((plan) => plan.id === planId)

  // Pay-in-advance entitlements are bought per unit (seats). Each needs a
  // quantity at the entitlement's price for the chosen period.
  const seatLines = (plan: (typeof plans)[number] | undefined, p: Period) =>
    (plan?.entitlements ?? []).flatMap((entitlement) => {
      if (entitlement.priceBehavior !== "pay_in_advance") return []
      const unit =
        p === "year" ? entitlement.meteredYearlyPrice : entitlement.meteredMonthlyPrice
      return unit ? [{ entitlement, unit }] : []
    })
  // What the customer chose, else what they're paying for now, else one.
  const seatsFor = (featureId: string, chosen: Record<string, number>) =>
    chosen[featureId] ??
    usage?.find((u) => u.featureId === featureId && u.priceBehavior === "pay_in_advance")
      ?.allocation ??
    1

  // Every write carries the whole cart; the hook folds rapid calls into the
  // newest. A failed write also lands on `error`.
  const price = (id: string, p: Period, chosen: Record<string, number>) => {
    const plan = plans.find((candidate) => candidate.id === id)
    if (!plan) return
    setPlanId(id)
    setSelections({
      planId: plan.id,
      priceId: priceFor(plan, p)?.id,
      payInAdvance: seatLines(plan, p).map(({ entitlement, unit }) => ({
        priceId: unit.id,
        quantity: seatsFor(entitlement.featureId, chosen),
      })),
      paymentMethodId: methods?.find((m) => m.isDefault)?.externalId,
    }).catch(() => {})
  }

  const choosePeriod = (p: Period) => {
    setPeriod(p)
    if (planId) price(planId, p, seats)
  }

  const changeSeats = (featureId: string, quantity: number) => {
    const next = { ...seats, [featureId]: Math.max(0, quantity) }
    setSeats(next)
    if (planId) price(planId, period, next)
  }

  // A refused finalize is already on `problems`.
  const pay = () => finalize().catch(() => {})

  // Where the cart stands, so every part of the page can say the same thing.
  // Until the server answers for the newest cart, whatever is on screen is
  // the previous cart's price.
  const status: CheckoutStatus = !planId
    ? "idle"
    : isFinalizing
      ? "finalizing"
      : isPricing
        ? "checking"
        : error || blocking || !snapshot
          ? "blocked"
          : "ready"

  if (result) {
    const plan = plans.find((candidate) => candidate.id === planId)
    return (
      <Card>
        <CardHeader>
          <CardTitle>You&apos;re on {plan?.name ?? "your new plan"}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild>
            <Link href="/billing">Back to billing</Link>
          </Button>
          <Button variant="outline" onClick={reset}>
            Make another change
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        {hasYearly && (
          <div className="flex justify-center">
            <div
              role="group"
              aria-label="Billing period"
              className="inline-flex gap-1 rounded-full border bg-muted/40 p-1"
            >
              {(["month", "year"] as const).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  className="rounded-full"
                  variant={p === period ? "default" : "ghost"}
                  aria-pressed={p === period}
                  onClick={() => choosePeriod(p)}
                >
                  {p === "month" ? "Monthly" : "Yearly"}
                  {/* Demo copy: not every plan's yearly price is actually 10% off. */}
                  {p === "year" && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-foreground">
                      Save 10%
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        )}
        {/* Top padding leaves room for the popular card to stand above the row. */}
        <div className="grid gap-4 pt-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => {
            const planPrice = priceFor(plan, period)
            const selected = plan.id === planId
            const popular = plan.name === MOST_POPULAR_PLAN
            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative transition-shadow",
                  popular &&
                    "border-accent shadow-lg shadow-accent/20 ring-1 ring-accent md:-my-3 md:py-9",
                  selected && "ring-2 ring-primary",
                )}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-3 py-0.5 text-xs font-semibold text-accent-foreground shadow">
                    Most popular
                  </span>
                )}
                <CardHeader className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.current && <Badge variant="secondary">Current</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan.description}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-2xl font-bold tabular-nums">
                    {planPrice
                      ? `${money(planPrice.price, planPrice.currency)}/${period === "month" ? "mo" : "yr"}`
                      : "Free"}
                  </p>
                  <Button
                    className="w-full"
                    variant={selected || popular ? "default" : "outline"}
                    // The current plan is still buyable when its seats are.
                    disabled={
                      (plan.current && seatLines(plan, period).length === 0) ||
                      !plan.valid ||
                      isFinalizing
                    }
                    onClick={() => price(plan.id, period, seats)}
                  >
                    {selected && status === "checking" ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Checking…
                      </>
                    ) : selected
                      ? "Selected"
                      : plan.current
                        ? seatLines(plan, period).length > 0
                          ? "Change seats"
                          : "Current plan"
                        : "Choose"}
                  </Button>
                  {!plan.valid && plan.usageViolations.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Your current usage is over this plan&apos;s limits.
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Card className="lg:sticky lg:top-6">
        <CardHeader className="space-y-2">
          <CardTitle>Summary</CardTitle>
          <StatusLine status={status} />
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {!planId && (
            <p className="text-muted-foreground">Choose a plan to see the price.</p>
          )}
          {seatLines(selectedPlan, period).map(({ entitlement, unit }) => {
            const quantity = seatsFor(entitlement.featureId, seats)
            return (
              <div
                key={entitlement.featureId}
                className="flex items-center justify-between gap-4 border-b pb-4"
              >
                <div>
                  <p className="font-medium">
                    {entitlement.featurePluralName || entitlement.featureName || "Seats"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {money(unit.price, unit.currency)} each
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    aria-label="Fewer"
                    disabled={quantity <= 0 || isFinalizing}
                    onClick={() => changeSeats(entitlement.featureId, quantity - 1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center tabular-nums">{quantity}</span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-7 w-7"
                    aria-label="More"
                    disabled={isFinalizing}
                    onClick={() => changeSeats(entitlement.featureId, quantity + 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )
          })}
          {planId && !snapshot && isPricing && (
            <div aria-hidden="true" className="space-y-3 animate-pulse">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex justify-between">
                  <div className="h-4 w-20 rounded bg-muted" />
                  <div className="h-4 w-16 rounded bg-muted" />
                </div>
              ))}
            </div>
          )}
          {snapshot && (
            <dl
              aria-busy={isPricing}
              className={`space-y-2 transition-opacity duration-200 ${isPricing ? "opacity-40" : ""}`}
            >
              <Row label={period === "month" ? "Per month" : "Per year"}>
                {money(snapshot.totalPerBillingPeriod, snapshot.currency)}
              </Row>
              {snapshot.proration !== 0 && (
                <Row label="Prorated">
                  {money(snapshot.proration, snapshot.currency)}
                </Row>
              )}
              {snapshot.discountAmount > 0 && (
                <Row label="Discount">
                  −{money(snapshot.discountAmount, snapshot.currency)}
                </Row>
              )}
              {!!snapshot.taxAmount && (
                <Row label="Tax">{money(snapshot.taxAmount, snapshot.currency)}</Row>
              )}
              {snapshot.customerBalanceApplied !== 0 && (
                <Row label="Account balance">
                  −{money(Math.abs(snapshot.customerBalanceApplied), snapshot.currency)}
                </Row>
              )}
              <div className="border-t pt-2">
                <Row label="Due today" strong>
                  {money(snapshot.dueNow, snapshot.currency)}
                </Row>
              </div>
            </dl>
          )}
          {/* Held back while re-pricing: they describe the previous cart. */}
          {!isPricing && (problems.length > 0 || error) && (
            <div className="space-y-2 rounded-md border border-destructive/40 bg-destructive/10 p-3">
              {problems.map((problem) => (
                <p
                  key={`${problem.code}-${problem.planId ?? ""}`}
                  role={problem.blocking ? "alert" : "status"}
                  className={problem.blocking ? "text-destructive" : "text-muted-foreground"}
                >
                  {problem.message}
                </p>
              ))}
              {error && (
                <p role="alert" className="text-destructive">
                  {error.message}
                </p>
              )}
            </div>
          )}
          <Button className="w-full" disabled={status !== "ready"} onClick={pay}>
            {status === "checking" || status === "finalizing" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {status === "checking" ? "Checking price…" : "Processing…"}
              </>
            ) : status === "idle" ? (
              "Choose a plan"
            ) : status === "blocked" ? (
              "Can't complete this change"
            ) : snapshot && snapshot.dueNow > 0 ? (
              `Pay ${money(snapshot.dueNow, snapshot.currency)}`
            ) : (
              "Confirm change"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

type CheckoutStatus = "idle" | "checking" | "blocked" | "ready" | "finalizing"

const STATUS_LINES: Record<
  Exclude<CheckoutStatus, "idle">,
  { icon: typeof Loader2; text: string; className: string; spin?: boolean }
> = {
  checking: {
    icon: Loader2,
    text: "Checking price and availability…",
    className: "text-muted-foreground",
    spin: true,
  },
  finalizing: {
    icon: Loader2,
    text: "Applying your change…",
    className: "text-muted-foreground",
    spin: true,
  },
  blocked: {
    icon: AlertCircle,
    text: "This change can't go through yet",
    className: "text-destructive",
  },
  ready: {
    icon: CheckCircle2,
    text: "Ready to confirm",
    className: "text-emerald-500",
  },
}

function StatusLine({ status }: { status: CheckoutStatus }) {
  if (status === "idle") return null
  const { icon: Icon, text, className, spin } = STATUS_LINES[status]
  return (
    <p role="status" className={`flex items-center gap-2 text-xs ${className}`}>
      <Icon className={`h-3.5 w-3.5 ${spin ? "animate-spin" : ""}`} />
      {text}
    </p>
  )
}

function Row({
  label,
  strong,
  children,
}: {
  label: string
  strong?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "font-semibold" : ""}`}>
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular-nums">{children}</dd>
    </div>
  )
}
