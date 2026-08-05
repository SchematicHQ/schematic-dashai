import { describe, expect, it } from "vitest";

import { formatCurrency, formatDate, formatNumber, periodSuffix, pluralize } from "../format";
import { calculateTieredCost, derivePeriod, getPriceValue } from "../pricing";

describe("formatCurrency", () => {
  it("formats cents as dollars", () => {
    expect(formatCurrency(1000)).toBe("$10.00");
    expect(formatCurrency(1999, "usd")).toBe("$19.99");
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("renders negative amounts accounting-style", () => {
    expect(formatCurrency(-1050)).toBe("($10.50)");
  });

  it("respects other currencies", () => {
    expect(formatCurrency(1000, "eur")).toBe("€10.00");
  });
});

describe("formatDate", () => {
  it("formats dates and tolerates junk", () => {
    expect(formatDate(new Date("2026-01-15T00:00:00Z"))).toMatch(/Jan 1[45], 2026/);
    expect(formatDate("2026-01-15T12:00:00Z")).toMatch(/Jan 15, 2026/);
    expect(formatDate(undefined)).toBe("");
    expect(formatDate("not a date")).toBe("");
  });
});

describe("periodSuffix", () => {
  it("maps periods to suffixes", () => {
    expect(periodSuffix("month")).toBe("/mo");
    expect(periodSuffix("quarter")).toBe("/qtr");
    expect(periodSuffix("year")).toBe("/yr");
    expect(periodSuffix("one-time")).toBe("");
    expect(periodSuffix(undefined)).toBe("");
  });
});

describe("pluralize / formatNumber", () => {
  it("pluralizes and formats", () => {
    expect(pluralize("seat", 1)).toBe("seat");
    expect(pluralize("seat", 2)).toBe("seats");
    expect(formatNumber(1234567)).toBe("1,234,567");
  });
});

describe("derivePeriod", () => {
  it("detects quarterly stored as month x3", () => {
    expect(derivePeriod("month", 3)).toBe("quarter");
    expect(derivePeriod("month", 1)).toBe("month");
    expect(derivePeriod("year")).toBe("year");
    expect(derivePeriod(undefined)).toBeUndefined();
  });
});

describe("getPriceValue", () => {
  it("prefers the decimal representation", () => {
    expect(getPriceValue({ price: 1000, priceDecimal: "1000.5", currency: "usd" })).toBe(1000.5);
    expect(getPriceValue({ price: 1000, priceDecimal: null, currency: "usd" })).toBe(1000);
  });
});

describe("calculateTieredCost", () => {
  const tiers = [
    { upTo: 10, perUnitPrice: 100, perUnitPriceDecimal: null, flatAmount: null },
    { upTo: null, perUnitPrice: 50, perUnitPriceDecimal: null, flatAmount: null },
  ];

  it("graduated mode charges each tier for its span", () => {
    expect(calculateTieredCost(5, tiers)).toBe(500);
    expect(calculateTieredCost(15, tiers)).toBe(10 * 100 + 5 * 50);
  });

  it("volume mode charges the whole quantity at the landing tier", () => {
    expect(calculateTieredCost(5, tiers, "volume")).toBe(500);
    expect(calculateTieredCost(15, tiers, "volume")).toBe(15 * 50);
  });
});
