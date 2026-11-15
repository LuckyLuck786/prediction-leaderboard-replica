import { expect, hasHorizontalScroll, test } from "./test";

const CHART = /^P&L change from/;
/** A name followed by an amount, as the readout prints it: `@25usdc +$93.9K`. */
const MONEY_AFTER = (name: string) => new RegExp(`${name} (\\+\\$|\\$-)[\\d.]+[KM]`);
/** Half a pixel: the paths are written with one decimal. */
const PIXEL_TOLERANCE = 0.5;

test.describe("head to head (spec 4.5)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/battle");
  });

  test("shows both traders, the chart and the disclaimer (BATTLE-01 to BATTLE-03)", async ({ page }) => {
    await expect(page).toHaveTitle(/^Head to head/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Head to head");
    const traders = page.getByRole("region", { name: "The two traders" });
    await expect(traders).toContainText("@25usdc");
    await expect(traders).toContainText("@PredMTrader");
    await expect(traders.getByRole("link", { name: "@PredMTrader" })).toHaveAttribute(
      "href",
      /^https:\/\/kalshi\.com\/[^?]*$/,
    );
    await expect(page.getByRole("list", { name: "Legend" }).getByRole("listitem")).toHaveCount(2);
    await expect(page.getByRole("img", { name: CHART })).toBeVisible();
    await expect(page.getByText(/^Independent demo built for a hiring assignment/)).toBeVisible();
    expect(await hasHorizontalScroll(page)).toBe(false);
  });

  test("starts both lines at zero (acceptance)", async ({ page }) => {
    const chart = page.getByRole("img", { name: CHART });
    const zeroY = Number(await chart.locator("line[stroke-dasharray]").getAttribute("y1"));
    const starts = await chart
      .locator("path")
      .evaluateAll((paths) => paths.map((path) => Number(/^M[\d.-]+,([\d.-]+)/.exec(path.getAttribute("d") ?? "")?.[1])));
    expect(starts).toHaveLength(2);
    for (const y of starts) expect(Math.abs(y - zeroY)).toBeLessThanOrEqual(PIXEL_TOLERANCE);
  });

  test("shows both values under the pointer", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Hover is a pointer interaction");
    const chart = page.getByRole("img", { name: CHART });
    const box = await chart.boundingBox();
    if (!box) throw new Error("chart has no box");
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2);
    const readout = page.getByRole("status");
    await expect(readout).toContainText(MONEY_AFTER("@25usdc"));
    await expect(readout).toContainText(MONEY_AFTER("@PredMTrader"));
  });

  test("is linked from the footer of the other pages", async ({ page }) => {
    await page.goto("/terms");
    await page.getByRole("link", { name: "Head to head" }).click();
    await expect(page).toHaveURL(/\/battle$/);
  });
});
