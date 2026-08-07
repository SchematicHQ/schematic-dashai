import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  checkoutexternal,
  toCatalogFromHydrate,
  toSubscription,
} from "@schematichq/schematic-react";
import {
  makeWireCompanyPlan,
  makeWireHydrate,
  makeWireInvoice,
  makeWirePrice,
  wireDisplaySettings,
} from "./__tests__/fixtures";

import { CreditUsage } from "./credit-usage";
import { IncludedFeatures } from "./included-features";
import { Invoices } from "./invoices";
import { MeteredFeatures } from "./metered-features";
import { PlanManager } from "./plan-manager";
import { PricingTable } from "./pricing-table";
import { UpcomingBill } from "./upcoming-bill";

const { ComponentHydrateResponseDataFromJSON, InvoiceResponseDataFromJSON } =
  checkoutexternal;

const wireFeature = (overrides?: Record<string, unknown>) => ({
  access: true,
  allocation: 800,
  allocation_type: "numeric",
  entitlement_id: `ent_${Math.random().toString(36).slice(2)}`,
  entitlement_type: "plan",
  usage: 198,
  price_behavior: null,
  metric_reset_at: "2026-09-01T00:00:00Z",
  feature: {
    id: "feat_1",
    name: "Dashboard Prompt",
    description: "AI prompts",
    icon: "sparkles",
    feature_type: "event",
    singular_name: "prompt",
    plural_name: "prompts",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    flags: [],
    plans: [],
  },
  ...overrides,
});

const wireGrant = (overrides?: Record<string, unknown>) => ({
  id: `grant_${Math.random().toString(36).slice(2)}`,
  billing_credit_id: "credit_ai",
  company_id: "comp_demo",
  company_name: "Demo",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  credit_description: "AI credits",
  credit_name: "Credits",
  singular_name: "credit",
  plural_name: "credits",
  grant_reason: "plan",
  quantity: 1000,
  quantity_remaining: 600,
  quantity_used: 400,
  renewal_enabled: true,
  expires_at: "2026-09-01T00:00:00Z",
  source_label: "Plan",
  ...overrides,
});

function makeBilling() {
  const hydrate = ComponentHydrateResponseDataFromJSON(
    makeWireHydrate({
      company: {
        id: "comp_demo",
        name: "Demo Co",
        environment_id: "env_1",
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        add_ons: [
          {
            id: "addon_1",
            name: "Priority Support",
            plan_period: "month",
            plan_price: 5000,
            included_credit_grants: [],
          },
        ],
        billing_subscriptions: [],
        custom_plan_billings: [],
        entitlements: [],
        entity_traits: [],
        keys: [],
        metrics: [],
        payment_methods: [],
        plans: [],
        rules: [],
        user_count: 4,
        plan: {
          id: "plan_pro",
          name: "Pro",
          description: "For growing teams",
          plan_period: "month",
          plan_price: 25000,
          included_credit_grants: [],
        },
      },
      subscription: {
        cancel_at_period_end: false,
        currency: "usd",
        customer_external_id: "cus_1",
        discounts: [
          {
            coupon_id: "coup_1",
            coupon_name: "LAUNCH20",
            discount_external_id: "disc_1",
            duration: "forever",
            is_active: true,
            percent_off: 20,
            started_at: "2026-01-01T00:00:00Z",
            subscription_external_id: "sub_1",
          },
        ],
        interval: "month",
        is_initial: false,
        products: [],
        provider_type: "stripe",
        status: "active",
        subscription_external_id: "sub_1",
        total_price: 25000,
      },
      upcoming_invoice: makeWireInvoice({
        amount_due: 20000,
        starting_balance: -1000,
        ending_balance: 0,
        subtotal: 25000,
        due_date: "2026-09-01T00:00:00Z",
      }),
      feature_usage: {
        features: [
          wireFeature(),
          wireFeature({
            price_behavior: "pay_in_advance",
            allocation: 5,
            usage: 4,
            feature: {
              ...(wireFeature().feature as object),
              id: "feat_seats",
              name: "User Seat",
              feature_type: "trait",
              singular_name: "seat",
            },
          }),
          wireFeature({
            price_behavior: null,
            allocation: null,
            usage: 0,
            feature: {
              ...(wireFeature().feature as object),
              id: "feat_bool",
              name: "Video Generation",
              feature_type: "boolean",
            },
          }),
        ],
      },
      credit_grants: [
        wireGrant(),
        wireGrant({
          grant_reason: "billing_credit_auto_topup",
          quantity: 100,
          quantity_used: 100,
          quantity_remaining: 0,
        }),
      ],
      active_plans: [makeWireCompanyPlan({ current: true })],
    }),
  );
  return toSubscription(hydrate);
}

