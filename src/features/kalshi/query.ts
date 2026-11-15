import { KALSHI_SPORTS_SHARE_LIMIT, type KalshiQuery, type KalshiTrader } from "./model";

/**
 * Search by display name or username, and optionally keep only traders who
 * make most of their profit outside sports. Upstream order (rank) is kept.
 *
 * The source asks its server for the non-sports list. That parameter is not
 * in the public API reference (D-012), so the same rule runs here on the
 * fetched top 1,000; a trader with no sports figure counts as non-sports.
 */
export function applyKalshiQuery(traders: readonly KalshiTrader[], query: KalshiQuery): KalshiTrader[] {
  const needle = query.search.trim().toLowerCase();
  return traders.filter((trader) => {
    if (query.nonSportsOnly && (trader.sportsShare ?? 0) >= KALSHI_SPORTS_SHARE_LIMIT) return false;
    if (needle === "") return true;
    return trader.name.toLowerCase().includes(needle) || trader.username.toLowerCase().includes(needle);
  });
}
