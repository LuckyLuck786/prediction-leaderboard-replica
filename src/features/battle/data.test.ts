import { PHASE_PRODUCTION_BUILD } from "next/constants";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UpstreamError, fetchPolymarketJson, fetchUpstreamJson } from "@/upstream/client";

import { BATTLE_PAIR, BattleUnavailableError, getBattle } from "./data";

vi.mock("@/upstream/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/upstream/client")>();
  return { ...actual, fetchUpstreamJson: vi.fn(), fetchPolymarketJson: vi.fn() };
});

const upstream = vi.mocked(fetchUpstreamJson);
const polymarket = vi.mocked(fetchPolymarketJson);

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  upstream.mockReset();
  polymarket.mockReset();
});

const NOON = Date.UTC(2026, 10, 1, 12);
const DAY_MS = 86_400_000;

const records: Record<string, unknown> = {
  [`/api/trader/${BATTLE_PAIR.polymarket}`]: {
    trader: { name: "25usdc", platform: "polymarket", wallet: BATTLE_PAIR.polymarket },
  },
  [`/api/trader/${BATTLE_PAIR.kalshi}`]: {
    trader: { name: "PredMTrader", platform: "kalshi", kalshi_username: BATTLE_PAIR.kalshi },
  },
  [`/api/kalshi/${BATTLE_PAIR.kalshi}/history`]: {
    history: [
      { timestamp: NOON, pnl: 100 },
      { timestamp: NOON + DAY_MS, pnl: 160 },
    ],
  },
};

function answerUpstream() {
  upstream.mockImplementation(async (path: string) => {
    if (path in records) return records[path];
    throw new UpstreamError("not found", 404);
  });
}

const polymarketSeries = {
  data: {
    points: [
      { timestamp: NOON / 1000 - 86_400, trade_pnl: 1 },
      { timestamp: NOON / 1000, trade_pnl: 10 },
      { timestamp: NOON / 1000 + 86_400, trade_pnl: 4 },
    ],
  },
};

describe("getBattle (BATTLE-01 to BATTLE-04)", () => {
  it("loads both traders and both lines from the documented endpoints", async () => {
    answerUpstream();
    polymarket.mockResolvedValueOnce(polymarketSeries);

    const battle = await getBattle();

    expect(battle.sides.map((side) => [side.platform, side.profile?.name])).toEqual([
      ["polymarket", "25usdc"],
      ["kalshi", "PredMTrader"],
    ]);
    expect(battle.comparison?.start).toBe(NOON);
    expect(battle.comparison?.kalshi.map((point) => point.v)).toEqual([0, 60]);
    expect(battle.comparison?.polymarket.map((point) => point.v)).toEqual([0, -6]);
    expect(polymarket).toHaveBeenCalledWith(
      `/v2/user-pnl?user=${BATTLE_PAIR.polymarket}&interval=all&fidelity=1d`,
    );
  });

  it("during a build, keeps the page when a trader record fails, showing that side by its id", async () => {
    vi.stubEnv("NEXT_PHASE", PHASE_PRODUCTION_BUILD);
    answerUpstream();
    upstream.mockImplementation(async (path: string) => {
      if (path === `/api/trader/${BATTLE_PAIR.kalshi}`) throw new UpstreamError("rate limited", 429);
      if (path in records) return records[path];
      throw new UpstreamError("not found", 404);
    });
    polymarket.mockResolvedValueOnce(polymarketSeries);

    const battle = await getBattle();

    expect(battle.sides[1]).toEqual({ platform: "kalshi", id: BATTLE_PAIR.kalshi, profile: null });
    expect(battle.comparison).not.toBeNull();
  });

  it("during a build, drops only the chart when a history fails, and logs it", async () => {
    vi.stubEnv("NEXT_PHASE", PHASE_PRODUCTION_BUILD);
    answerUpstream();
    polymarket.mockRejectedValueOnce(new UpstreamError("timed out", null));

    const battle = await getBattle();

    expect(battle.comparison).toBeNull();
    expect(battle.sides[0].profile?.name).toBe("25usdc");
    expect(console.error).toHaveBeenCalledWith("Head-to-head histories: unavailable.", expect.anything());
  });
});

describe("getBattle outside a build (review finding)", () => {
  it("throws when anything is missing, so the last complete page stays served", async () => {
    answerUpstream();
    polymarket.mockRejectedValueOnce(new UpstreamError("rate limited", 429));
    await expect(getBattle()).rejects.toBeInstanceOf(BattleUnavailableError);
  });
});
