/**
 * Headless Schematic billing layer: a shared client plus focused React hooks.
 *
 * This folder is intentionally framework-agnostic (no Next.js imports) and
 * self-contained — it is the candidate source for a future published package.
 */

export { SchematicBillingClient, type SchematicBillingClientOptions } from "./client";
export { TokenManager, type AccessTokenProvider, type AccessTokenResult } from "./token";
export { Resource, type ResourceState } from "./store";

export { useCatalog, type UseCatalogOptions } from "./hooks/use-catalog";
export { useBilling } from "./hooks/use-billing";
export { useInvoices, type UseInvoicesOptions } from "./hooks/use-invoices";
export { type SchematicHookResult } from "./hooks/use-resource";

export {
  toCatalogFromHydrate,
  toCatalogFromPublic,
  type Catalog,
  type CatalogMode,
  type CatalogPlan,
} from "./catalog";
export { toBilling, type Billing } from "./billing";

export * from "./format";
export * from "./pricing";
export * from "./derive";

// Generated API enums and types that consumers commonly need when rendering.
export {
  BillingCreditGrantReason,
  EntitlementPriceBehavior,
  FeatureType,
  InvoiceStatus,
} from "./api/checkoutexternal";
export type {
  BillingPriceResponseData,
  CompanyDetailResponseData,
  CompanyPlanDetailResponseData,
  CompanySubscriptionResponseData,
  ComponentDisplaySettings,
  ComponentHydrateResponseData,
  CreditCompanyGrantView,
  FeatureResponseData,
  FeatureUsageResponseData,
  InvoiceResponseData,
  PlanDetailResponseData,
  PlanEntitlementResponseData,
  ScheduledDowngradeResponseData,
} from "./api/checkoutexternal";
export type { PublicPlansResponseData } from "./api/componentspublic";
