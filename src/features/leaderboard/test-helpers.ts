// Builders for tests. Not imported by application code.

import { type Leaderboard, type LeaderboardPeriod, type Trader } from "./model";

/** A trader for tests, with defaults for every field not given. */
export function makeTrader(overrides: Partial<Trader> & Pick<Trader, "id">): Trader {
  return {
    profileId: overrides.id,
    name: overrides.id,
    platform: "polymarket",
    wallet: null,
    kalshiUsername: null,
    avatarUrl: null,
    xUrl: "https://x.com/someone",
    joinedAt: "2025-01-01T00:00:00.000Z",
    pnl: 100,
    score: 50,
    winRate: 0.5,
    sharpe: 1,
    roi: 0.1,
    sportsShare: 0,
    esportsShare: 0,
    dayMover: null,
    polymarketUrl: null,
    hyperliquidUrl: null,
    ...overrides,
  };
}

/** A one-period board for tests. */
export function makeBoard(period: LeaderboardPeriod, traders: Trader[]): Leaderboard {
  return { period, lastUpdated: "2026-11-13T19:38:16.611Z", traders, rejectedCount: 0 };
}
