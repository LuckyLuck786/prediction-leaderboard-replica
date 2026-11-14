import { afterEach, describe, expect, it, vi } from "vitest";

import source from "./source.json";
import {
  UPSTREAM_REVALIDATE_SECONDS,
  UpstreamError,
  fetchUpstreamJson,
  isNotFound,
} from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(implementation: (url: URL, init: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn(implementation);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("fetchUpstreamJson", () => {
  it("asks the upstream origin, caches for the revalidate period, and returns the body", async () => {
    const fetchMock = stubFetch(async () => Response.json({ ok: 1 }));
    await expect(fetchUpstreamJson("/api/daily-profit")).resolves.toEqual({ ok: 1 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url.toString()).toBe(`${source.origin}/api/daily-profit`);
    expect((init as { next?: { revalidate?: number } }).next?.revalidate).toBe(
      UPSTREAM_REVALIDATE_SECONDS,
    );
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("keeps the query string", async () => {
    const fetchMock = stubFetch(async () => Response.json([]));
    await fetchUpstreamJson("/api/leaderboard?period=1d");
    expect(fetchMock.mock.calls[0][0].toString()).toBe(
      `${source.origin}/api/leaderboard?period=1d`,
    );
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
