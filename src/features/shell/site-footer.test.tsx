// @vitest-environment jsdom

import { readFileSync } from "node:fs";

import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import source from "@/upstream/source.json";

import { DISCLAIMER } from "./brand";
import { SiteFooter } from "./site-footer";

// A plain anchor that stays on the page: jsdom cannot navigate.
vi.mock("next/link", () => ({
  default: ({ onClick, ...props }: ComponentProps<"a">) => (
    <a
      {...props}
      onClick={(event) => {
        onClick?.(event);
        event.preventDefault();
      }}
    />
  ),
}));

afterEach(cleanup);

describe("SiteFooter", () => {
  it("carries the disclaimer", () => {
    render(<SiteFooter />);
    expect(screen.getByText(DISCLAIMER)).toBeTruthy();
    expect(DISCLAIMER).toBe(
      `Independent demo built for a hiring assignment. Not affiliated with ${source.name}, Polymarket or Kalshi.`,
    );
  });

  it("credits the data source and links back to it (DEV-07)", () => {
    render(<SiteFooter />);
    const credit = screen.getByRole("link", { name: /^Data:/ });
    expect(credit.getAttribute("href")).toBe(source.origin);
    expect(credit.getAttribute("rel")).toContain("noopener");
  });

  it("uses the same disclaimer as the README", () => {
    // Markdown wraps lines, so compare with whitespace collapsed.
    const readme = readFileSync("README.md", "utf8").replace(/\s+/g, " ");
    expect(readme).toContain(DISCLAIMER);
  });
});
