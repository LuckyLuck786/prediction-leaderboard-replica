import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { nth } from "@/lib/test-utils";
import { UpstreamError, fetchPolymarketJson, fetchUpstreamJson } from "@/upstream/client";

import {
  getCategories,
  getProfileHistory,
  parseCategories,
  parseKalshiHistory,
  parsePolymarketPnl,
} from "./history-data";
import { makeProfile } from "./test-helpers";

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
  vi.restoreAllMocks();
  upstream.mockReset();
  polymarket.mockReset();
});

const WALLET_A = "0xec981ed70ae69c5cbcac08c1ba063e734f6bafcd";
const WALLET_B = "0x0000000000000000000000000000000000000001";
const DAY_MS = 86_400_000;
const NOV_1 = Date.UTC(2026, 10, 1);
/** Midday, so the midnight rule for Polymarket points does not apply. */
const NOV_1_NOON = NOV_1 + DAY_MS / 2;

describe("parseKalshiHistory (DATA-05)", () => {
  it("keeps time and value, sorted by time", () => {
    const body = {
      history: [
        { timestamp: NOV_1 + DAY_MS, pnl: 20, date: "2026-11-02" },
        { timestamp: NOV_1, pnl: 10, date: "2026-11-01" },
      ],
    };
    expect(parseKalshiHistory(body)).toEqual([
      { t: NOV_1, v: 10 },
      { t: NOV_1 + DAY_MS, v: 20 },
    ]);
  });

  it.each([
    ["no history field", {}],
    ["a text value", { history: [{ timestamp: NOV_1, pnl: "10" }] }],
    ["an infinite value", { history: [{ timestamp: NOV_1, pnl: Infinity }] }],
    ["a timestamp far outside any trading history", { history: [{ timestamp: 1e17, pnl: 1 }] }],
    ["a timestamp in seconds", { history: [{ timestamp: NOV_1 / 1000, pnl: 1 }] }],
  ])("refuses %s", (_label, body) => {
    expect(() => parseKalshiHistory(body)).toThrow(/Kalshi history/);
  });
});

describe("parsePolymarketPnl (D-035)", () => {
  it("turns seconds into milliseconds and skips points without a value", () => {
    const seconds = NOV_1_NOON / 1000;
    const body = {
      data: {
        points: [
          { timestamp: seconds + 86_400, trade_pnl: 5 },
          { timestamp: seconds, trade_pnl: 3 },
          { timestamp: seconds + 2 * 86_400, trade_pnl: null },
          { timestamp: seconds + 3 * 86_400 },
        ],
      },
    };
    expect(parsePolymarketPnl(body)).toEqual([
      { t: NOV_1_NOON, v: 3 },
      { t: NOV_1_NOON + DAY_MS, v: 5 },
    ]);
  });

  it("files a point stamped 00:00 UTC as the previous day's close (review finding)", () => {
    // Shape of the recorded trader's last three points.
    const body = {
      data: {
        points: [
          { timestamp: Date.UTC(2026, 10, 13) / 1000, trade_pnl: 932354.19 },
          { timestamp: Date.UTC(2026, 10, 14) / 1000, trade_pnl: 921848.83 },
          { timestamp: Date.UTC(2026, 10, 14, 17, 59, 16) / 1000, trade_pnl: 935341.48 },
        ],
      },
    };
    const series = parsePolymarketPnl(body);
    expect(series.map((point) => new Date(point.t).toISOString().slice(0, 10))).toEqual([
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
    ]);
    // The last day's change is the move since midnight: close to the trader
    // record's 1-day P&L (+$13,142), not +$2,987.
    expect(nth(series, 2).v - nth(series, 1).v).toBeCloseTo(13_492.65, 2);
  });

  it("refuses a timestamp sent in milliseconds instead of seconds", () => {
    const body = { data: { points: [{ timestamp: NOV_1, trade_pnl: 1 }] } };
    expect(() => parsePolymarketPnl(body)).toThrow(/Polymarket P&L/);
  });

  it("refuses a body without points", () => {
    expect(() => parsePolymarketPnl({ data: {} })).toThrow(/Polymarket P&L/);
  });
});

