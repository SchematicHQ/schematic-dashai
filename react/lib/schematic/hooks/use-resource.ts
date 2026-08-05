"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

import type { Resource } from "../store";

export interface SchematicHookResult<T> {
  data: T | undefined;
  /** No data yet and a fetch is (or is about to be) in flight. */
  isPending: boolean;
  /** A fetch is in flight while previous data is still shown. */
  isRefetching: boolean;
  error: Error | undefined;
  refetch: () => Promise<void>;
}

/**
 * Subscribes a component to a Resource. The fetch is kicked off in an effect,
 * so nothing runs during SSR; until then the idle state reports isPending so
 * first paint shows a loading state rather than "no data".
 */
export function useResource<T>(resource: Resource<T>): SchematicHookResult<T> {
  const state = useSyncExternalStore(
    resource.subscribe,
    resource.getSnapshot,
    resource.getSnapshot,
  );

  useEffect(() => {
    resource.ensure();
  }, [resource]);

  return useMemo(
    () => ({
      data: state.data,
      isPending: state.isPending || (state.data === undefined && state.error === undefined),
      isRefetching: state.isRefetching,
      error: state.error,
      refetch: resource.refetch,
    }),
    [state, resource],
  );
}
