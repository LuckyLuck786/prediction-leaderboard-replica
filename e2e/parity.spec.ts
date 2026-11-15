// The layout probe from docs/EVALS.md as a test: our pages measured at the
// viewport the source was measured at, against the source's numbers. Where a
// known, deliberate difference applies, the expected value is ours and the
// comment says why.
//
// Sizes set by CSS (column widths, heights, cards, charts) are checked on
// every platform. Widths that come from text depend on the system font
// (D-017), so they are checked only on macOS, where they were measured.

import type { Locator, Page } from "@playwright/test";

import { expect, test } from "./test";

/** Sub-pixel rounding between engines and platforms. */
const TOLERANCE_PX = 0.6;
const ON_MAC = process.platform === "darwin";

interface Box {
  width: number;
  height: number;
  fontSize: number;
}

async function measure(page: Page, target: string | Locator): Promise<Box> {
  const element = (typeof target === "string" ? page.locator(target) : target).first();
  await expect(element).toBeVisible();
  return element.evaluate((node) => {
    const box = node.getBoundingClientRect();
    return { width: box.width, height: box.height, fontSize: parseFloat(getComputedStyle(node).fontSize) };
  });
}

function near(actual: number, expected: number, what: string) {
  expect(
    Math.abs(actual - expected),
    `${what}: ${actual.toFixed(1)} against ${expected}`,
  ).toBeLessThanOrEqual(TOLERANCE_PX);
}

test.describe("measured parity with the source", () => {
  // The source and our pages were probed in a browser at 2x pixel density. At
  // 1x, Chrome rounds some text lines to whole pixels (a 17.5 px row becomes
  // 18), so the checks use the same density as the measurements.
  test.use({ deviceScaleFactor: 2 });

  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Each check sets its own viewport");
  });

  test("home at 1024 px", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/");
    near((await measure(page, "main")).width, 896, "content column");
    const columns = await page
      .locator("thead th")
      .evaluateAll((cells) => cells.slice(0, 6).map((cell) => cell.getBoundingClientRect().width));
    [48, 56, 243, 64, 243, 243].forEach((width, index) => near(columns[index], width, `column ${index + 1}`));
    near((await measure(page, "thead tr")).height, 53, "header row");
    near((await measure(page, "tbody tr:not([aria-hidden]) td:nth-child(2) > div")).width, 40, "avatar");
    near((await measure(page, "input[type=search]")).height, 30, "search height");
    near((await measure(page, "input[type=search]")).width, 192, "search width");
    near((await measure(page, "button:text-is('1D')")).height, 28, "period button height");
    const footerGap = await page
      .locator("footer")
      .evaluate((node) => parseFloat(getComputedStyle(node).marginTop));
    near(footerGap, 64, "gap above the footer");
  });

  test("home at 1024 px: widths set by text (macOS)", async ({ page }) => {
    test.skip(!ON_MAC, "Text widths depend on the system font");
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/");
    const button = (name: string) => page.getByRole("button", { name, exact: true });
    near((await measure(page, button("ALL"))).width, 49.4, "ALL");
    near((await measure(page, button("1D"))).width, 40.7, "1D");
    near((await measure(page, button("All"))).width, 32.1, "All chip");
    near((await measure(page, button("No sports"))).width, 71.3, "No sports chip");
  });

  test("home at 390 px", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const columns = await page
      .locator("thead th")
      .evaluateAll((cells) =>
        cells
          .filter((cell) => cell.getBoundingClientRect().width > 0)
          .map((cell) => cell.getBoundingClientRect().width),
      );
    [24, 28, 105, 105, 105].forEach((width, index) => near(columns[index], width, `column ${index + 1}`));
    near((await measure(page, "button:text-is('1D')")).height, 24, "period button height");
    near((await measure(page, "h1")).fontSize, 20, "heading font size");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  });

  test("profile at 1024 px", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 });
    await page.goto("/account/ProbabilityDuck");
    near((await measure(page, "main img, main .rounded-full")).width, 76, "avatar");
    expect((await measure(page, "h1")).fontSize).toBe(24);
    const strip = "section[aria-label='Results by month']";
    near((await measure(page, strip)).width, 864, "month strip width");
    near((await measure(page, strip)).height, 51, "month strip height");
    near((await measure(page, `${strip} [title^='Day']`)).width, 8, "day bar width");
    near((await measure(page, `${strip} [title^='Day']`)).height, 16, "day bar height");
    near((await measure(page, "section[aria-labelledby=history-heading]")).height, 262, "history card");
    await expect(page.getByRole("img", { name: /^Cumulative profit and loss/ })).toBeVisible();
    near(
      (await measure(page, "section[aria-labelledby=history-heading] svg[role=img]")).width,
      830,
      "chart width",
    );
    near(
      (await measure(page, "section[aria-labelledby=history-heading] svg[role=img]")).height,
      192,
      "chart height",
    );
    near(
      (await measure(page, "section[aria-labelledby=categories-heading] ul")).height,
      323,
      "category list",
    );
    near(
      (await measure(page, "section[aria-labelledby=categories-heading] li")).height,
      17.5,
      "category row",
    );

    await page.getByRole("button", { name: "Show the calendar" }).click();
    near((await measure(page, `${strip} .aspect-square`)).width, 116.3, "day cell");
    // The calendar opens on the current month, and its height depends on how
    // many weeks that month spans. Measured on a five-week month: 748.4 in
    // total (about 747 on the source, a known difference), of which the day
    // grid was 5 x 116.3 + 4 x 4 = 597.5. Everything but the grid is checked.
    const days = page.locator(strip).locator(".grid-cols-7").nth(1);
    const grid = (await days.boundingBox())?.height ?? 0;
    near((await measure(page, strip)).height - grid, 748.4 - 597.5, "expanded calendar without its day grid");
  });

  test("head to head at 800 px", async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 960 });
    await page.goto("/battle");
    near((await measure(page, "main")).width, 768, "column");
    near((await measure(page, "h1")).height, 32, "heading");
    near((await measure(page, "main > p")).height, 22, "subtitle");
    near((await measure(page, "section[aria-label='The two traders']")).height, 272, "trader card");
    near((await measure(page, "section[aria-label='The two traders'] .border-2")).width, 128, "picture");
    near((await measure(page, "section[aria-labelledby=change-heading]")).height, 354, "chart card");
    await expect(page.getByRole("img", { name: /^P&L change from/ })).toBeVisible();
    near((await measure(page, "section[aria-labelledby=change-heading] svg[role=img]")).height, 256, "chart");
  });
});
