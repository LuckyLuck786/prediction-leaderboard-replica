import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure logic runs in node. Component tests opt into jsdom per file with
    // a `// @vitest-environment jsdom` comment.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs"],
    alias: {
      "@/": new URL("./src/", import.meta.url).pathname,
      // Next swaps this guard for an empty module in server code and fails the
      // build if client code imports it. Tests run as server code.
      "server-only": new URL("./node_modules/next/dist/compiled/server-only/empty.js", import.meta.url)
        .pathname,
    },
    // npm run test:coverage. Thresholds sit a few points under what the suite
    // reached when they were set (2026-11-16: 90.6% statements, 89.0% branches,
    // 83.4% functions, 91.2% lines), so a real drop fails CI.
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.{ts,tsx}", "src/upstream/snapshot/**"],
      reporter: ["text-summary", "html"],
      thresholds: { statements: 88, branches: 86, functions: 80, lines: 88 },
    },
  },
});
