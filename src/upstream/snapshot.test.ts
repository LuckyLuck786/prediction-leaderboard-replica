import { describe, expect, it } from "vitest";

import { SAVED_SNAPSHOT, parseSnapshotFile } from "./snapshot";

describe("parseSnapshotFile", () => {
  it("reads the committed file, with both boards", () => {
    const file = parseSnapshotFile(SAVED_SNAPSHOT);
    expect(Object.keys(file.periods).length).toBeGreaterThan(0);
    expect(Object.keys(file.kalshi).length).toBeGreaterThan(0);
  });

  it("writes the capture time as an ISO timestamp", () => {
    expect(parseSnapshotFile({ capturedAt: "2026-11-14T12:00:00+05:30" }).capturedAt).toBe(
      "2026-11-14T06:30:00.000Z",
    );
  });

  it("refuses a file without a usable capture time", () => {
    expect(() => parseSnapshotFile({ capturedAt: "recently" })).toThrow(/Saved snapshot is invalid/);
    expect(() => parseSnapshotFile(null)).toThrow(/Saved snapshot is invalid/);
  });
});
