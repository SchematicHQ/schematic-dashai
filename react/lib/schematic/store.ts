/**
 * Resource<T> is a minimal external store for one async value, designed to be
 * consumed through React's useSyncExternalStore. Multiple subscribers share a
 * single in-flight fetch, and getSnapshot() always returns the same object
 * reference between state transitions (a useSyncExternalStore requirement).
 */

export type ResourceState<T> = Readonly<{
  data: T | undefined;
  error: Error | undefined;
  /** A fetch is in flight and there is no data yet. */
  isPending: boolean;
  /** A fetch is in flight but previous data is still available. */
  isRefetching: boolean;
}>;

const IDLE_STATE: ResourceState<never> = Object.freeze({
  data: undefined,
  error: undefined,
  isPending: false,
  isRefetching: false,
});

export function idleState<T>(): ResourceState<T> {
  return IDLE_STATE;
}

type ResourceStatus = "idle" | "fetching" | "resolved" | "stale";

export class Resource<T> {
  private state: ResourceState<T> = IDLE_STATE;
  private status: ResourceStatus = "idle";
  private listeners = new Set<() => void>();
  private inFlight: Promise<void> | undefined;

  constructor(private readonly fetcher: () => Promise<T>) {}

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): ResourceState<T> => {
    return this.state;
  };

  /** Start a fetch if the resource is idle or has been invalidated. */
  ensure = (): void => {
    if (this.status === "idle" || this.status === "stale") {
      void this.fetch();
    }
  };

  /** Force a fetch; joins the in-flight one if a fetch is already running. */
  refetch = (): Promise<void> => {
    return this.fetch();
  };

  /**
   * Mark the resource stale. Refetches immediately when someone is
   * subscribed; otherwise the next ensure() fetches lazily.
   */
  invalidate = (): void => {
    if (this.listeners.size > 0) {
      void this.fetch();
    } else if (this.status !== "fetching") {
      this.status = "stale";
    }
  };

  private fetch(): Promise<void> {
    if (this.inFlight) {
      return this.inFlight;
    }
    this.status = "fetching";
    this.setState({
      data: this.state.data,
      error: undefined,
      isPending: this.state.data === undefined,
      isRefetching: this.state.data !== undefined,
    });
    this.inFlight = this.fetcher()
      .then((data) => {
        this.status = "resolved";
        this.setState({ data, error: undefined, isPending: false, isRefetching: false });
      })
      .catch((cause) => {
        this.status = "resolved";
        const error = cause instanceof Error ? cause : new Error(String(cause));
        // Keep the previous data so the UI can show stale content next to the error.
        this.setState({
          data: this.state.data,
          error,
          isPending: false,
          isRefetching: false,
        });
      })
      .finally(() => {
        this.inFlight = undefined;
      });
    return this.inFlight;
  }

  private setState(state: ResourceState<T>): void {
    this.state = Object.freeze(state);
    for (const listener of this.listeners) {
      listener();
    }
  }
}
