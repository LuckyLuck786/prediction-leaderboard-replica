import type { NextConfig } from "next";

/**
 * Sent with every response (D-054). No referrer leaves the site, matching the
 * pictures' own referrer policy; no page can be framed; no device feature is
 * requested. A content security policy is not set: the inline theme script
 * would need a per-request nonce, which would make every page dynamic.
 */
export const SECURITY_HEADERS = [
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  // End-to-end tests build to their own folder (see playwright.config.ts),
  // so they never touch the output of a running development server.
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  poweredByHeader: false,
  headers: async () => [{ source: "/:path*", headers: SECURITY_HEADERS }],
};

export default nextConfig;
