"use client";

import { useMemo } from "react";

import type { ComponentHydrateResponseData } from "../api/checkoutexternal";
import type { PublicPlansResponseData } from "../api/componentspublic";
import { toCatalogFromHydrate, toCatalogFromPublic, type Catalog, type CatalogMode } from "../catalog";
import type { SchematicBillingClient } from "../client";
import type { Resource } from "../store";
import { useResource, type SchematicHookResult } from "./use-resource";

export interface UseCatalogOptions {
  /**
   * Which catalog to fetch. "public" uses the publishable key
   * (GET /public/plans); "company" uses the access token
   * (GET /components/hydrate) and annotates plans with company context.
   * "auto" (default) picks "company" when the client has an access token.
   */
  mode?: CatalogMode | "auto";
}

/** Catalog of purchasable plans and add-ons, e.g. for a pricing table. */
export function useCatalog(
  client: SchematicBillingClient,
  options?: UseCatalogOptions,
): SchematicHookResult<Catalog> {
  const mode: CatalogMode =
    options?.mode === undefined || options.mode === "auto"
      ? client.hasAccessTokenMode
        ? "company"
        : "public"
      : options.mode;

  const resource: Resource<ComponentHydrateResponseData | PublicPlansResponseData> =
    mode === "company" ? client.hydrate : client.publicPlans;
  const result = useResource(resource);

  const data = useMemo(() => {
    if (result.data === undefined) {
      return undefined;
    }
    return mode === "company"
      ? toCatalogFromHydrate(result.data as ComponentHydrateResponseData)
      : toCatalogFromPublic(result.data as PublicPlansResponseData);
  }, [result.data, mode]);

  return useMemo(() => ({ ...result, data }), [result, data]);
}
