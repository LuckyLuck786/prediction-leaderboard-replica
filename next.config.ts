import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // End-to-end tests build to their own folder (see playwright.config.ts),
  // so they never touch the output of a running development server.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
};

export default nextConfig;
