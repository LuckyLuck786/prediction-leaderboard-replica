import { describe, expect, it } from "vitest";

import source from "@/upstream/source.json";

import { LEADERBOARD_PERIODS } from "./model";
import { parseLeaderboard } from "./schema";
import { loadSnapshot } from "./snapshot";

const validTrader = {
  rank: 1,
  name: "Someone",
  platform: "polymarket",
  wallet: "0x6d3c5bd13984b2de47c3a88ddc455309aab3d294",
  kalshi_username: null,
  pfp: "https://example.com/avatar.png",
  twitter: "https://x.com/someone?ref=abc",
  join_date: "2025-11-05",
  stats: { pnl: 63513.577559, buys: 0, sells: 0 },
  smart_score: { score: 75.2, winRate: 0.685, sharpeRatio: 1.15, sharpe1d: 0.37, sharpe1m: -0.12 },
  roi: 0.2,
  sports_share: 1,
  polymarket_profile:
    "https://polymarket.com/profile/0x6d3c5bd13984b2de47c3a88ddc455309aab3d294?via=someone",
};

const response = (traders: unknown[]) => ({
  lastUpdated: "2026-11-13T19:38:16.611Z",
  traders,
});

describe("parseLeaderboard", () => {
  it("converts a valid trader", () => {
    const result = parseLeaderboard(response([validTrader]), "1d");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.leaderboard.rejectedCount).toBe(0);
    expect(result.leaderboard.traders[0]).toMatchObject({
      id: validTrader.wallet,
      name: "Someone",
      pnl: 63513.577559,
      score: 75.2,
      joinedAt: "2025-11-05T00:00:00.000Z",
      avatarUrl: "https://example.com/avatar.png",
    });
  });

  it("picks the Sharpe figure that belongs to the period", () => {
    const sharpeFor = (period: (typeof LEADERBOARD_PERIODS)[number]) => {
      const result = parseLeaderboard(response([validTrader]), period);
      return result.ok ? result.leaderboard.traders[0].sharpe : undefined;
    };
    expect(sharpeFor("1d")).toBe(0.37);
    expect(sharpeFor("30d")).toBe(-0.12);
    expect(sharpeFor("all")).toBe(1.15);
  });

  it("strips referral and tracking parameters from outbound links (DEV-05)", () => {
    const result = parseLeaderboard(response([validTrader]), "1d");
    if (!result.ok) throw new Error(result.error);
    const [trader] = result.leaderboard.traders;
    expect(trader.polymarketUrl).toBe(
      "https://polymarket.com/profile/0x6d3c5bd13984b2de47c3a88ddc455309aab3d294",
    );
    expect(trader.xUrl).toBe("https://x.com/someone");
  });

  it("treats empty strings and missing fields as absent (DATA-08)", () => {
    const sparse = {
      name: "Sparse",
      platform: "kalshi",
      wallet: null,
      kalshi_username: "sparse",
      pfp: "",
      twitter: "",
      join_date: null,
      stats: { pnl: -3 },
      smart_score: null,
    };
    const result = parseLeaderboard(response([sparse]), "1d");
    if (!result.ok) throw new Error(result.error);
    expect(result.leaderboard.traders[0]).toMatchObject({
      id: "sparse",
      avatarUrl: null,
      xUrl: null,
      joinedAt: null,
      score: null,
      sharpe: null,
      roi: null,
      dayMover: null,
    });
  });

  it("never passes on a link that is not https", () => {
    const hostile = {
      ...validTrader,
      pfp: "javascript:alert(1)",
      twitter: "http://x.com/someone",
      polymarket_profile: "data:text/html,hi",
    };
    const result = parseLeaderboard(response([hostile]), "1d");
    if (!result.ok) throw new Error(result.error);
    expect(result.leaderboard.traders[0]).toMatchObject({
      avatarUrl: null,
      xUrl: null,
      polymarketUrl: null,
    });
  });

  it("drops and counts traders that do not match, keeping the rest", () => {
    const broken = [
      { ...validTrader, stats: { pnl: "lots" } },
      { ...validTrader, platform: "somewhere-new" },
      { ...validTrader, wallet: "", kalshi_username: "" },
      "not an object",
    ];
    const result = parseLeaderboard(response([validTrader, ...broken]), "1d");
    if (!result.ok) throw new Error(result.error);
    expect(result.leaderboard.traders).toHaveLength(1);
    expect(result.leaderboard.rejectedCount).toBe(4);
  });

  it("fails when no trader survives", () => {
    const result = parseLeaderboard(response([{ nope: true }]), "1d");
    expect(result.ok).toBe(false);
  });

  it("accepts an empty list", () => {
    const result = parseLeaderboard(response([]), "1d");
    expect(result.ok).toBe(true);
  });

  it.each([
    ["null", null],
    ["a string", "<html>rate limited</html>"],
    ["missing traders", { lastUpdated: "2026-11-13T19:38:16.611Z" }],
    ["traders not a list", { lastUpdated: "2026-11-13T19:38:16.611Z", traders: {} }],
    ["bad timestamp", { lastUpdated: "yesterday-ish", traders: [] }],
  ])("fails without throwing on %s", (_label, input) => {
    const result = parseLeaderboard(input, "1d");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
  });
});

describe("saved snapshot", () => {
  const snapshot = loadSnapshot();

  it("covers every period with nothing rejected", () => {
    for (const period of LEADERBOARD_PERIODS) {
      const board = snapshot.boards[period];
      expect(board.traders.length, period).toBeGreaterThan(0);
      expect(board.rejectedCount, period).toBe(0);
    }
  });

  it("carries no referral parameters in outbound links", () => {
    for (const period of LEADERBOARD_PERIODS) {
      for (const trader of snapshot.boards[period].traders) {
        for (const link of [trader.xUrl, trader.polymarketUrl, trader.hyperliquidUrl]) {
          if (link) expect(new URL(link).search, link).toBe("");
        }
      }
    }
  });

  it("includes losses, so negative formatting is exercised", () => {
    expect(snapshot.boards["1d"].traders.some((trader) => trader.pnl < 0)).toBe(true);
  });
});

describe("upstream config", () => {
  it("lists the same periods as the model", () => {
    expect(source.leaderboardPeriods).toEqual([...LEADERBOARD_PERIODS]);
  });
});
