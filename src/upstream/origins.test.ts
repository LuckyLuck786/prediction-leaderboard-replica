import { describe, expect, it } from "vitest";

import { originFromEnv } from "./origins";

const FALLBACK = "https://example.org";
const read = (value: string | undefined) => originFromEnv("TEST_ORIGIN", FALLBACK, { TEST_ORIGIN: value });

describe("originFromEnv (D-040)", () => {
  it("uses the default when nothing is set", () => {
    expect(read(undefined)).toBe(FALLBACK);
    expect(read("")).toBe(FALLBACK);
  });

  it("keeps only the origin of an https URL", () => {
    expect(read("https://data.example.com/some/path?q=1")).toBe("https://data.example.com");
  });

  it.each(["http://localhost:4010", "http://127.0.0.1:4010", "http://[::1]:4010"])(
    "accepts plain http for a local server: %s",
    (value) => {
      expect(read(value)).toBe(value);
    },
  );

  it.each(["http://example.com", "javascript:x", "ftp://example.com", "not a url", "/relative"])(
    "refuses %s",
    (value) => {
      expect(() => read(value)).toThrow(/TEST_ORIGIN must be an https URL/);
    },
  );
});
