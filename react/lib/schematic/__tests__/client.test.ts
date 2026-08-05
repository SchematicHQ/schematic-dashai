import { describe, expect, it, vi } from "vitest";

import { SchematicBillingClient } from "../client";
import {
  envelope,
  jsonResponse,
  makeWireHydrate,
  makeWireInvoice,
  makeWirePublicPlans,
} from "./fixtures";

type FetchCall = { url: string; init: RequestInit | undefined };

function makeFetch(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
) {
  const calls: FetchCall[] = [];
  const fetchFn = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      return handler(url, init);
    },
  ) as unknown as typeof fetch;
  return { fetchFn, calls };
}

function makeClient(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
  options?: { publishableKey?: string; getAccessToken?: () => Promise<string> },
) {
  const { fetchFn, calls } = makeFetch(handler);
  const client = new SchematicBillingClient({
    publishableKey:
      options && "publishableKey" in options
        ? options.publishableKey
        : "api_pub",
    getAccessToken:
      options && "getAccessToken" in options
        ? options.getAccessToken
        : async () => "token_fresh",
    fetchFn,
  });
  return { client, calls };
}

describe("SchematicBillingClient", () => {
  it("throws when neither auth mode is configured", () => {
    expect(() => new SchematicBillingClient({})).toThrow(
      /publishableKey|getAccessToken/,
    );
  });

  it("fetches hydrate once for any number of consumers", async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse(envelope(makeWireHydrate())),
    );

    const resource = client.hydrate;
    expect(client.hydrate).toBe(resource); // stable identity

    resource.ensure();
    resource.ensure();
    await resource.refetch();

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toContain("/components/hydrate");
    const data = resource.getSnapshot().data!;
    expect(data.activePlans[0].id).toBe("plan_basic");
    expect(data.activePlans[0].current).toBe(true);
  });

  it("sends the access token in X-Schematic-Api-Key", async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse(envelope(makeWireHydrate())),
    );

    await client.hydrate.refetch();

    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers["X-Schematic-Api-Key"]).toBe("token_fresh");
  });

  it("retries exactly once with a fresh token on 401", async () => {
    let tokenCount = 0;
    const seenTokens: string[] = [];
    const { fetchFn, calls } = makeFetch((url, init) => {
      const headers = init?.headers as Record<string, string>;
      seenTokens.push(headers["X-Schematic-Api-Key"]);
      // First token is always rejected; the refreshed one succeeds.
      if (headers["X-Schematic-Api-Key"] === "token_0") {
        return jsonResponse({ error: "unauthorized" }, 401);
      }
      return jsonResponse(envelope(makeWireHydrate()));
    });
    const client = new SchematicBillingClient({
      getAccessToken: async () => `token_${tokenCount++}`,
      fetchFn,
    });

    await client.hydrate.refetch();

    expect(seenTokens).toEqual(["token_0", "token_1"]);
    expect(calls).toHaveLength(2);
    expect(client.hydrate.getSnapshot().data).toBeDefined();
    expect(client.hydrate.getSnapshot().error).toBeUndefined();
  });

  it("surfaces an error when the retried request is still 401", async () => {
    const { client } = makeClient(() =>
      jsonResponse({ error: "unauthorized" }, 401),
    );

    await client.hydrate.refetch();

    const state = client.hydrate.getSnapshot();
    expect(state.error).toBeDefined();
    expect(state.data).toBeUndefined();
  });

  it("fetches the public catalog with the publishable key", async () => {
    const { client, calls } = makeClient(
      () => jsonResponse(envelope(makeWirePublicPlans())),
      {
        publishableKey: "api_pub",
        getAccessToken: undefined,
      },
    );

    await client.publicPlans.refetch();

    expect(calls[0].url).toContain("/public/plans");
    const headers = calls[0].init?.headers as Record<string, string>;
    expect(headers["X-Schematic-Api-Key"]).toBe("api_pub");
    expect(client.publicPlans.getSnapshot().data?.activePlans[0].id).toBe(
      "plan_basic",
    );
  });

  it("returns a stable invoices resource per params combination", async () => {
    const { client, calls } = makeClient(() =>
      jsonResponse(
        envelope([makeWireInvoice(), makeWireInvoice({ id: "inv_2" })]),
      ),
    );

    const a = client.invoices({ limit: 2 });
    const b = client.invoices({ limit: 2 });
    const c = client.invoices({ limit: 5 });
    expect(a).toBe(b);
    expect(a).not.toBe(c);

    await a.refetch();
    expect(calls[0].url).toContain("/components/invoices");
    expect(calls[0].url).toContain("limit=2");
    expect(a.getSnapshot().data).toHaveLength(2);
  });

  it("invalidate() marks hydrate and invoice resources stale", async () => {
    const { client, calls } = makeClient((url) =>
      url.includes("/components/invoices")
        ? jsonResponse(envelope([makeWireInvoice()]))
        : jsonResponse(envelope(makeWireHydrate())),
    );

    await client.hydrate.refetch();
    await client.invoices().refetch();
    expect(calls).toHaveLength(2);

    client.invalidate();
    client.hydrate.ensure();
    client.invoices().ensure();
    await Promise.all([client.hydrate.refetch(), client.invoices().refetch()]);

    expect(calls).toHaveLength(4);
  });

  it("guards company-scoped access on a public-only client", () => {
    const { client } = makeClient(
      () => jsonResponse(envelope(makeWirePublicPlans())),
      {
        publishableKey: "api_pub",
        getAccessToken: undefined,
      },
    );

    expect(() => client.hydrate).toThrow(/getAccessToken/);
    expect(() => client.invoices()).toThrow(/getAccessToken/);
  });

  it("guards the public catalog on a token-only client", () => {
    const { client } = makeClient(
      () => jsonResponse(envelope(makeWireHydrate())),
      {
        publishableKey: undefined,
        getAccessToken: async () => "token_x",
      },
    );

    expect(() => client.publicPlans).toThrow(/publishableKey/);
  });
});
