// Filtering, searching and sorting. Pure functions: the view holds the state,
// these decide which rows it shows.

import {
  ESPORTS_SHARE_HIDE_THRESHOLD,
  MIN_DAILY_MOVE_USD,
  SPORTS_SHARE_HIDE_THRESHOLD,
  type LeaderboardPeriod,
  type LeaderboardQuery,
  type PlatformFilter,
  type SortKey,
  type SortState,
  type Trader,
} from "./model";

/** A trader linked on both platforms shows up under either filter. */
export function matchesPlatform(trader: Trader, filter: PlatformFilter): boolean {
  if (filter === "all") return true;
  if (trader.platform === "both") return filter === "polymarket" || filter === "kalshi";
  return trader.platform === filter;
}

function matchesSearch(trader: Trader, needle: string): boolean {
  return [trader.name, trader.wallet, trader.kalshiUsername].some(
    (field) => field?.toLowerCase().includes(needle) ?? false,
  );
}

const SORT_VALUE: Record<SortKey, (trader: Trader) => number | null> = {
  joined: (trader) => (trader.joinedAt ? Date.parse(trader.joinedAt) : null),
  score: (trader) => trader.score,
  sharpe: (trader) => trader.sharpe,
  winRate: (trader) => trader.winRate,
  roi: (trader) => trader.roi,
  pnl: (trader) => trader.pnl,
};

/** Missing values count as the lowest value, as on the source. */
function compareNullable(a: number | null, b: number | null): number {
  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;
  return a - b;
}

/** Default order is P&L, highest first. The sort is stable. */
export function sortTraders(traders: readonly Trader[], sort: SortState | null): Trader[] {
  const valueOf = SORT_VALUE[sort?.key ?? "pnl"];
  const factor = (sort?.direction ?? "desc") === "asc" ? 1 : -1;
  return [...traders].sort((a, b) => factor * compareNullable(valueOf(a), valueOf(b)));
}

/**
 * HOME-18. Clicking a column sorts it ascending first, then flips on every
 * further click. There is no way back to "unsorted" short of a reload.
 */
export function nextSort(current: SortState | null, key: SortKey): SortState {
  if (current?.key !== key) return { key, direction: "asc" };
  return { key, direction: current.direction === "asc" ? "desc" : "asc" };
}

/** Filters, searches and sorts one period's traders as the controls say. Pure: same input, same output. */
export function applyQuery(
  traders: readonly Trader[],
  query: LeaderboardQuery,
  period: LeaderboardPeriod,
): Trader[] {
  const needle = query.search.trim().toLowerCase();
  const dailyMoveFilter = period === "1d" && query.bigMoversOnly;

  const kept = traders.filter((trader) => {
    if (dailyMoveFilter && Math.abs(trader.pnl) < MIN_DAILY_MOVE_USD) return false;
    if (!matchesPlatform(trader, query.platform)) return false;
    if (query.linkedOnly && !trader.xUrl) return false;
    if (query.hideSports && (trader.sportsShare ?? 0) >= SPORTS_SHARE_HIDE_THRESHOLD) {
      return false;
    }
    // The source's tooltip for this toggle says it hides only esports traders
    // who have no X account, so a trader with one stays visible.
    if (query.hideEsports && !trader.xUrl && (trader.esportsShare ?? 0) >= ESPORTS_SHARE_HIDE_THRESHOLD) {
      return false;
    }
    return needle === "" || matchesSearch(trader, needle);
  });

  return sortTraders(kept, query.sort);
}
