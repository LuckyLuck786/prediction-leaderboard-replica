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
  },
});
