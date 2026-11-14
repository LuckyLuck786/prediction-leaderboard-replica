// Leaderboard domain model: the shapes and constants the rest of the feature
// builds on. Upstream objects are converted to `Trader` in `schema.ts`.

export const LEADERBOARD_PERIODS = ["1d", "30d", "ytd", "all"] as const;
export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];

export const DEFAULT_PERIOD: LeaderboardPeriod = "1d";

/** Order and labels of the period buttons, left to right. */
export const PERIOD_BUTTONS: ReadonlyArray<{
  period: LeaderboardPeriod;
  label: string;
}> = [
  { period: "all", label: "ALL" },
  { period: "ytd", label: "YTD" },
  { period: "30d", label: "1M" },
  { period: "1d", label: "1D" },
];

export const PLATFORMS = ["polymarket", "kalshi", "both", "hyperliquid"] as const;
export type Platform = (typeof PLATFORMS)[number];

/** Platforms a visitor can filter by. A `both` trader matches two of them. */
export const FILTERABLE_PLATFORMS = ["polymarket", "kalshi", "hyperliquid"] as const;
export type FilterablePlatform = (typeof FILTERABLE_PLATFORMS)[number];
export type PlatformFilter = FilterablePlatform | "all";

export const PLATFORM_NAMES: Record<FilterablePlatform, string> = {
  polymarket: "Polymarket",
  kalshi: "Kalshi",
  hyperliquid: "Hyperliquid",
};

export interface DayMover {
  label: string;
  change: number;
  iconUrl: string | null;
}

export interface Trader {
  /** Profile route segment: the wallet when there is one, else the Kalshi username. */
  id: string;
  name: string;
  platform: Platform;
  wallet: string | null;
  kalshiUsername: string | null;
  avatarUrl: string | null;
  xUrl: string | null;
  /** ISO timestamp, or null when upstream has no usable join date. */
  joinedAt: string | null;
  /** Profit and loss in US dollars for the selected period. */
  pnl: number;
  score: number | null;
  /** Share of days with a positive return, 0 to 1. */
  winRate: number | null;
  /** Sharpe ratio for the selected period. */
  sharpe: number | null;
  /** All-time P&L divided by total staked, as a fraction. */
  roi: number | null;
  sportsShare: number | null;
  esportsShare: number | null;
  dayMover: DayMover | null;
  polymarketUrl: string | null;
  hyperliquidUrl: string | null;
}

export interface Leaderboard {
  period: LeaderboardPeriod;
  /** ISO timestamp of the upstream data. */
  lastUpdated: string;
  traders: Trader[];
  /** Upstream entries dropped because they did not match the schema. */
  rejectedCount: number;
}

/** Sharpe column heading per period. Only the 1D heading was seen on the source. */
export const SHARPE_HEADINGS: Record<LeaderboardPeriod, string> = {
  "1d": "Sharpe 3D",
  "30d": "Sharpe 1M",
  ytd: "Sharpe",
  all: "Sharpe",
};

export const EXTRA_COLUMNS = ["sharpe", "winRate", "roi"] as const;
export type ExtraColumn = (typeof EXTRA_COLUMNS)[number];

/** Labels of the optional columns: the toggle chips and, for two of them, the headings. */
export const EXTRA_COLUMN_LABELS: Record<ExtraColumn, string> = {
  sharpe: "Sharpe",
  winRate: "Win%",
  roi: "ROI",
};

/** How the score is weighted, as published in the upstream API reference. */
export const SCORE_WEIGHTS = [
  { part: "consistency", percent: 25 },
  { part: "returns", percent: 25 },
  { part: "win rate", percent: 20 },
  { part: "worst loss", percent: 15 },
  { part: "profit factor", percent: 15 },
] as const;

export const SORT_KEYS = ["joined", "score", "sharpe", "winRate", "roi", "pnl"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export type SortDirection = "asc" | "desc";

export interface SortState {
  key: SortKey;
  direction: SortDirection;
}

export interface LeaderboardQuery {
  /** 1D only: hide traders whose day moved less than `MIN_DAILY_MOVE_USD`. */
  bigMoversOnly: boolean;
  platform: PlatformFilter;
  linkedOnly: boolean;
  hideSports: boolean;
  hideEsports: boolean;
  search: string;
  /** null means the default order: P&L, highest first. */
  sort: SortState | null;
}

export const DEFAULT_QUERY: LeaderboardQuery = {
  bigMoversOnly: true,
  platform: "all",
  linkedOnly: false,
  hideSports: true,
  hideEsports: true,
  search: "",
  sort: null,
};

export const MIN_DAILY_MOVE_USD = 5;
/** Upstream documents that traders at or above this sports share are hidden by default. */
export const SPORTS_SHARE_HIDE_THRESHOLD = 0.5;
/** Not documented upstream. Assumed to mirror the sports threshold. */
export const ESPORTS_SHARE_HIDE_THRESHOLD = 0.5;
export const PAGE_SIZE = 30;
