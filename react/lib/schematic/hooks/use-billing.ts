"use client";

import { useMemo } from "react";

import { toBilling, type Billing } from "../billing";
import type { SchematicBillingClient } from "../client";
import { useResource, type SchematicHookResult } from "./use-resource";

/**
 * The customer's billing state: current plan, subscription, payment method,
 * upcoming invoice, feature usage, and credit grants. Always requires the
 * client to be configured with getAccessToken (company context comes from the
 * token). Shares its fetch with company-mode useCatalog.
 */
export function useBilling(client: SchematicBillingClient): SchematicHookResult<Billing> {
  // client.hydrate throws with a descriptive message when the client has no
  // access-token mode; surfacing that at render time is intentional.
  const result = useResource(client.hydrate);

  const data = useMemo(
    () => (result.data === undefined ? undefined : toBilling(result.data)),
    [result.data],
  );

  return useMemo(() => ({ ...result, data }), [result, data]);
}
