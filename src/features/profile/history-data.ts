// A profile's P&L history and Kalshi categories. Server only.
//
// Kalshi history and categories come from the upstream's documented
// endpoints (spec DATA-05, DATA-06). Polymarket history comes from
// Polymarket's own documented Data API, because the source's endpoint for it
// is not in its public reference (D-012); its `trade_pnl` field is the series
// Polymarket's profile chart shows, and it ends on the same all-time figure
// the source prints.

import { z } from "zod";

import { fetchPolymarketJson, fetchUpstreamJson } from "@/upstream/client";

import { combineSeries, dayKey, sumDailyChanges, type SeriesPoint } from "./history";
import type { TraderProfile } from "./model";

const MS_PER_SECOND = 1000;
const SECONDS_PER_DAY = 86_400;

/**
 * Plausible range for a history timestamp. Both platforms started trading
 * after 2015; a value outside this range is a wrong unit or a broken record,
 * and would otherwise crash date formatting further down.
 */
const EARLIEST_HISTORY_MS = Date.UTC(2015, 0, 1);
const LATEST_HISTORY_MS = Date.UTC(2100, 0, 1);

const kalshiHistorySchema = z.object({
  history: z.array(
    z.object({
      timestamp: z.number().int().min(EARLIEST_HISTORY_MS).max(LATEST_HISTORY_MS),
      pnl: z.number(),
    }),
  ),
});

const polymarketPnlSchema = z.object({
  data: z.object({
    points: z.array(
      z.object({
        timestamp: z
          .number()
          .int()
          .min(EARLIEST_HISTORY_MS / MS_PER_SECOND)
          .max(LATEST_HISTORY_MS / MS_PER_SECOND),
        trade_pnl: z.number().nullish(),
      }),
    ),
  }),
});

const categoriesSchema = z.object({
  categories: z.array(
    z.object({ category: z.string().min(1), pnl: z.number(), markets: z.number().int().nonnegative() }),
  ),
});

export interface CategoryRow {
  category: string;
  pnl: number;
  markets: number;
}

export type HistoryResult =
  | {
      kind: "ready";
      /** All of the trader's series added up, for the chart. */
      series: SeriesPoint[];
      /** Each series' daily changes added up, for the month strip. */
      changes: Map<string, number>;
    }
  | { kind: "unsupported" }
  | { kind: "unavailable" };

export type CategoriesResult =
  | { kind: "ready"; rows: CategoryRow[] }
  | { kind: "none" }
  | { kind: "unavailable" };

const byTime = (a: SeriesPoint, b: SeriesPoint) => a.t - b.t;

export function parseKalshiHistory(input: unknown): SeriesPoint[] {
  const parsed = kalshiHistorySchema.safeParse(input);
  if (!parsed.success) throw new Error(`Kalshi history: ${z.prettifyError(parsed.error)}`);
  return parsed.data.history.map((point) => ({ t: point.timestamp, v: point.pnl })).sort(byTime);
}

/**
 * Points without a value are skipped: the API says not to read them as zero.
 *
 * A daily point stamped exactly 00:00 UTC is the total as that day begins,
 * which is the previous day's close, so it is moved back one millisecond into
 * that day. Assumption, checked against the API rather than the source's
 * calendar (docs/EVALS.md): with the move, the recorded trader's last day
 * comes to +$13,493 against the trader record's own 1-day P&L of +$13,142;
 * without it, +$2,987.
 */
export function parsePolymarketPnl(input: unknown): SeriesPoint[] {
  const parsed = polymarketPnlSchema.safeParse(input);
  if (!parsed.success) throw new Error(`Polymarket P&L: ${z.prettifyError(parsed.error)}`);
  return parsed.data.data.points
    .flatMap((point) => {
      if (point.trade_pnl == null) return [];
      const t = point.timestamp * MS_PER_SECOND;
      const startsDay = point.timestamp % SECONDS_PER_DAY === 0;
      return [{ t: startsDay ? t - 1 : t, v: point.trade_pnl }];
    })
    .sort(byTime);
}

/** Largest profit first, as on the source. */
export function parseCategories(input: unknown): CategoryRow[] {
  const parsed = categoriesSchema.safeParse(input);
  if (!parsed.success) throw new Error(`Kalshi categories: ${z.prettifyError(parsed.error)}`);
  return [...parsed.data.categories]
    .map((row) => ({ category: row.category, pnl: row.pnl, markets: row.markets }))
    .sort((a, b) => b.pnl - a.pnl);
}

async function kalshiHistory(username: string): Promise<SeriesPoint[]> {
  return parseKalshiHistory(
    await fetchUpstreamJson(`/api/kalshi/${encodeURIComponent(username)}/history`),
  );
}

async function polymarketHistory(wallet: string): Promise<SeriesPoint[]> {
  return parsePolymarketPnl(
    await fetchPolymarketJson(`/v2/user-pnl?user=${wallet}&interval=all&fidelity=1d`),
  );
}

/**
 * The cumulative P&L behind the month strip and the chart. A trader with
 * several wallets, or on both platforms, gets the sum of all of them.
 * "unsupported": no documented history for this trader (DEV-22).
 */
export async function getProfileHistory(profile: TraderProfile): Promise<HistoryResult> {
  const loads: Array<Promise<SeriesPoint[]>> = [];
  if (profile.platform === "kalshi" || profile.platform === "both") {
    if (profile.kalshiUsername) loads.push(kalshiHistory(profile.kalshiUsername));
  }
  if (profile.platform === "polymarket" || profile.platform === "both") {
    for (const wallet of profile.wallets) loads.push(polymarketHistory(wallet));
  }
  if (loads.length === 0) return { kind: "unsupported" };

  try {
    const parts = await Promise.all(loads);
    return { kind: "ready", series: combineSeries(parts), changes: sumDailyChanges(parts) };
  } catch (error) {
    console.error(`History for ${profile.id}: unavailable.`, error);
    return { kind: "unavailable" };
  }
}

/** PROF-05: Kalshi traders only. */
export async function getCategories(profile: TraderProfile): Promise<CategoriesResult> {
  if (!profile.kalshiUsername || profile.platform === "polymarket") return { kind: "none" };
  try {
    const body = await fetchUpstreamJson(
      `/api/kalshi/${encodeURIComponent(profile.kalshiUsername)}/categories`,
    );
    return { kind: "ready", rows: parseCategories(body) };
  } catch (error) {
    console.error(`Categories for ${profile.id}: unavailable.`, error);
    return { kind: "unavailable" };
  }
}

export interface ProfileExtras {
  history: HistoryResult;
  categories: CategoriesResult;
  /** The UTC day the data was loaded on; the calendar treats later days as future. */
  today: string;
}

/** Everything a profile page shows beyond the trader record, loaded together. */
export async function getProfileExtras(profile: TraderProfile): Promise<ProfileExtras> {
  const [history, categories] = await Promise.all([
    getProfileHistory(profile),
    getCategories(profile),
  ]);
  return { history, categories, today: dayKey(Date.now()) };
}
