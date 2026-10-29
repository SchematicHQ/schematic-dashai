"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  useCatalog,
  useCheckout,
  useCompany,
  useCreditBalances,
  useFeatureUsage,
  usePaymentMethods,
  type CatalogAutoTopup,
} from "@schematichq/schematic-react"
import {
  formatCurrency,
  formatNumber,
  useResolvedLocale,
} from "@schematichq/schematic-components/elements"
import { AlertCircle, CheckCircle2, Loader2, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Retry, Skeleton } from "@/components/billing/status"
import { cn } from "@/lib/utils"

type Choice = { enabled: boolean; thresholdCredits: number; amount: number }

// Presets scale the plan's own threshold and amount, so they fit any credit
// whatever its size.
const PRESETS = [
  { id: "light", label: "Light", hint: "Small refills, close to empty", threshold: 0.5, amount: 0.5 },
  { id: "plan", label: "Recommended", hint: "Your plan's defaults", threshold: 1, amount: 1 },
  { id: "heavy", label: "Heavy", hint: "Bigger refills, fewer charges", threshold: 2, amount: 3 },
  { id: "buffer", label: "Never run dry", hint: "A deep buffer for bursts", threshold: 5, amount: 5 },
] as const

// Two significant digits, so presets land on numbers a person would pick.
// Credits are whole numbers; the API refuses anything else.
const round = (n: number) => Math.max(0, Math.round(Number(n.toPrecision(2))))

// A slider ceiling: 1, 2 or 5 times a power of ten at or above n.
function ceiling(n: number) {
  const p = 10 ** Math.floor(Math.log10(Math.max(n, 1)))
  return ([1, 2, 5, 10].find((m) => m * p >= n) ?? 10) * p
}

