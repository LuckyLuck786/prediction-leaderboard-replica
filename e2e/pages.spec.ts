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

test.describe("API routes", () => {
  test("serve boards as JSON and refuse unknown periods", async ({ request }) => {
    const board = await request.get("/api/boards/30d");
    expect(board.status()).toBe(200);
    const body = await board.json();
    expect(body.source.kind).toBe("live");
    expect(body.board.traders.length).toBeGreaterThan(0);

    expect((await request.get("/api/kalshi/7d")).status()).toBe(200);
    expect((await request.get("/api/boards/2y")).status()).toBe(404);
  });
});
