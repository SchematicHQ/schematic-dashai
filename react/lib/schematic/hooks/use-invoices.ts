"use client";

import type { InvoiceResponseData } from "../api/checkoutexternal";
import type { SchematicBillingClient } from "../client";
import { useResource, type SchematicHookResult } from "./use-resource";

export interface UseInvoicesOptions {
  /** Max invoices to fetch (API default 100, max 250). */
  limit?: number;
  offset?: number;
}

/**
 * The customer's latest invoices (GET /components/invoices). Requires the
 * client to be configured with getAccessToken; the company is resolved from
 * the token, never passed explicitly.
 */
export function useInvoices(
  client: SchematicBillingClient,
  options?: UseInvoicesOptions,
): SchematicHookResult<InvoiceResponseData[]> {
  return useResource(client.invoices(options));
}
