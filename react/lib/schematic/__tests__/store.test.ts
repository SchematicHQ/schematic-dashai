import { describe, expect, it, vi } from "vitest";

import { Resource } from "../store";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("Resource", () => {
  it("dedupes concurrent ensure() calls into one fetch", async () => {
    const gate = deferred<string>();
    const fetcher = vi.fn(() => gate.promise);
    const resource = new Resource(fetcher);

    resource.ensure();
    resource.ensure();
    resource.ensure();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(resource.getSnapshot().isPending).toBe(true);

    gate.resolve("value");
    await resource.refetch(); // joins the same in-flight fetch
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(resource.getSnapshot().data).toBe("value");
  });

  it("returns a stable snapshot reference between transitions", async () => {
    const resource = new Resource(async () => "value");

    const before = resource.getSnapshot();
    expect(resource.getSnapshot()).toBe(before);

    await resource.refetch();
    const after = resource.getSnapshot();
    expect(after).not.toBe(before);
    expect(resource.getSnapshot()).toBe(after);
  });

  it("keeps previous data while refetching and reports isRefetching", async () => {
    let value = "first";
    const resource = new Resource(async () => value);

    await resource.refetch();
    expect(resource.getSnapshot().data).toBe("first");

    value = "second";
    const gate = deferred<void>();
    const slow = new Resource(async () => "unused");
    void slow; // silence unused in this scope

    const refetching = resource.refetch();
    // synchronous state right after starting the refetch
    expect(resource.getSnapshot().data).toBe("first");
    expect(resource.getSnapshot().isRefetching).toBe(true);
    expect(resource.getSnapshot().isPending).toBe(false);
    gate.resolve();
    await refetching;
    expect(resource.getSnapshot().data).toBe("second");
    expect(resource.getSnapshot().isRefetching).toBe(false);
  });

  it("stores errors and retains prior data", async () => {
    let fail = false;
    const resource = new Resource(async () => {
      if (fail) {
        throw new Error("boom");
      }
      return "value";
    });

    await resource.refetch();
    fail = true;
    await resource.refetch();

    const state = resource.getSnapshot();
    expect(state.error?.message).toBe("boom");
    expect(state.data).toBe("value");

    fail = false;
    await resource.refetch();
    expect(resource.getSnapshot().error).toBeUndefined();
  });

  it("notifies subscribers on every transition and stops after unsubscribe", async () => {
    const resource = new Resource(async () => "value");
    const listener = vi.fn();
    const unsubscribe = resource.subscribe(listener);

    await resource.refetch();
    expect(listener).toHaveBeenCalledTimes(2); // fetching + resolved

    unsubscribe();
    await resource.refetch();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("invalidate() refetches immediately when subscribed, lazily otherwise", async () => {
    const fetcher = vi.fn(async () => "value");
    const resource = new Resource(fetcher);

    await resource.refetch();
    expect(fetcher).toHaveBeenCalledTimes(1);

    // No subscribers: invalidate marks stale, ensure() triggers the fetch.
    resource.invalidate();
    expect(fetcher).toHaveBeenCalledTimes(1);
    resource.ensure();
    expect(fetcher).toHaveBeenCalledTimes(2);
    await resource.refetch(); // wait out the fetch ensure() started

    // With a subscriber: invalidate refetches immediately.
    const unsubscribe = resource.subscribe(() => {});
    resource.invalidate();
    expect(fetcher).toHaveBeenCalledTimes(3);
    unsubscribe();
  });

  it("ensure() after resolve does not refetch while data is fresh", async () => {
    const fetcher = vi.fn(async () => "value");
    const resource = new Resource(fetcher);

    await resource.refetch();
    resource.ensure();
    resource.ensure();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("ensure() revalidates once cached data ages past staleTime", async () => {
    let time = 0;
    const fetcher = vi.fn(async () => "value");
    const resource = new Resource(fetcher, { staleTime: 30_000, now: () => time });

    await resource.refetch();
    expect(fetcher).toHaveBeenCalledTimes(1);

    // A remount while still fresh reuses the cache...
    time += 10_000;
    resource.ensure();
    expect(fetcher).toHaveBeenCalledTimes(1);

    // ...but once stale by age, a remount revalidates. This is the
    // navigate-away / change-plan-elsewhere / navigate-back case.
    time += 25_000;
    resource.ensure();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("ensure() retries after a failed fetch", async () => {
    let fail = true;
    const fetcher = vi.fn(async () => {
      if (fail) {
        throw new Error("network down");
      }
      return "value";
    });
    const resource = new Resource(fetcher);

    await resource.refetch();
    expect(resource.getSnapshot().error?.message).toBe("network down");

    // Remounting a hook must retry rather than replay the dead error state.
    fail = false;
    resource.ensure();
    await resource.refetch();

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(resource.getSnapshot().error).toBeUndefined();
    expect(resource.getSnapshot().data).toBe("value");
  });

  it("invalidate() supersedes an in-flight fetch instead of joining it", async () => {
    const gates: Array<(value: string) => void> = [];
    const fetcher = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          gates.push(resolve);
        }),
    );
    const resource = new Resource(fetcher);
    const unsubscribe = resource.subscribe(() => {});

    resource.ensure();
    expect(fetcher).toHaveBeenCalledTimes(1);

    // A plan change lands while the first request is still open.
    resource.invalidate();
    expect(fetcher).toHaveBeenCalledTimes(2);

    // The pre-change response arrives last and must not win.
    gates[1]("after-change");
    gates[0]("before-change");
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(resource.getSnapshot().data).toBe("after-change");
    unsubscribe();
  });

  it("invalidate() with no subscribers marks stale even mid-fetch", async () => {
    const gates: Array<(value: string) => void> = [];
    const fetcher = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          gates.push(resolve);
        }),
    );
    const resource = new Resource(fetcher);

    resource.ensure();
    resource.invalidate(); // no listeners: should not fetch now, but must not forget
    expect(fetcher).toHaveBeenCalledTimes(1);

    gates[0]("stale-value");
    await new Promise((resolve) => setTimeout(resolve, 0));

    // The next mount fetches rather than serving the superseded response.
    resource.ensure();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