describe("parseCategories (DATA-06)", () => {
  it("orders by profit, largest first", () => {
    const body = {
      categories: [
        { category: "Sports", pnl: -1200, markets: 3 },
        { category: "Mentions", pnl: 323247.03, markets: 1859 },
        { category: "Elections", pnl: 271000, markets: 114 },
      ],
    };
    expect(parseCategories(body).map((row) => row.category)).toEqual(["Mentions", "Elections", "Sports"]);
  });

  it.each([
    ["an empty name", { categories: [{ category: "", pnl: 1, markets: 1 }] }],
    ["a negative market count", { categories: [{ category: "A", pnl: 1, markets: -1 }] }],
    ["a fractional market count", { categories: [{ category: "A", pnl: 1, markets: 1.5 }] }],
  ])("refuses %s", (_label, body) => {
    expect(() => parseCategories(body)).toThrow(/Kalshi categories/);
  });
});

describe("getProfileHistory", () => {
  it("reads Kalshi history for a Kalshi trader", async () => {
    upstream.mockResolvedValueOnce({ history: [{ timestamp: NOV_1, pnl: 7 }] });
    const result = await getProfileHistory(makeProfile({ kalshiUsername: "Some User" }));
    expect(result).toEqual({ kind: "ready", series: [{ t: NOV_1, v: 7 }], changes: new Map() });
    expect(upstream).toHaveBeenCalledWith("/api/kalshi/Some%20User/history");
    expect(polymarket).not.toHaveBeenCalled();
  });

  it("sums every wallet of a Polymarket trader", async () => {
    const seconds = NOV_1_NOON / 1000;
    const day = DAY_MS / 1000;
    polymarket
      .mockResolvedValueOnce({
        data: {
          points: [
            { timestamp: seconds, trade_pnl: 100 },
            { timestamp: seconds + day, trade_pnl: 130 },
          ],
        },
      })
      .mockResolvedValueOnce({ data: { points: [{ timestamp: seconds + day, trade_pnl: -40 }] } });
    const result = await getProfileHistory(
      makeProfile({ platform: "polymarket", wallet: WALLET_A, wallets: [WALLET_A, WALLET_B] }),
    );
    expect(result).toEqual({
      kind: "ready",
      series: [
        { t: NOV_1_NOON, v: 60 },
        { t: NOV_1_NOON + DAY_MS, v: 90 },
      ],
      // The second wallet starts on 2 Nov: its starting total is not a gain.
      changes: new Map([["2026-11-02", 30]]),
    });
    expect(polymarket).toHaveBeenCalledWith(`/v2/user-pnl?user=${WALLET_A}&interval=all&fidelity=1d`);
    expect(polymarket).toHaveBeenCalledTimes(2);
  });

  it("says unsupported when there is no documented history (DEV-22)", async () => {
    const result = await getProfileHistory(makeProfile({ platform: "hyperliquid" }));
    expect(result).toEqual({ kind: "unsupported" });
    expect(upstream).not.toHaveBeenCalled();
    expect(polymarket).not.toHaveBeenCalled();
  });

  it("degrades to unavailable, and logs, when a load fails", async () => {
    upstream.mockRejectedValueOnce(new UpstreamError("rate limited", 429));
    const result = await getProfileHistory(makeProfile({ kalshiUsername: "someone" }));
    expect(result).toEqual({ kind: "unavailable" });
    expect(console.error).toHaveBeenCalled();
  });

  it("degrades to unavailable when the body does not parse", async () => {
    upstream.mockResolvedValueOnce({ unexpected: true });
    const result = await getProfileHistory(makeProfile({ kalshiUsername: "someone" }));
    expect(result).toEqual({ kind: "unavailable" });
  });
});

describe("getCategories (PROF-05)", () => {
  it("is not requested for a Polymarket trader", async () => {
    const result = await getCategories(makeProfile({ platform: "polymarket", wallets: [WALLET_A] }));
    expect(result).toEqual({ kind: "none" });
    expect(upstream).not.toHaveBeenCalled();
  });

  it("reads the rows for a Kalshi trader", async () => {
    upstream.mockResolvedValueOnce({ categories: [{ category: "Mentions", pnl: 5, markets: 2 }] });
    const result = await getCategories(makeProfile({ kalshiUsername: "someone" }));
    expect(result).toEqual({
      kind: "ready",
      rows: [{ category: "Mentions", pnl: 5, markets: 2 }],
    });
  });

  it("degrades to unavailable when upstream fails", async () => {
    upstream.mockRejectedValueOnce(new UpstreamError("timed out", null));
    const result = await getCategories(makeProfile({ kalshiUsername: "someone" }));
    expect(result).toEqual({ kind: "unavailable" });
  });
});
