// End-to-end tests: the production build, served locally, reading recorded
// data from a fixture server instead of the internet. Run with npm run test:e2e.

import { defineConfig, devices } from "@playwright/test";

const APP_PORT = 3200;
const FIXTURE_PORT = 4010;
const FIXTURE_ORIGIN = `http://127.0.0.1:${FIXTURE_PORT}`;
/** The app builds to its own folder, so tests never disturb a running dev server. */
const E2E_DIST_DIR = ".next-e2e";
const BUILD_AND_START_TIMEOUT_MS = 300_000;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${APP_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    // The parity matrix's middle size (docs/EVALS.md).
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: true },
    },
  ],
  webServer: [
    {
      name: "fixtures",
      command: "node e2e/fixture-server.mjs",
      url: `${FIXTURE_ORIGIN}/health`,
      env: { FIXTURE_PORT: String(FIXTURE_PORT) },
      reuseExistingServer: !process.env.CI,
    },
    {
      name: "app",
      command: `node e2e/wait-for.mjs ${FIXTURE_ORIGIN}/health && npx next build && npx next start --port ${APP_PORT}`,
      url: `http://localhost:${APP_PORT}`,
      env: {
        UPSTREAM_ORIGIN: FIXTURE_ORIGIN,
        POLYMARKET_DATA_ORIGIN: FIXTURE_ORIGIN,
        NEXT_DIST_DIR: E2E_DIST_DIR,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      timeout: BUILD_AND_START_TIMEOUT_MS,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
