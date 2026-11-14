// Shared test setup: every page runs offline. Requests to any host other than
// the local app are aborted, so trader pictures and anything else outside
// never reach the internet and cannot make a test flaky.

import { test as base, expect } from "@playwright/test";

const OUTSIDE_HOST = /^https?:\/\/(?!localhost[:/]|127\.0\.0\.1[:/])/;

export const test = base.extend({
  // Named "provide" rather than Playwright's usual "use", which the React
  // hooks lint rule would mistake for a hook.
  page: async ({ page }, provide) => {
    await page.route(OUTSIDE_HOST, (route) => route.abort());
    await provide(page);
  },
});

export { expect };

/** True when the page scrolls sideways, which no page should. */
export async function hasHorizontalScroll(page: import("@playwright/test").Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}
