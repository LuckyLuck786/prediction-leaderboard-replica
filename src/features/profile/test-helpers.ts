// Test data for the profile feature.

import type { TraderProfile } from "./model";

/** A profile with nothing known beyond its id; tests set what they need. */
export function makeProfile(overrides: Partial<TraderProfile> = {}): TraderProfile {
  return {
    id: "someone",
    name: "someone",
    platform: "kalshi",
    wallet: null,
    wallets: [],
    kalshiUsername: null,
    avatarUrl: null,
    xUrl: null,
    joined: null,
    views: null,
    pnl: { "1d": null, "7d": null, "30d": null, all: null },
    score: null,
    polymarketUrl: null,
    kalshiUrl: null,
    hyperliquidUrl: null,
    ...overrides,
  };
}
