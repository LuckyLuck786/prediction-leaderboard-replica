import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchBoardPayload } from "./board-payload";

const hasId = (row: Record<string, unknown>) => typeof row.id === "string";

const payload = (overrides: Record<string, unknown> = {}, board: Record<string, unknown> = {}) => ({
  board: {
    period: "1d",
    lastUpdated: "2026-11-15T00:00:00Z",
    traders: [{ id: "a" }],
    rejectedCount: 0,
    ...board,
  },
  source: { kind: "live" },
  ...overrides,
});

function answer(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(body, { status })),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchBoardPayload", () => {
  it("returns a payload with the right outline", async () => {
    const body = payload({
      source: { kind: "snapshot", capturedAt: "2026-11-14T12:00:00Z", upstreamTotal: 3 },
    });
    answer(body);
    await expect(fetchBoardPayload("/api/boards/1d", "1d", hasId)).resolves.toEqual(body);
  });

  it.each([
    ["another period", payload({}, { period: "30d" }), /period 30d, not 1d/],
    ["no traders", payload({}, { traders: null }), /no traders/],
    [
      "a row without its key",
      payload({}, { traders: [{ id: "a" }, { name: "b" }] }),
      /trader 1 lacks its key/,
    ],
    ["no data source", payload({ source: { kind: "snapshot" } }), /no data source/],
    ["no board at all", { error: "Unknown period" }, /no board/],
  ])("refuses an answer with %s", async (_case, body, message) => {
    answer(body);
    await expect(fetchBoardPayload("/api/boards/1d", "1d", hasId)).rejects.toThrow(message);
  });

  it("refuses an error status", async () => {
    answer({ error: "Unknown period" }, 404);
    await expect(fetchBoardPayload("/api/boards/1d", "1d", hasId)).rejects.toThrow(
      "/api/boards/1d answered 404",
    );
  });
});
