import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UpstreamError, fetchUpstreamJson } from "@/upstream/client";
import source from "@/upstream/source.json";

import { getKalshiBoard, loadKalshiSnapshot } from "./data";
import { KALSHI_BOARD_LIMIT, KALSHI_PERIODS, type KalshiTrader } from "./model";
import { applyKalshiQuery } from "./query";
import { parseKalshiBoard } from "./schema";

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

const raw = (overrides: Record<string, unknown> = {}) => ({
  rank: 1,
  kalshi_username: "final.lamb3899",
  name: "final.lamb3899",
  pfp: "/api/kalshi-avatar/final.lamb3899",
  pnl: 7943912,
  pnl_all: 7943912,
  kalshi_url: "https://kalshi.com/ideas/profiles/final.lamb3899?referral=x",
  profile_path: null,
  x_handle: null,
  sports_share: 1,
  ...overrides,
});
const envelope = (traders: unknown[]) => ({ lastUpdated: "2026-11-14T15:56:06.009Z", traders });

describe("parseKalshiBoard (DATA-03)", () => {
  it("resolves relative pictures against the upstream origin and strips tracking", () => {
    const result = parseKalshiBoard(envelope([raw()]), "all");
    if (!result.ok) throw new Error(result.error);
    expect(result.board.traders[0]).toMatchObject({
      rank: 1,
      username: "final.lamb3899",
      avatarUrl: `${source.origin}/api/kalshi-avatar/final.lamb3899`,
      kalshiUrl: "https://kalshi.com/ideas/profiles/final.lamb3899",
      profileId: null,
    });
  });

  it("links to a local profile only for the exact path upstream uses (KAL-04)", () => {
    const result = parseKalshiBoard(
      envelope([
        raw({ kalshi_username: "dogname", profile_path: "/account/dogname" }),
        raw({ kalshi_username: "other", profile_path: "/account/someone-else" }),
        raw({ kalshi_username: "third", profile_path: "https://evil.example/x" }),
        // Our profile route would 404 on this username, so no local link.
        raw({ kalshi_username: "has space", profile_path: "/account/has space" }),
      ]),
      "all",
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.board.traders.map((trader) => trader.profileId)).toEqual(["dogname", null, null, null]);
  });

  it("keeps only plausible X handles", () => {
    const result = parseKalshiBoard(
      envelope([
        raw({ kalshi_username: "a", x_handle: "bananafish_bets" }),
        raw({ kalshi_username: "b", x_handle: "not a handle<script>" }),
      ]),
      "all",
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.board.traders.map((trader) => trader.xHandle)).toEqual(["bananafish_bets", null]);
  });

  it("drops and counts bad and repeated entries, and fails when none survive", () => {
    const result = parseKalshiBoard(envelope([raw(), raw(), raw({ pnl: "lots" }), "x"]), "all");
    if (!result.ok) throw new Error(result.error);
    expect(result.board.traders).toHaveLength(1);
    expect(result.board.rejectedCount).toBe(3);
    expect(parseKalshiBoard(envelope([{ nope: 1 }]), "all").ok).toBe(false);
    expect(parseKalshiBoard({ traders: [] }, "all").ok).toBe(false);
  });
});

describe("applyKalshiQuery (KAL-02, KAL-05)", () => {
  const trader = (username: string, sportsShare: number | null): KalshiTrader => ({
    rank: username.length,
    username,
    name: username.toUpperCase(),
    avatarUrl: null,
    pnl: 1,
    profileId: null,
    kalshiUrl: null,
    xHandle: null,
    sportsShare,
  });
  const traders = [trader("duck", 0.9), trader("probabilityduck", 0.1), trader("owl", null)];

  it("searches name and username, ignoring case, keeping upstream ranks", () => {
    const found = applyKalshiQuery(traders, { search: " Duck", nonSportsOnly: false });
    expect(found.map((entry) => [entry.username, entry.rank])).toEqual([
      ["duck", 4],
      ["probabilityduck", 15],
    ]);
  });

  it("keeps traders under the sports share limit, counting unknown as non-sports", () => {
    const found = applyKalshiQuery(traders, { search: "", nonSportsOnly: true });
    expect(found.map((entry) => entry.username)).toEqual(["probabilityduck", "owl"]);
  });
});

describe("getKalshiBoard", () => {
  it("asks for the top 1,000 of the period and returns live data", async () => {
    upstream.mockResolvedValue(envelope([raw()]));
    const result = await getKalshiBoard("7d");
    expect(upstream).toHaveBeenCalledWith(`/api/kalshi-leaderboard?period=7d&limit=${KALSHI_BOARD_LIMIT}`);
    expect(result.source).toEqual({ kind: "live" });
  });

  it("falls back to the labelled snapshot when upstream fails", async () => {
    upstream.mockRejectedValue(new UpstreamError("down", 503));
    const result = await getKalshiBoard("all");
    expect(result.source.kind).toBe("snapshot");
    expect(result.board.traders.length).toBeGreaterThan(0);
  });
});

describe("saved Kalshi snapshot", () => {
  it("covers every period with unique usernames", () => {
    const boards = loadKalshiSnapshot();
    for (const period of KALSHI_PERIODS) {
      const names = boards[period].board.traders.map((entry) => entry.username);
      expect(new Set(names).size, period).toBe(names.length);
      expect(boards[period].board.rejectedCount, period).toBe(0);
    }
  });

  it("refuses a snapshot without Kalshi boards", () => {
    expect(() => loadKalshiSnapshot({ capturedAt: "2026-11-14T00:00:00Z" })).toThrow(/Kalshi snapshot/);
  });

  it("lists the same periods as the upstream config", () => {
    expect(source.kalshiPeriods).toEqual([...KALSHI_PERIODS]);
    expect(source.kalshiLimit).toBe(KALSHI_BOARD_LIMIT);
  });
});
