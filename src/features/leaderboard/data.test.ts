import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UpstreamError, fetchUpstreamJson } from "@/upstream/client";

import { getBoard, getDailyProfit } from "./data";
import { loadSnapshot } from "./snapshot";

vi.mock("@/upstream/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/upstream/client")>();
  return { ...actual, fetchUpstreamJson: vi.fn() };
});

const upstream = vi.mocked(fetchUpstreamJson);

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  upstream.mockReset();
});

const liveTrader = {
  name: "Live trader",
  platform: "kalshi",
  wallet: null,
  kalshi_username: "live.trader",
  stats: { pnl: 1234.5 },
};

describe("getBoard", () => {
  it("returns live data when upstream answers with a valid board", async () => {
    upstream.mockResolvedValue({ lastUpdated: "2026-11-14T10:00:00.000Z", traders: [liveTrader] });
    const result = await getBoard("30d");
    expect(upstream).toHaveBeenCalledWith("/api/leaderboard?period=30d");
    expect(result.source).toEqual({ kind: "live" });
    expect(result.board.traders.map((trader) => trader.id)).toEqual(["live.trader"]);
  });

  it("falls back to the labelled snapshot when upstream fails, and logs why", async () => {
    upstream.mockRejectedValue(new UpstreamError("/api/leaderboard answered 429", 429));
    const result = await getBoard("all");
    const snapshot = loadSnapshot();
    expect(result.source).toEqual({
      kind: "snapshot",
      capturedAt: snapshot.capturedAt,
      upstreamTotal: snapshot.upstreamTotals.all,
    });
    expect(result.board.traders).toHaveLength(snapshot.boards.all.traders.length);
    expect(console.error).toHaveBeenCalledOnce();
  });

  it("falls back when upstream answers with the wrong shape", async () => {
    upstream.mockResolvedValue({ unexpected: true });
    expect((await getBoard("1d")).source.kind).toBe("snapshot");
  });
});

describe("getDailyProfit", () => {
  it("returns the raw dollar amount", async () => {
    upstream.mockResolvedValue({ daily_profit: "+$403,821", raw: 403821, traders_count: 800 });
    await expect(getDailyProfit()).resolves.toBe(403821);
  });

  it("returns null rather than a stale figure when upstream fails", async () => {
    upstream.mockRejectedValue(new UpstreamError("timeout", null));
    await expect(getDailyProfit()).resolves.toBeNull();
    expect(console.error).toHaveBeenCalledOnce();
  });
});
