// The platforms a trader can be on, shared by every page that lists traders.

/** Platforms a trader can be listed under, as upstream names them. */
export const PLATFORMS = ["polymarket", "kalshi", "both", "hyperliquid"] as const;
export type Platform = (typeof PLATFORMS)[number];

/** Platforms a visitor can filter by. A `both` trader matches two of them. */
export const FILTERABLE_PLATFORMS = ["polymarket", "kalshi", "hyperliquid"] as const;
export type FilterablePlatform = (typeof FILTERABLE_PLATFORMS)[number];

/** Display names of the platforms. */
export const PLATFORM_NAMES: Record<FilterablePlatform, string> = {
  polymarket: "Polymarket",
  kalshi: "Kalshi",
  hyperliquid: "Hyperliquid",
};
