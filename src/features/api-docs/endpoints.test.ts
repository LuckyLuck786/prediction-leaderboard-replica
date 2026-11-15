// The API page's list of upstream requests is checked against the requests
// the code really makes, both ways, so the two cannot drift apart.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getKalshiBoard } from "@/features/kalshi/data";
import { getBoard, getDailyProfit } from "@/features/leaderboard/data";
import { getProfile } from "@/features/profile/data";
import { getCategories, loadKalshiHistory, loadPolymarketHistory } from "@/features/profile/history-data";
import type { TraderProfile } from "@/features/profile/model";
import { fetchPolymarketJson, fetchUpstreamJson } from "@/upstream/client";
import { POLYMARKET_DATA_DEFAULT_ORIGIN } from "@/upstream/origins";
import source from "@/upstream/source.json";

import { DATA_SOURCES } from "./endpoints";

vi.mock("@/upstream/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/upstream/client")>();
  const refuse = async () => {
    throw new actual.UpstreamError("not in this test", null);
  };
  return { ...actual, fetchUpstreamJson: vi.fn(refuse), fetchPolymarketJson: vi.fn(refuse) };
});

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

/** A documented path as a pattern: "{a|b}" is one of those, "{name}" any one segment. */
function patternOf(path: string): RegExp {
  const escaped = path.replace(/[.*+?^$()[\]\\/]/g, "\\$&");
  const withChoices = escaped.replace(/\{([^{}]*\|[^{}]*)\}/g, "($1)");
  return new RegExp(`^${withChoices.replace(/\{[^{}]+\}/g, "[^/?&]+")}$`);
}

const profile = { kalshiUsername: "someone", platform: "kalshi" } as TraderProfile;

async function requestedPaths() {
  await getBoard("1d");
  await getDailyProfit();
  await getKalshiBoard("7d");
  await getProfile("someone");
  await loadKalshiHistory("someone").catch(() => undefined);
  await getCategories(profile);
  await loadPolymarketHistory("0x0000000000000000000000000000000000000001").catch(() => undefined);
  const paths = (mock: ReturnType<typeof vi.fn>) => mock.mock.calls.map(([path]) => String(path));
  return [
    ...paths(vi.mocked(fetchUpstreamJson)).map((path) => ({ origin: source.origin, path })),
    ...paths(vi.mocked(fetchPolymarketJson)).map((path) => ({ origin: POLYMARKET_DATA_DEFAULT_ORIGIN, path })),
  ];
}

describe("DATA_SOURCES (spec 4.6)", () => {
  it("lists every upstream request the code makes, and nothing it does not make", async () => {
    const made = await requestedPaths();
    expect(made).toHaveLength(DATA_SOURCES.length);
    for (const request of made) {
      const listed = DATA_SOURCES.some(
        (entry) => entry.origin === request.origin && patternOf(entry.path).test(request.path),
      );
      expect(listed, `${request.origin}${request.path} is not on the API page`).toBe(true);
    }
    for (const entry of DATA_SOURCES) {
      const used = made.some((request) => request.origin === entry.origin && patternOf(entry.path).test(request.path));
      expect(used, `${entry.origin}${entry.path} is listed but never requested`).toBe(true);
    }
  });
});
