/** Formatting helpers for money, dates, and billing periods. */

/**
 * Formats an amount in the currency's minor unit (cents) as a currency string.
 * Negative amounts render accounting-style — "($10.00)" — since in billing
 * they represent credits.
 */
export function formatCurrency(cents: number, currency = "usd"): string {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  });
  const formatted = formatter.format(Math.abs(cents) / 100);
  return cents < 0 ? `(${formatted})` : formatted;
}

export function formatDate(date: Date | string | undefined | null): string {
  if (date == null) {
    return "";
  }
  const value = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(value.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

const PERIOD_SUFFIXES: Record<string, string> = {
  month: "/mo",
  quarter: "/qtr",
  year: "/yr",
  "one-time": "",
};

/** "/mo", "/qtr", "/yr" — empty string for one-time or unknown periods. */
export function periodSuffix(period: string | undefined | null): string {
  return (period && PERIOD_SUFFIXES[period]) || "";
}

const PERIOD_NAMES: Record<string, string> = {
  month: "month",
  quarter: "quarter",
  year: "year",
};

export function periodName(period: string | undefined | null): string | undefined {
  return period ? PERIOD_NAMES[period] : undefined;
}

export function pluralize(word: string, count: number): string {
  if (count === 1) {
    return word;
  }
  return word.endsWith("s") ? word : `${word}s`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
