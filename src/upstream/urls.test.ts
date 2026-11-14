import { describe, expect, it } from "vitest";

import source from "./source.json";
import { cleanLinkUrl, safeHttpsUrl } from "./urls";

describe("safeHttpsUrl", () => {
  it.each([
    ["https://pbs.twimg.com/a.jpg?size=400", "https://pbs.twimg.com/a.jpg?size=400"],
    ["/api/kalshi-avatar/someone", `${source.origin}/api/kalshi-avatar/someone`],
    ["http://insecure.example/a.png", null],
    ["javascript:alert(1)", null],
    ["data:image/png;base64,AAAA", null],
    ["", null],
    [null, null],
    [undefined, null],
  ])("%s -> %s", (input, expected) => {
    expect(safeHttpsUrl(input)).toBe(expected);
  });
});

describe("cleanLinkUrl", () => {
  it("drops referral and tracking parameters and fragments", () => {
    expect(cleanLinkUrl("https://kalshi.com/ideas/profiles/x?referral=abc#top")).toBe(
      "https://kalshi.com/ideas/profiles/x",
    );
  });

  it("refuses anything that is not https", () => {
    expect(cleanLinkUrl("javascript:alert(1)")).toBeNull();
  });
});
