// Keyboard checks (docs/EVALS.md, "Accessibility"): every control can be
// reached with Tab, shows where the focus is, lets the focus move on, and the
// main interactions work without a mouse. Desktop size: on a phone the same
// controls are reached the same way, and hover-only parts are not involved.

import type { Page } from "@playwright/test";

import { expect, test } from "./test";

const ROUTES = [
  "/",
  "/kalshi",
  "/account/ProbabilityDuck",
  "/battle",
  "/api-docs",
  "/submit",
  "/terms",
];

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex="0"]';

/** Visible focusable elements, in document order, by an id this test adds. */
async function markFocusable(page: Page): Promise<number> {
  return page.evaluate((selector) => {
    const elements = [...document.querySelectorAll<HTMLElement>(selector)].filter((element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      // A field inside a disabled fieldset is disabled too, and tabindex -1
      // takes an element out of the Tab order on purpose.
      const tabbable = element.tabIndex >= 0 && !element.matches(":disabled");
      return tabbable && box.width > 0 && box.height > 0 && style.visibility !== "hidden";
    });
    elements.forEach((element, index) => (element.dataset.kbd = String(index)));
    return elements.length;
  }, FOCUSABLE);
}

/**
 * What has the focus now, and whether its ring can be seen: drawn (an outline
 * or a shadow), opaque, and not cut off by an ancestor that clips.
 */
function focusState(page: Page) {
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element || element === document.body) return { id: null, problem: null, label: "body" };
    const style = getComputedStyle(element);
    const label = `${element.tagName.toLowerCase()} ${element.getAttribute("aria-label") ?? element.textContent?.trim().slice(0, 30) ?? ""}`;
    const outlineWidth = style.outlineStyle === "none" ? 0 : parseFloat(style.outlineWidth);
    if (outlineWidth === 0 && style.boxShadow === "none") return { id: element.dataset.kbd ?? null, problem: "no ring", label };
    if (outlineWidth > 0) {
      const alpha = /rgba?\([^)]*?,\s*([\d.]+)\)$/.exec(style.outlineColor)?.[1];
      if (alpha !== undefined && Number(alpha) < 1) return { id: element.dataset.kbd ?? null, problem: "faint ring", label };
      // The ring's outer edge, and every ancestor that would cut it off.
      const reach = parseFloat(style.outlineOffset) + outlineWidth;
      const box = element.getBoundingClientRect();
      const ring = { left: box.left - reach, top: box.top - reach, right: box.right + reach, bottom: box.bottom + reach };
      for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        const parentStyle = getComputedStyle(parent);
        if (parentStyle.overflowX === "visible" && parentStyle.overflowY === "visible") continue;
        const clip = parent.getBoundingClientRect();
        const SUBPIXEL = 0.5;
        if (
          ring.left < clip.left - SUBPIXEL ||
          ring.top < clip.top - SUBPIXEL ||
          ring.right > clip.right + SUBPIXEL ||
          ring.bottom > clip.bottom + SUBPIXEL
        ) {
          return { id: element.dataset.kbd ?? null, problem: "ring cut off", label };
        }
      }
    }
    return { id: element.dataset.kbd ?? null, problem: null, label };
  });
}

test.describe("keyboard", () => {

  for (const path of ROUTES) {
    test(`${path}: Tab reaches every control, each with a ring that can be seen`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name === "mobile", "Desktop only");
      await page.goto(path);
      // Charts draw after load; wait so their parts are counted.
      await page.waitForLoadState("networkidle");
      const total = await markFocusable(page);
      const reached = new Set<string>();
      const badRings: string[] = [];

      for (let press = 0; press < total + 2; press += 1) {
        await page.keyboard.press("Tab");
        const state = await focusState(page);
        if (state.id === null) continue;
        reached.add(state.id);
        if (state.problem) badRings.push(`${state.problem}: ${state.label}`);
      }

      expect(badRings, "focused without a ring that can be seen").toEqual([]);
      expect(reached.size, "controls reached with Tab").toBe(total);
    });
  }

  test("home: period, sorting, search and opening a trader by keyboard", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Desktop only");
    await page.goto("/");
    const all = page.getByRole("button", { name: "ALL", exact: true });
    await all.focus();
    await page.keyboard.press("Enter");
    await expect(all).toHaveAttribute("aria-pressed", "true");

    const pnl = page.getByRole("button", { name: "P&L", exact: true });
    await pnl.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: "P&L ↓" })).toBeFocused();

    await page.getByRole("searchbox").focus();
    await page.keyboard.type("zz-no-such-trader");
    await expect(page.getByText("No traders match these filters.")).toBeVisible();
    await page.getByRole("searchbox").fill("");

    const firstName = page.locator("tbody tr:not([aria-hidden])").first().getByRole("link").first();
    await firstName.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/account\/[^/]+$/);
  });

  test("profile: calendar, months and the history note by keyboard", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Desktop only");
    await page.goto("/account/ProbabilityDuck");
    const strip = page.getByRole("region", { name: "Results by month" });
    const toggle = strip.getByRole("button", { name: "Show the calendar" });
    await toggle.focus();
    await page.keyboard.press("Enter");
    await expect(strip.getByRole("button", { name: "Hide the calendar" })).toHaveAttribute("aria-expanded", "true");

    await strip.getByRole("button", { name: "Previous month" }).focus();
    await page.keyboard.press("Space");
    await expect(strip.getByRole("button", { name: "Next month" })).toBeEnabled();

    await page.getByRole("button", { name: "About this history" }).focus();
    await page.keyboard.press("Space");
    await expect(page.getByText(/^Kalshi history starts when/)).toBeVisible();
  });

  test("theme toggle by keyboard", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Desktop only");
    await page.goto("/terms");
    await page.getByRole("button", { name: "Switch between dark and light theme" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});
