// Automated accessibility checks (docs/EVALS.md, "Accessibility"): axe-core
// against every route, in both themes, at both test sizes. Any violation of
// the WCAG 2.2 A and AA rules axe can test fails the test, with its rule,
// impact and the elements involved.

import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

import { DARK_CLASS, THEME_STORAGE_KEY } from "../src/features/shell/theme";

import { expect, test } from "./test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

const PROFILE_CHART = /^Cumulative profit and loss from/;

/** Opens the month strip's calendar, in the daily or the monthly view. */
async function openCalendar(page: Page, view: "daily" | "monthly") {
  await expect(page.getByRole("img", { name: PROFILE_CHART })).toBeVisible();
  const strip = page.getByRole("region", { name: "Results by month" });
  await strip.getByRole("button", { name: "Show the calendar" }).click();
  if (view === "monthly") await strip.getByRole("button", { name: "monthly" }).click();
  await expect(strip.getByText(view === "monthly" ? /\d{4} YTD/ : "Best")).toBeVisible();
}

const ROUTES: ReadonlyArray<{ name?: string; path: string; ready?: (page: Page) => Promise<void> }> = [
  { path: "/", ready: (page) => expect(page.getByRole("table")).toBeVisible() },
  { path: "/polymarket", ready: (page) => expect(page.getByRole("table")).toBeVisible() },
  { path: "/kalshi", ready: (page) => expect(page.getByRole("table")).toBeVisible() },
  {
    path: "/account/ProbabilityDuck",
    ready: (page) => expect(page.getByRole("img", { name: PROFILE_CHART })).toBeVisible(),
  },
  {
    name: "/account/ProbabilityDuck, calendar open, daily",
    path: "/account/ProbabilityDuck",
    ready: (page) => openCalendar(page, "daily"),
  },
  {
    name: "/account/ProbabilityDuck, calendar open, monthly",
    path: "/account/ProbabilityDuck",
    ready: (page) => openCalendar(page, "monthly"),
  },
  {
    path: "/account/0xec981ed70ae69c5cbcac08c1ba063e734f6bafcd",
    ready: (page) => expect(page.getByRole("img", { name: PROFILE_CHART })).toBeVisible(),
  },
  { path: "/battle", ready: (page) => expect(page.getByRole("img", { name: /^P&L change from/ })).toBeVisible() },
  { path: "/api-docs" },
  { path: "/submit" },
  { path: "/terms" },
  { path: "/privacy" },
  { path: "/no-such-page" },
];

for (const theme of ["dark", "light"] as const) {
  test.describe(`axe, ${theme} theme`, () => {
    test.beforeEach(async ({ page }) => {
      if (theme === "light") {
        await page.addInitScript((key) => localStorage.setItem(key, "light"), THEME_STORAGE_KEY);
      }
    });

    for (const route of ROUTES) {
      test(`${route.name ?? route.path} has no WCAG A or AA violations`, async ({ page }) => {
        await page.goto(route.path);
        // Make sure the theme under test is the one on screen.
        if (theme === "light") await expect(page.locator("html")).not.toHaveClass(new RegExp(DARK_CLASS));
        else await expect(page.locator("html")).toHaveClass(new RegExp(DARK_CLASS));
        await route.ready?.(page);
        const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
        const violations = results.violations.map((violation) => ({
          rule: violation.id,
          impact: violation.impact,
          help: violation.help,
          targets: violation.nodes.slice(0, 5).map((node) => node.target.join(" ")),
        }));
        expect(violations).toEqual([]);
      });
    }
  });
}
