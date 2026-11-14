import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Pure logic runs in node. Component tests opt into jsdom per file with
    // a `// @vitest-environment jsdom` comment.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "scripts/**/*.test.mjs"],
    alias: {
      "@/": new URL("./src/", import.meta.url).pathname,
    },
  },
});
