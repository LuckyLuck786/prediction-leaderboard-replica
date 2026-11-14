// Kalshi board model (spec 4.3, KAL-01 to KAL-08).

export const KALSHI_PERIODS = ["all", "30d", "7d", "1d"] as const;
export type KalshiPeriod = (typeof KALSHI_PERIODS)[number];

export const DEFAULT_KALSHI_PERIOD: KalshiPeriod = "all";

/** Order and labels of the period buttons, left to right. */
export const KALSHI_PERIOD_BUTTONS: ReadonlyArray<{ period: KalshiPeriod; label: string }> = [
  { period: "all", label: "ALL" },
  { period: "30d", label: "1M" },
  { period: "7d", label: "7D" },
  { period: "1d", label: "1D" },
];

/** How many traders the board asks upstream for: its top 1,000. */
export const KALSHI_BOARD_LIMIT = 1000;
/** KAL-06: rows per "Show more". */
export const KALSHI_PAGE_SIZE = 100;
/** Same rule as the home board's sports filter. */
export const KALSHI_SPORTS_SHARE_LIMIT = 0.5;

export interface KalshiTrader {
  /** Position on the upstream board for the period; kept while searching (KAL-05). */
  rank: number;
  username: string;
  name: string;
  avatarUrl: string | null;
  /** Profit for the selected period, in dollars. */
  pnl: number;
  /** Set when the trader has a local profile page (KAL-04). */
  profileId: string | null;
  /** The trader's public Kalshi page, without tracking parameters. */
  kalshiUrl: string | null;
  xHandle: string | null;
  sportsShare: number | null;
}

export interface KalshiBoard {
  period: KalshiPeriod;
  lastUpdated: string;
  traders: KalshiTrader[];
  rejectedCount: number;
}

export interface KalshiQuery {
  search: string;
  nonSportsOnly: boolean;
}

export const DEFAULT_KALSHI_QUERY: KalshiQuery = { search: "", nonSportsOnly: false };
