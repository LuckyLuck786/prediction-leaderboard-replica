import { afterEach, describe, expect, it, vi } from "vitest";

import source from "./source.json";
import { UpstreamError, fetchPolymarketJson, fetchUpstreamJson, isNotFound } from "./client";
import { POLYMARKET_DATA_DEFAULT_ORIGIN } from "./origins";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(implementation: (url: URL, init: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn(implementation);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchUpstreamJson", () => {
  it("asks the upstream origin with a timeout, and returns the body", async () => {
    const fetchMock = stubFetch(async () => Response.json({ ok: 1 }));
    await expect(fetchUpstreamJson("/api/daily-profit")).resolves.toEqual({ ok: 1 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url.toString()).toBe(`${source.origin}/api/daily-profit`);
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("keeps nothing in the fetch cache, so the timeout always applies (BUG-050)", async () => {
    const fetchMock = stubFetch(async () => Response.json({ ok: 1 }));
    await fetchUpstreamJson("/api/daily-profit");
    const init = fetchMock.mock.calls[0][1] as { next?: unknown; cache?: unknown };
    expect(init.cache).toBe("no-store");
    expect(init.next).toBeUndefined();
  });

  it("asks Polymarket's Data API on its own origin", async () => {
    const fetchMock = stubFetch(async () => Response.json({ data: {} }));
    await fetchPolymarketJson("/v2/user-pnl?user=0xabc");
    expect(fetchMock.mock.calls[0][0].toString()).toBe(
      `${POLYMARKET_DATA_DEFAULT_ORIGIN}/v2/user-pnl?user=0xabc`,
    );
  });

  it("keeps the query string", async () => {
    const fetchMock = stubFetch(async () => Response.json([]));
    await fetchUpstreamJson("/api/leaderboard?period=1d");
    expect(fetchMock.mock.calls[0][0].toString()).toBe(`${source.origin}/api/leaderboard?period=1d`);
  });

  it("reports a non-2xx answer with its status", async () => {
    stubFetch(async () => new Response("slow down", { status: 429 }));
    const failure = fetchUpstreamJson("/api/leaderboard?period=1d");
    await expect(failure).rejects.toBeInstanceOf(UpstreamError);
    await expect(failure).rejects.toMatchObject({ status: 429 });
  });

  it("reports a network failure with no status", async () => {
    stubFetch(async () => {
      throw new TypeError("fetch failed");
    });
    await expect(fetchUpstreamJson("/api/x")).rejects.toMatchObject({
      name: "UpstreamError",
      status: null,
      message: expect.stringContaining("fetch failed"),
    });
  });

  it("reports a body that is not JSON", async () => {
    stubFetch(async () => new Response("<html>maintenance</html>", { status: 200 }));
    await expect(fetchUpstreamJson("/api/x")).rejects.toMatchObject({
      message: "/api/x did not return JSON",
    });
  });
});

describe("isNotFound", () => {
  it("is true only for an upstream 404", () => {
    expect(isNotFound(new UpstreamError("gone", 404))).toBe(true);
    expect(isNotFound(new UpstreamError("busy", 429))).toBe(false);
    expect(isNotFound(new Error("other"))).toBe(false);
  });
});
