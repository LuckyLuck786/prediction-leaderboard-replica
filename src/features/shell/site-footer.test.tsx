// @vitest-environment jsdom

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { cleanup, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import source from "@/upstream/source.json";

import { DISCLAIMER } from "./brand";
import { FOOTER_LINKS, SiteFooter } from "./site-footer";

/**
 * Resolved from this file, so the tests pass from any working directory.
 * Plain paths, not URL objects: in jsdom the global URL is not Node's, and
 * the fs functions refuse it.
 */
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const inRepo = (relativePath: string) => resolve(REPO_ROOT, relativePath);

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
    const readme = readFileSync(inRepo("README.md"), "utf8").replace(/\s+/g, " ");
    expect(readme).toContain(DISCLAIMER);
  });

  // Empty today: no other page is built yet. The loop guards every link
  // added later, so a footer link can never again point at a missing page.
  it("links only to pages that exist", () => {
    for (const link of FOOTER_LINKS) {
      const page = inRepo(`src/app${link.href}/page.tsx`);
      expect(existsSync(page), `${link.href} has no page`).toBe(true);
    }
  });
});
