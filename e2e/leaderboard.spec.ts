import { expect, hasHorizontalScroll, test } from "./test";

const DISCLAIMER = /Independent demo built for a hiring assignment\. Not affiliated with/;
const bodyRows = "tbody tr:not([aria-hidden])";

test.describe("home leaderboard (spec 4.1)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("shows the board, the count, the disclaimer, and no sideways scroll", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Luqky's Prediction Leaderboard");
    await expect(page.locator(bodyRows)).toHaveCount(30);
    await expect(page.getByText(/^\d+ of \d+ traders$/)).toBeVisible();
    await expect(page.locator("footer")).toContainText(DISCLAIMER);
    await expect(page.getByRole("status")).toHaveCount(0); // live data: no snapshot banner
    expect(await hasHorizontalScroll(page)).toBe(false);
  });

  test("switches period without a page load (HOME-04)", async ({ page }) => {
    const firstName = page.locator(`${bodyRows} >> nth=0`).getByRole("link").first();
    const before = await firstName.textContent();
    await page.getByRole("button", { name: "ALL", exact: true }).click();
    await expect(page.getByText(/^\d+ of \d+ traders$/)).toBeVisible();
    await expect(firstName).not.toHaveText(before ?? "");
    await expect(page.getByRole("button", { name: "$5+" })).toHaveCount(0);
  });

  test("sorts by P&L both ways (HOME-18)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "Full amounts show from 640 px up");
    await page.getByRole("button", { name: "P&L", exact: true }).click();
    await expect(page.getByRole("button", { name: "P&L ↓" })).toBeVisible();
    await expect(page.locator(`${bodyRows} >> nth=0`).locator("td").last()).toContainText("$-");
    await page.getByRole("button", { name: "P&L ↓" }).click();
    await expect(page.locator(`${bodyRows} >> nth=0`).locator("td").last()).toContainText("+$");
  });

  test("searches as you type and says when nothing matches (HOME-20)", async ({ page }) => {
    await page.getByRole("searchbox").fill("zz-no-such-trader");
    await expect(page.locator(bodyRows)).toHaveCount(0);
    await expect(page.getByText("No traders match these filters.")).toBeVisible();
  });

  test("opens a trader's profile from a row (HOME-13)", async ({ page }) => {
    await page.locator(`${bodyRows} >> nth=0`).locator("td").first().click();
    await expect(page).toHaveURL(/\/account\/[^/]+$/);
  });

  test("links only to pages that load (HOME-21)", async ({ page, request }) => {
    const hrefs = await page.locator("footer nav a").evaluateAll((links) =>
      links.map((link) => link.getAttribute("href")),
    );
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect((await request.get(href ?? "")).status(), href ?? "").toBe(200);
    }
  });
});

test.describe("Polymarket board (spec 4.2)", () => {
  test("starts filtered to Polymarket and explains itself", async ({ page }) => {
    await page.goto("/polymarket");
    await expect(page.getByRole("button", { name: "Polymarket" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("heading", { name: "About this board" })).toBeVisible();
  });
});

test.describe("Kalshi board (spec 4.3)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/kalshi");
  });

  test("lists traders with their true rank while searching (KAL-05)", async ({ page }) => {
    await expect(page.locator(bodyRows)).not.toHaveCount(0);
    const fourth = page.locator(`${bodyRows} >> nth=3`);
    const rank = await fourth.locator("td").first().textContent();
    const name = (await fourth.locator("td").nth(2).getByRole("link").textContent()) ?? "";
    await page.getByRole("searchbox").fill(name);
    await expect(page.locator(`${bodyRows} >> nth=0`).locator("td").first()).toHaveText(rank ?? "");
  });

  test("loads another period only when it is picked (KAL-07)", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/api/kalshi/")) requests.push(new URL(request.url()).pathname);
    });
    await page.waitForTimeout(500);
    expect(requests).toEqual([]);
    await page.getByRole("button", { name: "7D", exact: true }).click();
    await expect(page.getByText(/^[\d,]+ traders$/)).toBeVisible();
    expect(requests).toEqual(["/api/kalshi/7d"]);
  });

  test("has no sideways scroll", async ({ page }) => {
    expect(await hasHorizontalScroll(page)).toBe(false);
  });
});
