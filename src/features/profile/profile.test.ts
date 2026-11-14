import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UpstreamError, fetchUpstreamJson } from "@/upstream/client";

import { getProfile } from "./data";
import { isProfileId } from "./model";
import { parseProfile } from "./schema";

vi.mock("@/upstream/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/upstream/client")>();
  return { ...actual, fetchUpstreamJson: vi.fn() };
});

const upstream = vi.mocked(fetchUpstreamJson);

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  upstream.mockReset();
});

// Shape recorded from GET /api/trader/ProbabilityDuck on 2026-11-14.
const kalshiTrader = {
  trader: {
    name: "ProbabilityDuck",
    platform: "kalshi",
    wallet: null,
    kalshi_username: "ProbabilityDuck",
    pfp: "https://pbs.twimg.com/profile_images/1/a_400x400.jpg",
    twitter: "https://x.com/theduckguesses",
    join_date: "Nov 2024",
    views: 3000,
    kalshi_profile: "https://kalshi.com/ideas/profiles/ProbabilityDuck",
    polymarket_profile: null,
    smart_score: {
      score: 79.6,
      tier: "Great",
      winRate: 0.489,
      sharpeRatio: 3.41,
      maxDrawdownPercent: 0.086,
      profitFactor: 1.96,
      rSquared: 0.9588,
    },
    stats: {
      "1d": { pnl: 2687.64, buys: 0, sells: 0 },
      "7d": { pnl: 8544.4 },
      "30d": { pnl: 212749.25 },
      all: { pnl: 1104963.42 },
    },
  },
};

describe("parseProfile (DATA-04)", () => {
  it("maps the recorded Kalshi shape", () => {
    const result = parseProfile(kalshiTrader, "ProbabilityDuck");
    if (!result.ok) throw new Error(result.error);
    expect(result.profile).toMatchObject({
      name: "ProbabilityDuck",
      joined: "Nov 2024",
      views: 3000,
      pnl: { "1d": 2687.64, "7d": 8544.4, "30d": 212749.25, all: 1104963.42 },
      score: { score: 79.6, tier: "Great", maxDrawdown: 0.086 },
      kalshiUrl: "https://kalshi.com/ideas/profiles/ProbabilityDuck",
    });
  });

  it("turns an ISO join date into month and year, and tolerates missing parts", () => {
    const result = parseProfile(
      {
        trader: {
          name: "elucidate",
          platform: "polymarket",
          wallet: "0xec981ed70ae69c5cbcac08c1ba063e734f6bafcd",
          join_date: "2024-08-12T12:36:11.301563Z",
          stats: { all: { pnl: 922199.66 } },
          smart_score: null,
          polymarket_profile: "https://polymarket.com/profile/0xec98?via=someone",
        },
      },
      "0xec981ed70ae69c5cbcac08c1ba063e734f6bafcd",
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.profile).toMatchObject({
      joined: "Aug 2024",
      views: null,
      score: null,
      pnl: { "1d": null, all: 922199.66 },
      polymarketUrl: "https://polymarket.com/profile/0xec98",
    });
  });

  it("keeps the profile when the score is missing, and drops only the score card (DATA-08)", () => {
    const result = parseProfile(
      { trader: { ...kalshiTrader.trader, smart_score: { score: null, tier: null } } },
      "ProbabilityDuck",
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.profile.score).toBeNull();
    expect(result.profile.name).toBe("ProbabilityDuck");
  });

  it("keeps the score without a tier", () => {
    const result = parseProfile(
      { trader: { ...kalshiTrader.trader, smart_score: { score: 70, tier: "" } } },
      "ProbabilityDuck",
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.profile.score).toMatchObject({ score: 70, tier: null });
  });

  it("resolves a relative picture against the upstream origin, like the boards do", () => {
    const result = parseProfile(
      { trader: { ...kalshiTrader.trader, pfp: "/api/kalshi-avatar/ProbabilityDuck" } },
      "ProbabilityDuck",
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.profile.avatarUrl).toMatch(/^https:\/\/.+\/api\/kalshi-avatar\/ProbabilityDuck$/);
  });

  it("rejects a body without a trader", () => {
    expect(parseProfile({ error: "nope" }, "x").ok).toBe(false);
  });
});

describe("isProfileId", () => {
  it.each([
    ["0xec981ed70ae69c5cbcac08c1ba063e734f6bafcd", true],
    ["ProbabilityDuck", true],
    ["genetic.silkworm8197", true],
    ["../../etc/passwd", false],
    ["a b", false],
    ["", false],
    [".", false], // would turn /api/trader/. into another upstream path
    ["..", false],
    ["...", false],
    ["user.x", true],
  ])("%s -> %s", (id, expected) => {
    expect(isProfileId(id)).toBe(expected);
  });
});

describe("getProfile", () => {
  it("returns the profile and asks upstream with an encoded id", async () => {
    upstream.mockResolvedValue(kalshiTrader);
    const result = await getProfile("ProbabilityDuck");
    expect(result.kind).toBe("found");
    expect(upstream).toHaveBeenCalledWith("/api/trader/ProbabilityDuck");
  });

  it("is not found for an upstream 404, without logging an error", async () => {
    upstream.mockRejectedValue(new UpstreamError("gone", 404));
    await expect(getProfile("nobody")).resolves.toEqual({ kind: "not-found" });
    expect(console.error).not.toHaveBeenCalled();
  });

  it("is not found for an id that cannot exist, without asking upstream", async () => {
    await expect(getProfile("../secret")).resolves.toEqual({ kind: "not-found" });
    expect(upstream).not.toHaveBeenCalled();
  });

  it("is unavailable, and logged, for any other failure", async () => {
    upstream.mockRejectedValue(new UpstreamError("busy", 429));
    await expect(getProfile("ProbabilityDuck")).resolves.toEqual({ kind: "unavailable" });
    expect(console.error).toHaveBeenCalledOnce();
  });
});
