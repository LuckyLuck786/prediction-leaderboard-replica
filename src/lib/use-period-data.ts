"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PeriodData<T> = { status: "loading" } | { status: "ready"; value: T } | { status: "failed" };

/**
 * Data that comes in one piece per period. The first period arrives with the
 * page. With `prefetch` the others are fetched after the first paint, all at
 * once, so switching period is instant (the source's home board does this);
 * without it, a period is fetched when `request` is called for it (the
 * source's Kalshi board does that, KAL-07).
 *
 * State only changes when a request settles, never synchronously inside an
 * effect: "loading" is simply "asked for, not settled yet".
 */
export function usePeriodData<P extends string, T>({
  periods,
  initialPeriod,
  initialValue,
  fetchPeriod,
  prefetch,
}: {
  periods: readonly P[];
  /** Fetch every period after the first paint, rather than on request. */
  prefetch: boolean;
  initialPeriod: P;
  initialValue: T;
  /** Must be stable across renders, for example a module-level function. */
  fetchPeriod: (period: P) => Promise<T>;
}) {
  const [values, setValues] = useState<Partial<Record<P, T>>>(
    () => ({ [initialPeriod]: initialValue }) as Partial<Record<P, T>>,
  );
  const [failed, setFailed] = useState<ReadonlySet<P>>(() => new Set());
  const requested = useRef<Set<P>>(new Set([initialPeriod]));

  const request = useCallback(
    (period: P) => {
      if (requested.current.has(period)) return;
      requested.current.add(period);
      fetchPeriod(period).then(
        (value) => setValues((previous) => ({ ...previous, [period]: value })),
        (error: unknown) => {
          console.error(`Could not load period ${period}.`, error);
          requested.current.delete(period);
          setFailed((previous) => new Set(previous).add(period));
        },
      );
    },
    [fetchPeriod],
  );

  useEffect(() => {
    if (!prefetch) return;
    for (const period of periods) request(period);
  }, [prefetch, periods, request]);

  const retry = useCallback(
    (period: P) => {
      setFailed((previous) => {
        const next = new Set(previous);
        next.delete(period);
        return next;
      });
      request(period);
    },
    [request],
  );

  const get = (period: P): PeriodData<T> => {
    const value = values[period];
    if (value !== undefined) return { status: "ready", value };
    return failed.has(period) ? { status: "failed" } : { status: "loading" };
  };

  return { get, request, retry };
}
