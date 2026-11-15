import { expect, hasHorizontalScroll, test } from "./test";

const KALSHI_TRADER = "/account/ProbabilityDuck";
const POLYMARKET_TRADER = "/account/0xec981ed70ae69c5cbcac08c1ba063e734f6bafcd";
const BOTH_PLATFORMS_TRADER = "/account/0x44c1dfe43260c94ed4f1d00de2e1f80fb113ebc1";
const MS_PER_DAY = 86_400_000;
const MONTH_YEAR = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
const VALUE_LABEL = /^[+-]\$[\d.]+[KM]?$/;

test.describe("Kalshi trader profile (spec 4.4)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(KALSHI_TRADER);
  });

  test("shows the header, the month, the chart, categories and score", async ({ page }) => {
    await expect(page).toHaveTitle(/^ProbabilityDuck · \+\$[\d.]+M all-time/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("ProbabilityDuck");
    const strip = page.getByRole("region", { name: "Results by month" });
    await expect(strip).toContainText(/\d+W \/ \d+L/);
    await expect(page.getByRole("img", { name: /^Cumulative profit and loss from/ })).toBeVisible();
    await expect(page.locator("section[aria-labelledby=categories-heading] li")).toHaveCount(14);
    await expect(page.getByRole("heading", { name: "Smart Score" })).toBeVisible();
    expect(await hasHorizontalScroll(page)).toBe(false);
  });

  test("keeps the Kalshi history note behind the info button", async ({ page }) => {
    const note = page.getByText(/^Kalshi history starts when/);
    await expect(note).toBeHidden();
    await page.getByRole("button", { name: "About this history" }).click();
    await expect(note).toBeVisible();
  });

  test("opens the calendar, switches views and steps back a month (PROF-02, PROF-03)", async ({ page }) => {
    const strip = page.getByRole("region", { name: "Results by month" });
    const label = strip.getByRole("status");
    const thisMonth = await label.textContent();

    await strip.getByRole("button", { name: "Show the calendar" }).click();
    await expect(strip.getByTestId("calendar-weekdays").locator("div")).toHaveCount(7);
    // Today's cell has an amount: the fixture server moves history up to today.
    await expect(strip.locator("[data-testid=calendar-day][title]").last()).toHaveAttribute(
      "title",
      /^[+-]\$[\d,]+$/,
    );

    await strip.getByRole("button", { name: "monthly" }).click();
    await expect(strip).toContainText(/\d{4} YTD/);

    await strip.getByRole("button", { name: "daily" }).click();
    await strip.getByRole("button", { name: "Previous month" }).click();
    await expect(label).not.toHaveText(thisMonth ?? "");
    await expect(strip.getByRole("button", { name: "Next month" })).toBeEnabled();
  });

  test("labels the chart axes and shows a value under the pointer (PROF-04)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Hover is a pointer interaction");
    const chart = page.getByRole("img", { name: /^Cumulative profit and loss from/ });
    // The chart draws once it knows its width, after the page loads: wait for it.
    await expect(chart.locator("text").filter({ hasText: VALUE_LABEL })).toHaveCount(5);

    const box = await chart.boundingBox();
    if (!box) throw new Error("chart has no box");
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height / 2);
    const history = page.getByRole("region", { name: "P&L history" });
    await expect(history.getByRole("status")).toContainText(/\w{3} \d{1,2}, \d{4}/);
  });
});

test.describe("Polymarket trader profile", () => {
  test("draws history from Polymarket's API and has no category card", async ({ page }) => {
    await page.goto(POLYMARKET_TRADER);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("elucidate");
    await expect(page.getByRole("img", { name: /^Cumulative profit and loss from/ })).toBeVisible();
    await expect(page.locator("section[aria-labelledby=categories-heading]")).toHaveCount(0);
  });
});

test.describe("profile errors", () => {
  test("an unknown trader is a 404 page", async ({ page }) => {
    const response = await page.goto("/account/no-such-trader-zz9");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Not found" })).toBeVisible();
  });

  // That no upstream request is made is checked by the unit tests of getProfile:
  // the fixture server would also answer such a request with 404.
  test("a malformed id is a 404 page (D-032)", async ({ page }) => {
    const response = await page.goto("/account/..%2F");
    expect(response?.status()).toBe(404);
  });

  test("an upstream failure shows the error page with a retry (BUG-023)", async ({ page }) => {
    await page.goto("/account/e2e-rate-limited");
    await expect(page.getByRole("heading", { name: "This profile is unavailable right now" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  });
});

test.describe("trader on both platforms", () => {
  test("the calendar steps back to the month the chart starts in (BUG-082)", async ({ page }) => {
    await page.goto(BOTH_PLATFORMS_TRADER);
    const chart = page.getByRole("img", { name: /^Cumulative profit and loss from/ });
    const from = /from (\w{3} \d{1,2}, \d{4}) to/.exec((await chart.getAttribute("aria-label")) ?? "")?.[1];
    if (!from) throw new Error("the chart names no first date");
    // A day's result is its change from the day before, so the calendar's first
    // result is the day after the chart's first point.
    const firstResult = MONTH_YEAR.format(Date.parse(`${from} UTC`) + MS_PER_DAY);

    const strip = page.getByRole("region", { name: "Results by month" });
    const previous = strip.getByRole("button", { name: "Previous month" });
    // This trader's Polymarket history starts two years before the Kalshi one.
    for (let step = 0; step < 60 && (await previous.isEnabled()); step += 1) await previous.click();
    await expect(previous).toBeDisabled();
    await expect(strip.getByRole("status")).toHaveText(firstResult);
  });
});
