// The head-to-head comparison (spec BATTLE-03). Pure functions.
//
// The source draws each trader's P&L change since a common start, so both
// lines begin at zero. Its start is the moment both traders have data: for
// the recorded pair, the first point of the Kalshi history (2025-09-27
// 09:23:39 UTC, $45,200.28), with the Polymarket line based on its first
// daily point after that. These are the source's own figures, so this
// rebuilds its comparison from the documented histories alone.

import { valueAxis, type SeriesPoint, type ValueAxis } from "@/features/profile/history";

/**
 * The head-to-head chart pads its value range by 15% on each side, where the
 * profile chart pads 10%: the padding that turns the recorded histories into
 * the source's labels (comparison.test.ts).
 */
const BATTLE_VALUE_PADDING = 0.15;

export interface Comparison {
  /** When both lines start at zero, epoch milliseconds. */
  start: number;
  /** Latest moment either line reaches. */
  end: number;
  polymarket: SeriesPoint[];
  kalshi: SeriesPoint[];
}

/** A series from `start` on, as change since its first point there. */
export function changeSince(series: readonly SeriesPoint[], start: number): SeriesPoint[] {
  const from = series.filter((point) => point.t >= start);
  const base = from[0]?.v;
  return base === undefined ? [] : from.map((point) => ({ t: point.t, v: point.v - base }));
}

/**
 * Both traders' P&L change from the first moment both have data. null when
 * either history is empty, or one ends before the other begins.
 */
export function compare(
  polymarket: readonly SeriesPoint[],
  kalshi: readonly SeriesPoint[],
): Comparison | null {
  if (polymarket.length === 0 || kalshi.length === 0) return null;
  const start = Math.max(polymarket[0].t, kalshi[0].t);
  const lines = { polymarket: changeSince(polymarket, start), kalshi: changeSince(kalshi, start) };
  const lastPolymarket = lines.polymarket.at(-1);
  const lastKalshi = lines.kalshi.at(-1);
  if (!lastPolymarket || !lastKalshi) return null;
  return { start, end: Math.max(lastPolymarket.t, lastKalshi.t), ...lines };
}

/** The chart's value axis, over both lines. */
export function comparisonAxis(comparison: Comparison): ValueAxis {
  const values = [...comparison.polymarket, ...comparison.kalshi].map((point) => point.v);
  return valueAxis(Math.min(...values), Math.max(...values), BATTLE_VALUE_PADDING);
}