describe("billing components", () => {
  const billing = makeBilling();

  it("PlanManager renders plan, add-ons, and a stubbed change-plan button", () => {
    render(<PlanManager billing={billing} />);
    expect(screen.getByText("Pro")).toBeDefined();
    expect(screen.getByText("$250.00/mo")).toBeDefined();
    expect(screen.getByText("Priority Support")).toBeDefined();
    const button = screen.getByRole("button", { name: "Change plan" });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("IncludedFeatures renders every feature type", () => {
    render(<IncludedFeatures features={billing.features} />);
    expect(screen.getByText("Dashboard Prompt")).toBeDefined();
    expect(screen.getByText("Video Generation")).toBeDefined();
    expect(screen.getByText("198 of 800 prompts used")).toBeDefined();
  });

  it("UpcomingBill renders amount, discount, and applied balance", () => {
    render(
      <UpcomingBill
        upcomingInvoice={billing.upcomingInvoice}
        subscription={billing.subscription}
      />,
    );
    expect(screen.getByText("$200.00")).toBeDefined();
    expect(screen.getByText("LAUNCH20")).toBeDefined();
    expect(screen.getByText("−20%")).toBeDefined();
    expect(screen.getByText("($10.00)")).toBeDefined(); // applied balance
  });

  it("UpcomingBill hides when the subscription is cancelling", () => {
    const cancelling = {
      ...billing.subscription!,
      cancelAt: new Date("2026-09-01"),
    };
    const { container } = render(
      <UpcomingBill
        upcomingInvoice={billing.upcomingInvoice}
        subscription={cancelling}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("Invoices filters and renders rows", () => {
    const invoices = [
      InvoiceResponseDataFromJSON(
        makeWireInvoice({ id: "inv_a", amount_due: 3893 }),
      ),
      InvoiceResponseDataFromJSON(
        makeWireInvoice({ id: "inv_zero", amount_due: 0 }),
      ),
    ];
    render(<Invoices invoices={invoices} />);
    expect(screen.getByText("$38.93")).toBeDefined();
    expect(screen.queryByText("$0.00")).toBeNull();
  });

  it("MeteredFeatures shows only event/trait features", () => {
    render(<MeteredFeatures billing={billing} />);
    expect(screen.getByText("Dashboard Prompt")).toBeDefined();
    expect(screen.getByText("User Seat")).toBeDefined();
    expect(screen.queryByText("Video Generation")).toBeNull(); // boolean stays out
    expect(screen.getByText("4 of 5 seats used")).toBeDefined();
  });

  it("CreditUsage groups grants with totals", () => {
    render(<CreditUsage billing={billing} />);
    expect(screen.getAllByText("Credits").length).toBeGreaterThan(0);
    expect(screen.getByText("500 of 1,100 used")).toBeDefined();
    expect(screen.getByText("2 grants")).toBeDefined();
  });

  it("PricingTable renders plans with a current-plan badge in company mode", () => {
    const hydrate = ComponentHydrateResponseDataFromJSON(
      makeWireHydrate({
        active_plans: [
          makeWireCompanyPlan({
            id: "plan_basic",
            name: "Basic",
            current: true,
          }),
          makeWireCompanyPlan({ id: "plan_pro", name: "Pro", current: false }),
        ],
      }),
    );
    render(<PricingTable catalog={toCatalogFromHydrate(hydrate)} />);
    expect(screen.getByText("Basic")).toBeDefined();
    expect(screen.getByText("Current plan")).toBeDefined();
    const choose = screen.getByRole("button", { name: "Choose plan" });
    expect(choose.hasAttribute("disabled")).toBe(true); // checkout stubbed
    expect(screen.getAllByText("$10.00").length).toBe(2);
  });

  it("PricingTable enables plan selection when onSelectPlan is provided", () => {
    const hydrate = ComponentHydrateResponseDataFromJSON(
      makeWireHydrate({
        active_plans: [
          makeWireCompanyPlan({
            id: "plan_basic",
            name: "Basic",
            current: true,
          }),
          makeWireCompanyPlan({ id: "plan_pro", name: "Pro", current: false }),
        ],
      }),
    );
    const onSelectPlan = vi.fn();
    render(
      <PricingTable
        catalog={toCatalogFromHydrate(hydrate)}
        onSelectPlan={onSelectPlan}
      />,
    );

    const choose = screen.getByRole("button", { name: "Choose plan" });
    expect(choose.hasAttribute("disabled")).toBe(false);
    fireEvent.click(choose);
    expect(onSelectPlan).toHaveBeenCalledTimes(1);
    expect(onSelectPlan.mock.calls[0][0].id).toBe("plan_pro");
  });

  it("PricingTable shows a monthly equivalent when showAsMonthlyPrices is set", () => {
    const hydrate = ComponentHydrateResponseDataFromJSON(
      makeWireHydrate({
        display_settings: {
          ...wireDisplaySettings,
          show_as_monthly_prices: true,
        },
        active_plans: [
          makeWireCompanyPlan({
            id: "plan_yearly",
            name: "Yearly",
            yearly_price: makeWirePrice({
              id: "price_y",
              interval: "year",
              price: 58800,
            }),
          }),
        ],
      }),
    );
    render(<PricingTable catalog={toCatalogFromHydrate(hydrate)} />);

    fireEvent.click(screen.getByRole("button", { name: "Yearly" }));
    expect(screen.getByText("$49.00")).toBeDefined();
    expect(screen.getByText("/month, billed yearly")).toBeDefined();
  });

  it("PricingTable does not price a plan it has no price for", () => {
    const hydrate = ComponentHydrateResponseDataFromJSON(
      makeWireHydrate({
        display_settings: {
          ...wireDisplaySettings,
          show_zero_price_as_free: true,
        },
        active_plans: [
          makeWireCompanyPlan({ id: "plan_month", name: "MonthOnly" }),
          makeWireCompanyPlan({
            id: "plan_year",
            name: "HasYearly",
            yearly_price: makeWirePrice({
              id: "price_y",
              interval: "year",
              price: 58800,
            }),
          }),
        ],
      }),
    );
    render(
      <PricingTable
        catalog={toCatalogFromHydrate(hydrate)}
        onSelectPlan={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Yearly" }));

    // MonthOnly has no yearly price: it is unsold for this period, not free.
    expect(screen.queryByText("Free")).toBeNull();
    expect(screen.getByText("Not available yearly")).toBeDefined();
    expect(
      screen.getByText("MonthOnly is only available monthly."),
    ).toBeDefined();
    expect(screen.getAllByRole("button", { name: "Choose plan" })).toHaveLength(
      2,
    );
    const [monthOnly] = screen.getAllByRole("button", { name: "Choose plan" });
    expect(monthOnly.hasAttribute("disabled")).toBe(true);
  });

  it("PricingTable renders purchasable add-ons", () => {
    const hydrate = ComponentHydrateResponseDataFromJSON(
      makeWireHydrate({
        active_add_ons: [
          makeWireCompanyPlan({
            id: "addon_support",
            name: "Priority Support",
            description: "24h response",
          }),
        ],
      }),
    );
    const onSelectAddOn = vi.fn();
    render(
      <PricingTable
        catalog={toCatalogFromHydrate(hydrate)}
        onSelectAddOn={onSelectAddOn}
      />,
    );

    expect(screen.getByText("Add-ons")).toBeDefined();
    expect(screen.getByText("Priority Support")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    expect(onSelectAddOn.mock.calls[0][0].id).toBe("addon_support");
  });

  it("PricingTable explains an ineligible plan in visible text", () => {
    const hydrate = ComponentHydrateResponseDataFromJSON(
      makeWireHydrate({
        active_plans: [
          makeWireCompanyPlan({
            id: "plan_starter",
            name: "Starter",
            valid: false,
            usage_violations: [wireFeature()],
          }),
        ],
      }),
    );
    render(
      <PricingTable
        catalog={toCatalogFromHydrate(hydrate)}
        onSelectPlan={vi.fn()}
      />,
    );

    // A title on a disabled button is unreachable, so the reason must be text.
    expect(
      screen.getByText(
        "Cannot change to this plan while over the limit on Dashboard Prompt.",
      ),
    ).toBeDefined();
    const button = screen.getByRole("button", { name: "Over plan limit" });
    expect(button.hasAttribute("disabled")).toBe(true);
  });

  it("PlanManager omits the price when the API returns none", () => {
    const hydrate = ComponentHydrateResponseDataFromJSON(
      makeWireHydrate({
        display_settings: {
          ...wireDisplaySettings,
          show_zero_price_as_free: true,
        },
        company: {
          id: "comp_demo",
          name: "Demo Co",
          environment_id: "env_1",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
          add_ons: [],
          billing_subscriptions: [],
          custom_plan_billings: [],
          entitlements: [],
          entity_traits: [],
          keys: [],
          metrics: [],
          payment_methods: [],
          plans: [],
          rules: [],
          user_count: 1,
          plan: {
            id: "plan_pro",
            name: "Pro",
            plan_period: "month",
            plan_price: null,
            included_credit_grants: [],
          },
        },
      }),
    );
    render(<PlanManager billing={toSubscription(hydrate)} />);

    expect(screen.getByText("Pro")).toBeDefined();
    // An unknown price is not a zero price.
    expect(screen.queryByText("Free")).toBeNull();
    expect(screen.queryByText("$0.00/mo")).toBeNull();
  });

  it("PlanManager explains the disabled change-plan button in visible text", () => {
    render(<PlanManager billing={billing} />);
    expect(screen.getByText("Checkout is coming soon.")).toBeDefined();
  });

  it("UpcomingBill shows leftover credit as a positive balance", () => {
    const hydrate = ComponentHydrateResponseDataFromJSON(
      makeWireHydrate({
        subscription: {
          cancel_at_period_end: false,
          currency: "usd",
          customer_external_id: "cus_1",
          discounts: [],
          interval: "month",
          is_initial: false,
          products: [],
          provider_type: "stripe",
          status: "active",
          subscription_external_id: "sub_1",
          total_price: 50000,
        },
        upcoming_invoice: makeWireInvoice({
          amount_due: 50000,
          starting_balance: -3000,
          ending_balance: -2000,
          subtotal: 50000,
        }),
      }),
    );
    const withCredit = toSubscription(hydrate);
    render(
      <UpcomingBill
        upcomingInvoice={withCredit.upcomingInvoice}
        subscription={withCredit.subscription}
      />,
    );

    expect(screen.getByText("($10.00)")).toBeDefined(); // applied, a deduction
    expect(screen.getByText("$20.00")).toBeDefined(); // remaining credit held
  });

  it("IncludedFeatures marks a boolean entitlement as included", () => {
    const booleans = billing.features.filter(
      (feature) => feature.feature?.featureType === "boolean",
    );
    render(<IncludedFeatures features={booleans} />);

    expect(screen.getByText("Video Generation")).toBeDefined();
    expect(screen.getByLabelText("Included")).toBeDefined();
    expect(screen.queryByText(/used/)).toBeNull();
  });

  it("Invoices keeps the card when every invoice is filtered out", () => {
    const invoices = [
      InvoiceResponseDataFromJSON(
        makeWireInvoice({ id: "inv_zero", amount_due: 0 }),
      ),
    ];
    render(<Invoices invoices={invoices} />);
    expect(screen.getByText("No invoices to show yet.")).toBeDefined();
  });

  it("CreditUsage hides when display settings disable credits", () => {
    const hidden = {
      ...billing,
      displaySettings: { ...billing.displaySettings, showCredits: false },
    };
    const { container } = render(<CreditUsage billing={hidden} />);
    expect(container.innerHTML).toBe("");
  });
});
