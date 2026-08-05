import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SchematicBillingClient } from "../client";
import { useBilling } from "../hooks/use-billing";
import { useCatalog } from "../hooks/use-catalog";
import { useInvoices } from "../hooks/use-invoices";
import {
  envelope,
  jsonResponse,
  makeWireHydrate,
  makeWireInvoice,
  makeWirePublicPlans,
} from "./fixtures";

function makeClient(options?: {
  publishableKey?: string;
  withToken?: boolean;
  failFirst?: boolean;
}) {
  let failed = false;
  const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (options?.failFirst && !failed) {
      failed = true;
      return jsonResponse({ error: "server error" }, 500);
    }
    if (url.includes("/components/invoices")) {
      return jsonResponse(envelope([makeWireInvoice()]));
    }
    if (url.includes("/components/hydrate")) {
      return jsonResponse(envelope(makeWireHydrate()));
    }
    if (url.includes("/public/plans")) {
      return jsonResponse(envelope(makeWirePublicPlans()));
    }
    return jsonResponse({ error: "not found" }, 404);
  }) as unknown as typeof fetch;

  const client = new SchematicBillingClient({
    publishableKey: options?.publishableKey,
    getAccessToken: options?.withToken === false ? undefined : async () => "token_x",
    fetchFn,
  });
  return { client, fetchFn };
}

describe("useBilling", () => {
  it("transitions from pending to data", async () => {
    const { client } = makeClient();
    const { result } = renderHook(() => useBilling(client));

    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();

    await waitFor(() => expect(result.current.isPending).toBe(false));
    expect(result.current.error).toBeUndefined();
    expect(result.current.data?.displaySettings.showCredits).toBe(true);
    expect(result.current.data?.features).toEqual([]);
  });

  it("recovers from an error via refetch", async () => {
    const { client } = makeClient({ failFirst: true });
    const { result } = renderHook(() => useBilling(client));

    await waitFor(() => expect(result.current.error).toBeDefined());

    await result.current.refetch();
    await waitFor(() => {
      expect(result.current.error).toBeUndefined();
      expect(result.current.data).toBeDefined();
    });
  });

  it("throws a descriptive error on a public-only client", () => {
    const { client } = makeClient({ publishableKey: "api_pub", withToken: false });
    expect(() => renderHook(() => useBilling(client))).toThrow(/getAccessToken/);
  });
});

describe("useCatalog", () => {
  it("uses the public catalog in public mode", async () => {
    const { client } = makeClient({ publishableKey: "api_pub", withToken: false });
    const { result } = renderHook(() => useCatalog(client));

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.mode).toBe("public");
    expect(result.current.data?.plans[0].current).toBeUndefined();
  });

  it("auto mode prefers company context when a token is available", async () => {
    const { client } = makeClient({ publishableKey: "api_pub" });
    const { result } = renderHook(() => useCatalog(client));

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.mode).toBe("company");
    expect(result.current.data?.plans[0].current).toBe(true);
  });

  it("shares one hydrate fetch with useBilling", async () => {
    const { client, fetchFn } = makeClient();
    const billing = renderHook(() => useBilling(client));
    const catalog = renderHook(() => useCatalog(client, { mode: "company" }));

    await waitFor(() => {
      expect(billing.result.current.data).toBeDefined();
      expect(catalog.result.current.data).toBeDefined();
    });

    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});

describe("useInvoices", () => {
  it("fetches the invoice list", async () => {
    const { client } = makeClient();
    const { result } = renderHook(() => useInvoices(client, { limit: 5 }));

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].amountDue).toBe(1000);
  });

  it("keeps a stable resource across rerenders with equivalent options", async () => {
    const { client, fetchFn } = makeClient();
    const { result, rerender } = renderHook(() => useInvoices(client, { limit: 5 }));

    await waitFor(() => expect(result.current.data).toBeDefined());
    rerender();
    rerender();
    // hydrate is untouched; only one invoices call despite fresh options objects
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
});
