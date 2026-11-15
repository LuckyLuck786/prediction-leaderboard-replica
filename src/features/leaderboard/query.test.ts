import { describe, expect, it } from "vitest";

import { DEFAULT_QUERY, type LeaderboardQuery, type Trader } from "./model";
import { applyQuery, matchesPlatform, nextSort, sortTraders } from "./query";
import { makeTrader } from "./test-helpers";

const trader = makeTrader;

const query = (overrides: Partial<LeaderboardQuery> = {}): LeaderboardQuery => ({
  ...DEFAULT_QUERY,
  ...overrides,
});

const ids = (traders: Trader[]) => traders.map((entry) => entry.id);

describe("matchesPlatform (HOME-06)", () => {
  it("lets a linked trader match both of their platforms, not the third", () => {
    const linked = trader({ id: "a", platform: "both" });
    expect(matchesPlatform(linked, "polymarket")).toBe(true);
    expect(matchesPlatform(linked, "kalshi")).toBe(true);
    expect(matchesPlatform(linked, "hyperliquid")).toBe(false);
    expect(matchesPlatform(linked, "all")).toBe(true);
  });

  it("matches single-platform traders exactly", () => {
    expect(matchesPlatform(trader({ id: "a", platform: "kalshi" }), "kalshi")).toBe(true);
    expect(matchesPlatform(trader({ id: "a", platform: "kalshi" }), "polymarket")).toBe(false);
  });
});

describe("applyQuery filters", () => {
  it("hides small daily moves in 1D only (HOME-05)", () => {
    const traders = [
      trader({ id: "big", pnl: 5 }),
      trader({ id: "small", pnl: 4.99 }),
      trader({ id: "small-loss", pnl: -4.99 }),
      trader({ id: "big-loss", pnl: -5 }),
    ];
    expect(ids(applyQuery(traders, query(), "1d"))).toEqual(["big", "big-loss"]);
    expect(applyQuery(traders, query(), "30d")).toHaveLength(4);
    expect(applyQuery(traders, query({ bigMoversOnly: false }), "1d")).toHaveLength(4);
  });

  it("keeps only traders with an X account when asked (HOME-07)", () => {
    const traders = [trader({ id: "on-x" }), trader({ id: "not-on-x", xUrl: null })];
    expect(ids(applyQuery(traders, query({ linkedOnly: true }), "all"))).toEqual(["on-x"]);
  });

  it("hides traders at or above the sports threshold (HOME-08)", () => {
    const traders = [
      trader({ id: "below", sportsShare: 0.49 }),
      trader({ id: "at", sportsShare: 0.5 }),
      trader({ id: "unknown", sportsShare: null }),
    ];
    expect(ids(applyQuery(traders, query(), "all"))).toEqual(["below", "unknown"]);
    expect(applyQuery(traders, query({ hideSports: false }), "all")).toHaveLength(3);
  });

  it("hides esports traders only when they have no X account (HOME-09)", () => {
    const traders = [
      trader({ id: "esports-on-x", esportsShare: 0.9 }),
      trader({ id: "esports-anon", esportsShare: 0.9, xUrl: null }),
    ];
    expect(ids(applyQuery(traders, query(), "all"))).toEqual(["esports-on-x"]);
    expect(applyQuery(traders, query({ hideEsports: false }), "all")).toHaveLength(2);
  });

  it("searches name, wallet and Kalshi username, ignoring case (HOME-20)", () => {
    const traders = [
      trader({ id: "a", name: "ProbabilityDuck" }),
      trader({ id: "b", name: "Anjun", wallet: "0x43372356634781eea88d61bbdd7824cdce958882" }),
      trader({ id: "c", name: "Display", kalshiUsername: "duckling" }),
      trader({ id: "d", name: "Nobody" }),
    ];
    expect(ids(applyQuery(traders, query({ search: "  DUCK " }), "all"))).toEqual(["a", "c"]);
    expect(ids(applyQuery(traders, query({ search: "0x43" }), "all"))).toEqual(["b"]);
    expect(applyQuery(traders, query({ search: "zzzz" }), "all")).toEqual([]);
  });
});

describe("sorting (HOME-18)", () => {
  const traders = [
    trader({ id: "mid", pnl: 10, score: 60 }),
    trader({ id: "top", pnl: 30, score: null }),
    trader({ id: "low", pnl: -5, score: 90 }),
  ];

  it("defaults to P&L, highest first", () => {
    expect(ids(sortTraders(traders, null))).toEqual(["top", "mid", "low"]);
  });

  it("sorts ascending and descending on request", () => {
    expect(ids(sortTraders(traders, { key: "pnl", direction: "asc" }))).toEqual(["low", "mid", "top"]);
  });

  it("treats a missing value as the lowest", () => {
    expect(ids(sortTraders(traders, { key: "score", direction: "asc" }))).toEqual(["top", "mid", "low"]);
    expect(ids(sortTraders(traders, { key: "score", direction: "desc" }))).toEqual(["low", "mid", "top"]);
  });

  it("puts the earliest join date first when ascending", () => {
    const byJoin = [
      trader({ id: "new", joinedAt: "2026-11-01T00:00:00.000Z" }),
      trader({ id: "old", joinedAt: "2020-01-01T00:00:00.000Z" }),
    ];
    expect(ids(sortTraders(byJoin, { key: "joined", direction: "asc" }))).toEqual(["old", "new"]);
  });

  it("keeps the incoming order for equal values", () => {
    const tied = [trader({ id: "first", pnl: 1 }), trader({ id: "second", pnl: 1 })];
    expect(ids(sortTraders(tied, null))).toEqual(["first", "second"]);
  });

  it("does not change the input array", () => {
    const before = ids(traders);
    sortTraders(traders, { key: "pnl", direction: "asc" });
    expect(ids(traders)).toEqual(before);
  });
});

describe("nextSort (HOME-18)", () => {
  it("starts ascending, then keeps flipping", () => {
    const first = nextSort(null, "pnl");
    expect(first).toEqual({ key: "pnl", direction: "asc" });
    const second = nextSort(first, "pnl");
    expect(second).toEqual({ key: "pnl", direction: "desc" });
    expect(nextSort(second, "pnl")).toEqual({ key: "pnl", direction: "asc" });
  });

  it("starts ascending again on a different column", () => {
    expect(nextSort({ key: "pnl", direction: "desc" }, "score")).toEqual({
      key: "score",
      direction: "asc",
    });
  });
});
