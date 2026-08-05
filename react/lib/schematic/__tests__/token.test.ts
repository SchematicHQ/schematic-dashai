import { describe, expect, it, vi } from "vitest";

import { TokenManager } from "../token";

const MINUTE = 60_000;

function makeManager(overrides?: {
  results?: Array<string | { token: string; expiresAt?: string | Date }>;
  refreshMarginMs?: number;
  fallbackTtlMs?: number;
}) {
  let time = 0;
  const results = overrides?.results ?? ["token_a", "token_b", "token_c"];
  let call = 0;
  const getAccessToken = vi.fn(async () => {
    const result = results[Math.min(call, results.length - 1)];
    call += 1;
    return result;
  });
  const manager = new TokenManager({
    getAccessToken,
    refreshMarginMs: overrides?.refreshMarginMs,
    fallbackTtlMs: overrides?.fallbackTtlMs,
    now: () => time,
  });
  return { manager, getAccessToken, advance: (ms: number) => (time += ms) };
}

describe("TokenManager", () => {
  it("caches the token until expiresAt minus the refresh margin", async () => {
    const { manager, getAccessToken, advance } = makeManager({
      results: [
        { token: "token_a", expiresAt: new Date(15 * MINUTE) },
        { token: "token_b", expiresAt: new Date(30 * MINUTE) },
      ],
    });

    expect(await manager.getToken()).toBe("token_a");
    advance(13 * MINUTE); // 13m < 15m - 1m margin
    expect(await manager.getToken()).toBe("token_a");
    expect(getAccessToken).toHaveBeenCalledTimes(1);

    advance(1.5 * MINUTE); // now past the margin
    expect(await manager.getToken()).toBe("token_b");
    expect(getAccessToken).toHaveBeenCalledTimes(2);
  });

  it("applies the fallback TTL to bare-string tokens", async () => {
    const { manager, getAccessToken, advance } = makeManager({
      results: ["token_a", "token_b"],
    });

    expect(await manager.getToken()).toBe("token_a");
    advance(13 * MINUTE);
    expect(await manager.getToken()).toBe("token_a");
    advance(1.5 * MINUTE);
    expect(await manager.getToken()).toBe("token_b");
    expect(getAccessToken).toHaveBeenCalledTimes(2);
  });

  it("shares one in-flight refresh among concurrent callers", async () => {
    const { manager, getAccessToken } = makeManager();

    const [a, b, c] = await Promise.all([
      manager.getToken(),
      manager.getToken(),
      manager.getToken(),
    ]);

    expect(a).toBe("token_a");
    expect(b).toBe("token_a");
    expect(c).toBe("token_a");
    expect(getAccessToken).toHaveBeenCalledTimes(1);
  });

  it("invalidate() forces a fresh token on the next call", async () => {
    const { manager, getAccessToken } = makeManager();

    expect(await manager.getToken()).toBe("token_a");
    manager.invalidate();
    expect(await manager.getToken()).toBe("token_b");
    expect(getAccessToken).toHaveBeenCalledTimes(2);
  });

  it("a failed refresh rejects waiters and allows a retry", async () => {
    let call = 0;
    const getAccessToken = vi.fn(async () => {
      call += 1;
      if (call === 1) {
        throw new Error("boom");
      }
      return "token_b";
    });
    const manager = new TokenManager({ getAccessToken, now: () => 0 });

    await expect(manager.getToken()).rejects.toThrow("boom");
    expect(await manager.getToken()).toBe("token_b");
    expect(getAccessToken).toHaveBeenCalledTimes(2);
  });

  it("rejects an empty token from the provider", async () => {
    const manager = new TokenManager({
      getAccessToken: async () => "",
      now: () => 0,
    });

    await expect(manager.getToken()).rejects.toThrow(/empty token/);
  });
});