// Lets a company set its own auto top-up for each plan credit that allows it.
// Saving is a checkout for the plan it's already on, carrying the new
// settings as `autoTopupOverrides`; nothing changes hands but the settings.
export function AutoTopupEditor() {
  const catalog = useCatalog()
  const company = useCompany()
  const credits = useCreditBalances()
  const { data: usage } = useFeatureUsage()
  const { data: methods } = usePaymentMethods()
  const {
    setSelections,
    finalize,
    reset,
    snapshot,
    problems,
    isPricing,
    isFinalizing,
    error,
  } = useCheckout()
  const locale = useResolvedLocale()
  const router = useRouter()
  // Settings by plan credit grant id, only for the ones the customer touched.
  const [edits, setEdits] = useState<Record<string, Choice>>({})
  // Sliders fire on every pixel; the cart is priced once they settle.
  const [settling, setSettling] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handles = [catalog, company, credits]
  if (handles.some((h) => h.data === undefined)) {
    const failed = handles.find((h) => h.error)
    return failed ? (
      <Retry onClick={() => handles.forEach((h) => h.refetch())} error={failed.error} />
    ) : (
      <Skeleton className="h-96" />
    )
  }
  if (catalog.data?.source !== "company") return null

  const plan = catalog.data.catalog.plans.find((p) => p.current)
  const topups = plan?.autoTopups ?? []
  const editable = topups.filter((t) => t.availability === "user_controlled")

  if (!plan || editable.length === 0) {
    const automatic = topups.filter((t) => t.availability === "automatic" && t.enabled)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auto top-up</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {automatic.length > 0
            ? `${plan?.name} tops up automatically on its own settings. Talk to us to change them.`
            : `${plan?.name ?? "Your plan"} doesn't let you set auto top-up.`}
        </CardContent>
      </Card>
    )
  }

  const period = company.data?.subscription?.period === "year" ? "year" : "month"
  const planPrice =
    (period === "year" ? plan.yearlyPrice : plan.monthlyPrice) ??
    plan.monthlyPrice ??
    plan.yearlyPrice
  const money = (minor: number, currency: string) => formatCurrency(minor, currency, locale)
  const count = (n: number) => formatNumber(n, locale)

  const grantFor = (t: CatalogAutoTopup) =>
    plan.includedCreditGrants.find((g) => g.creditId === t.creditId)
  // What the plan suggests, for presets and slider ranges.
  const baseFor = (t: CatalogAutoTopup) => {
    const granted = grantFor(t)?.creditAmount || 1000
    return {
      threshold: t.thresholdCredits ?? round(granted * 0.1),
      amount: t.amount ?? granted,
    }
  }
  const savedFor = (t: CatalogAutoTopup): Choice => {
    const base = baseFor(t)
    return {
      enabled: t.companyEnabled ?? t.enabled,
      thresholdCredits: t.companyThresholdCredits ?? base.threshold,
      amount: t.companyAmount ?? base.amount,
    }
  }
  const choiceFor = (t: CatalogAutoTopup) => edits[t.planCreditGrantId] ?? savedFor(t)
  const same = (a: Choice, b: Choice) =>
    a.enabled === b.enabled && a.thresholdCredits === b.thresholdCredits && a.amount === b.amount
  const dirty = editable.some((t) => !same(choiceFor(t), savedFor(t)))

  // A top-up is charged at the credit's own price.
  const costOf = (t: CatalogAutoTopup, amount: number) => {
    const unit = t.unitPrice
    if (!unit) return null
    const perCredit =
      (unit.priceDecimal ? Number(unit.priceDecimal) : unit.price) / (unit.packageSize || 1)
    return money(perCredit * amount, unit.currency)
  }

  // The plan as it stands, seats included, plus the new top-up settings.
  const price = (next: Record<string, Choice>) => {
    setSettling(false)
    setSelections({
      planId: plan.id,
      priceId: planPrice?.id,
      payInAdvance: plan.entitlements.flatMap((entitlement) => {
        if (entitlement.priceBehavior !== "pay_in_advance") return []
        const unit =
          period === "year" ? entitlement.meteredYearlyPrice : entitlement.meteredMonthlyPrice
        if (!unit) return []
        const allocation = usage?.find((u) => u.featureId === entitlement.featureId)?.allocation
        return [{ priceId: unit.id, quantity: allocation ?? 1 }]
      }),
      autoTopupOverrides: editable.map((t) => {
        const choice = next[t.planCreditGrantId] ?? savedFor(t)
        return {
          planCreditGrantId: t.planCreditGrantId,
          autoTopupEnabled: choice.enabled,
          autoTopupThresholdCredits: choice.thresholdCredits,
          autoTopupAmount: choice.amount,
        }
      }),
      paymentMethodId: methods?.find((m) => m.isDefault)?.externalId,
    }).catch(() => {})
  }

  const change = (t: CatalogAutoTopup, choice: Choice) => {
    const next = { ...edits, [t.planCreditGrantId]: choice }
    setEdits(next)
    setSettling(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => price(next), 350)
  }

  const discard = () => {
    clearTimeout(timer.current)
    setSettling(false)
    setEdits({})
    reset()
  }

  // Saved, it's back to the portal, which reloads with the new settings. A
  // refused save is already on `problems`.
  const save = () =>
    finalize()
      .then(() => {
        const changed = editable.find((t) => !same(choiceFor(t), savedFor(t)))
        const choice = changed && choiceFor(changed)
        const grant = changed && grantFor(changed)
        const name = grant?.creditPluralName || grant?.creditName || "credits"
        toast.success("Auto top-up saved", {
          description: !choice
            ? undefined
            : choice.enabled
              ? `Adds ${count(choice.amount)} ${name} when ${count(choice.thresholdCredits)} are left.`
              : `Off for ${name}.`,
        })
        router.push("/billing")
      })
      .catch(() => {})

  const blocking = problems.some((p) => p.blocking)
  const status = !dirty
    ? "idle"
    : isFinalizing
      ? "saving"
      : settling || isPricing
        ? "checking"
        : error || blocking || !snapshot
          ? "blocked"
          : "ready"

  return (
    <div className="space-y-6">
      {editable.map((t) => {
        const grant = grantFor(t)
        const balance = credits.data?.find((c) => c.creditId === t.creditId)
        return (
          <TopupPanel
            key={t.planCreditGrantId}
            name={grant?.creditPluralName || grant?.creditName || "credits"}
            balance={balance?.remaining ?? 0}
            base={baseFor(t)}
            choice={choiceFor(t)}
            saved={savedFor(t)}
            changed={!same(choiceFor(t), savedFor(t))}
            onChange={(choice) => change(t, choice)}
            cost={(amount) => costOf(t, amount)}
            count={count}
          />
        )
      })}

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 text-sm">
            <SaveStatus status={status} />
            {status === "ready" && snapshot && (
              <p className="text-muted-foreground">
                Due today {money(snapshot.dueNow, snapshot.currency)}. Your plan and seats stay
                as they are.
              </p>
            )}
            {status === "blocked" && (
              <ul className="text-destructive">
                {error && <li>{error.message}</li>}
                {problems.map((p) => (
                  <li key={p.code}>{p.message}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={!dirty || isFinalizing} onClick={discard}>
              Discard
            </Button>
            <Button disabled={status !== "ready"} onClick={save}>
              {status === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
              {status === "saving" ? "Saving…" : "Save auto top-up"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

type Status = "idle" | "checking" | "blocked" | "ready" | "saving"

function SaveStatus({ status }: { status: Status }) {
  const lines: Record<Status, [React.ReactNode, string]> = {
    idle: [null, "No changes yet"],
    checking: [<Loader2 key="i" className="h-4 w-4 animate-spin" />, "Checking your changes…"],
    blocked: [<AlertCircle key="i" className="h-4 w-4" />, "These settings can't be saved yet"],
    ready: [<CheckCircle2 key="i" className="h-4 w-4" />, "Ready to save"],
    saving: [<Loader2 key="i" className="h-4 w-4 animate-spin" />, "Saving…"],
  }
  const [icon, text] = lines[status]
  return (
    <p
      className={cn(
        "flex items-center gap-2 font-medium",
        status === "blocked" && "text-destructive",
        status === "ready" && "text-emerald-600 dark:text-emerald-400",
        (status === "idle" || status === "checking") && "text-muted-foreground",
      )}
    >
      {icon}
      {text}
    </p>
  )
}

function TopupPanel({
  name,
  balance,
  base,
  saved,
  choice,
  changed,
  onChange,
  cost,
  count,
}: {
  name: string
  balance: number
  base: { threshold: number; amount: number }
  saved: Choice
  choice: Choice
  changed: boolean
  onChange: (choice: Choice) => void
  cost: (amount: number) => string | null
  count: (n: number) => string
}) {
  // Ranges come from the plan and what's saved, never the value being dragged,
  // or reaching the end of a slider would stretch it and run away.
  const thresholdMax = ceiling(Math.max(base.threshold * 6, saved.thresholdCredits * 1.5, 10))
  const amountMax = ceiling(Math.max(base.amount * 6, saved.amount * 1.5, 10))
  const preset =
    PRESETS.find(
      (p) =>
        round(base.threshold * p.threshold) === choice.thresholdCredits &&
        round(base.amount * p.amount) === choice.amount,
    )?.id ?? "custom"
  const perTopup = cost(choice.amount)

  const applyPreset = (id: string) => {
    const p = PRESETS.find((candidate) => candidate.id === id)
    if (!p) return
    onChange({
      enabled: true,
      thresholdCredits: round(base.threshold * p.threshold),
      amount: round(base.amount * p.amount),
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-accent" />
            Auto top-up for {name}
            {changed && <Badge variant="secondary">Unsaved</Badge>}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {count(balance)} {name} left right now
          </p>
        </div>
        <Switch
          checked={choice.enabled}
          onCheckedChange={(enabled) => onChange({ ...choice, enabled })}
          aria-label={`Auto top-up for ${name}`}
        />
      </CardHeader>
      <CardContent className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className={cn("space-y-6 transition-opacity", !choice.enabled && "opacity-40")}>
          <p className="text-lg leading-snug">
            {choice.enabled ? (
              <>
                When you drop below <strong>{count(choice.thresholdCredits)}</strong> {name}, add{" "}
                <strong>{count(choice.amount)}</strong>
                {perTopup && (
                  <>
                    {" "}
                    for <strong>{perTopup}</strong>
                  </>
                )}
                .
              </>
            ) : (
              <>Off. Once your {name} run out, usage stops until your plan renews.</>
            )}
          </p>

          <div className="space-y-2">
            <p className="text-sm font-medium">Preset</p>
            <Select value={preset} onValueChange={applyPreset} disabled={!choice.enabled}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRESETS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="font-medium">{p.label}</span>
                    <span className="text-muted-foreground">
                      +{count(round(base.amount * p.amount))} at{" "}
                      {count(round(base.threshold * p.threshold))} left
                    </span>
                  </SelectItem>
                ))}
                {preset === "custom" && (
                  <SelectItem value="custom" disabled>
                    Custom
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {PRESETS.find((p) => p.id === preset)?.hint ?? "Your own settings"}
            </p>
          </div>

          <SliderField
            label="Top up when the balance drops below"
            value={choice.thresholdCredits}
            max={thresholdMax}
            disabled={!choice.enabled}
            display={`${count(choice.thresholdCredits)} ${name}`}
            onChange={(thresholdCredits) => onChange({ ...choice, thresholdCredits })}
          />
          <SliderField
            label="Add each time"
            value={choice.amount}
            min={Math.max(1, amountMax / 100)}
            max={amountMax}
            disabled={!choice.enabled}
            display={`${count(choice.amount)} ${name}${perTopup ? ` · ${perTopup}` : ""}`}
            onChange={(amount) => onChange({ ...choice, amount })}
          />
        </div>

        <BalanceForecast
          balance={balance}
          choice={choice}
          name={name}
          perTopup={perTopup}
          count={count}
        />
      </CardContent>
    </Card>
  )
}

function SliderField({
  label,
  value,
  min = 0,
  max,
  disabled,
  display,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max: number
  disabled: boolean
  display: string
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="font-medium">{label}</span>
        <span className="shrink-0 tabular-nums text-muted-foreground">{display}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={Math.max(1, Math.round(max / 100))}
        disabled={disabled}
        onValueChange={([next]) => onChange(Math.min(max, Math.max(min, round(next))))}
      />
    </div>
  )
}

// How the balance moves as credits get used from here: it drains to the
// threshold, jumps by the top-up amount, and repeats. Plotted against credits
// used rather than time, since we don't know how fast they'll be used. A big
// balance would flatten the sawtooth into a ramp, so the chart skips ahead
// to just before the first top-up.
function BalanceForecast({
  balance,
  choice,
  name,
  perTopup,
  count,
}: {
  balance: number
  choice: Choice
  name: string
  perTopup: string | null
  count: (n: number) => string
}) {
  const on = choice.enabled && choice.amount > 0
  const threshold = choice.thresholdCredits
  const drain = Math.max(balance - threshold, 0)
  const skipped = on ? Math.max(drain - choice.amount * 1.5, 0) : 0
  const start = balance - skipped
  const span = on ? drain - skipped + choice.amount * 3.4 : Math.max(balance, 1) * 1.5

  const points: [number, number][] = [[0, start]]
  const topups: [number, number][] = []
  let used = 0
  let left = start
  for (let i = 0; i < 24 && used < span; i++) {
    if (on && left <= threshold) {
      left += choice.amount
      points.push([used, left])
      topups.push([used, left])
    }
    const next = Math.min(span, used + (on ? Math.max(left - threshold, 0) : left))
    left -= next - used
    used = next
    points.push([used, left])
    if (!on && left <= 0) {
      points.push([span, 0])
      break
    }
  }

  const W = 560
  const H = 200
  const top = 24
  const bottom = 24
  const yMax = Math.max(start, threshold + (on ? choice.amount : 0), 1) * 1.1
  const x = (u: number) => (u / span) * W
  const y = (b: number) => top + (1 - b / yMax) * (H - top - bottom)
  const line = points.map(([u, b], i) => `${i ? "L" : "M"}${x(u)},${y(b)}`).join(" ")
  const area = `${line} L${W},${y(0)} L0,${y(0)} Z`

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-muted/30 p-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full overflow-visible"
          role="img"
          aria-label={`${name} balance as credits are used`}
        >
          <path d={area} className="fill-primary/10 transition-all duration-300" />
          <path
            d={line}
            fill="none"
            strokeWidth={2}
            strokeLinejoin="round"
            className="stroke-primary transition-all duration-300"
          />
          {on && (
            <g className="text-muted-foreground">
              <line
                x1={0}
                x2={W}
                y1={y(threshold)}
                y2={y(threshold)}
                stroke="currentColor"
                strokeDasharray="4 4"
              />
              <text
                x={W}
                y={y(threshold) + 14}
                textAnchor="end"
                fontSize={11}
                fill="currentColor"
              >
                tops up below {count(threshold)}
              </text>
            </g>
          )}
          {topups.map(([u, b], i) => (
            <g key={i}>
              <circle cx={x(u)} cy={y(b)} r={5} className="fill-accent stroke-background" strokeWidth={2} />
              {perTopup && i < 3 && (
                <text
                  x={x(u)}
                  y={y(b) - 10}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  className="fill-foreground"
                >
                  +{perTopup}
                </text>
              )}
            </g>
          ))}
          <line x1={0} x2={W} y1={y(0)} y2={y(0)} className="stroke-border" />
          <text x={0} y={H - 6} fontSize={11} className="fill-muted-foreground">
            {skipped > 0 ? `… after ${count(skipped)} more used` : "now"}
          </text>
          <text x={W} y={H - 6} fontSize={11} textAnchor="end" className="fill-muted-foreground">
            {name} used →
          </text>
        </svg>
      </div>
      <dl className="grid grid-cols-3 gap-3 text-sm">
        <Stat label="Each top-up" value={on ? (perTopup ?? `${count(choice.amount)} ${name}`) : "None"} />
        <Stat
          label="First one after"
          value={on ? (drain === 0 ? "Right away" : `${count(drain)} used`) : "Never"}
        />
        <Stat label="Then every" value={on ? `${count(choice.amount)} used` : "Never"} />
      </dl>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{value}</dd>
    </div>
  )
}
