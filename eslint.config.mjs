import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Rules that read the types: unhandled promises, unsafe `any`, needless casts.
  {
    files: ["**/*.{ts,tsx,mts}"],
    extends: [tseslint.configs.recommendedTypeCheckedOnly],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Test doubles and Next's config callbacks are async by contract, with
      // nothing to await inside.
      "@typescript-eslint/require-await": "off",
    },
  },
  // Feature boundaries. Shared code lives in src/lib, src/upstream and the
  // trader and shell features. A feature never imports another feature, so no
  // two features depend on each other. Two exceptions: the head-to-head page
  // builds on the profile's history, and the API page documents every
  // feature's data.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: ["./src/lib", "./src/upstream"],
              from: ["./src/features", "./src/app"],
              message: "Shared code must not depend on a feature or a route.",
            },
            {
              target: "./src/features",
              from: "./src/app",
              message: "Features must not depend on routes.",
            },
            ...[
              ["trader", []],
              ["shell", []],
              ["leaderboard", ["shell", "trader"]],
              ["kalshi", ["shell", "trader"]],
              ["profile", ["shell", "trader"]],
              ["battle", ["profile", "shell", "trader"]],
            ].map(([feature, allowed]) => ({
              target: `./src/features/${feature}`,
              from: "./src/features",
              except: [feature, ...allowed].map((name) => `./${name}`),
              message: `The ${feature} feature may import only: ${[...allowed, "src/lib", "src/upstream"].join(", ")}.`,
            })),
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    // Our additions: end-to-end build output and reports.
    ".next-e2e/**",
    "playwright-report/**",
    "test-results/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
