import { SECURITY_HEADERS } from "../next.config";
import { DATA_SOURCES, ENDPOINTS } from "../src/features/api-docs/endpoints";

import { expect, test } from "./test";

test.describe("simple pages", () => {
  for (const [path, heading] of [
    ["/terms", "Terms"],
    ["/privacy", "Privacy"],
    ["/api-docs", "API"],
    ["/submit", "Get listed"],
  ] as const) {
    test(`${path} loads with the disclaimer`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(heading);
      await expect(page.locator("footer")).toContainText("Independent demo built for a hiring assignment");
    });
  }

  test("the get-listed form cannot send anything (SUB-02)", async ({ page }) => {
    await page.goto("/submit");
    const sent: string[] = [];
    page.on("request", (request) => {
      if (request.method() !== "GET") sent.push(request.url());
    });
    await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
    await page.getByRole("button", { name: "Submit" }).click({ force: true });
    await page.waitForTimeout(300);
    expect(sent).toEqual([]);
    await expect(page).toHaveURL(/\/submit$/);
  });

  test("the theme choice survives a reload (TOK-04)", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("button", { name: "Switch between dark and light theme" }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });
});

test.describe("API page (spec 4.6)", () => {
  test("every Try link answers with JSON, and the data sources are listed", async ({ page, request }) => {
    await page.goto("/api-docs");
    const tries = await page
      .getByRole("link", { name: /^\/api\// })
      .evaluateAll((links) => links.map((link) => link.getAttribute("href") ?? ""));
    expect(tries).toHaveLength(ENDPOINTS.length);
    for (const href of tries) {
      const response = await request.get(href);
      expect(response.status(), href).toBe(200);
      expect(response.headers()["content-type"], href).toContain("application/json");
    }
    const sources = page.getByRole("region", { name: "Where the data comes from" }).getByRole("listitem");
    await expect(sources).toHaveCount(DATA_SOURCES.length);
  });
});

test.describe("Polymarket About section (POLY-02)", () => {
  test("has five questions and four links that load", async ({ page, request }) => {
    await page.goto("/polymarket");
    const about = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "About this board" }) });
    await expect(about.getByRole("heading", { level: 3 })).toHaveCount(5);
    const links = await about
      .getByRole("link")
      .evaluateAll((items) => items.map((item) => item.getAttribute("href") ?? ""));
    expect(links).toHaveLength(4);
    for (const href of links) expect((await request.get(href)).status(), href).toBe(200);
  });
});

test.describe("response headers (D-054)", () => {
  for (const path of ["/", "/account/ProbabilityDuck", "/api/boards/1d"]) {
    test(`${path} sends the security headers and hides the framework`, async ({ request }) => {
      const headers = (await request.get(path)).headers();
      for (const { key, value } of SECURITY_HEADERS) expect(headers[key.toLowerCase()], key).toBe(value);
      expect(headers["x-powered-by"]).toBeUndefined();
    });
  }
});

test.describe("API routes", () => {
  test("serve boards as JSON and refuse unknown periods", async ({ request }) => {
    const board = await request.get("/api/boards/30d");
    expect(board.status()).toBe(200);
    const body = await board.json();
    expect(body.source.kind).toBe("live");
    expect(body.board.traders.length).toBeGreaterThan(0);

    expect((await request.get("/api/kalshi/7d")).status()).toBe(200);
    const unknown = await request.get("/api/boards/2y");
    expect(unknown.status()).toBe(404);
    expect((await unknown.json()).error).toBe("Unknown period");
  });
});
