import type { NextConfig } from "next";

/**
 * A partial Content-Security-Policy (D-060): what it can restrict without
 * breaking the site. No page may frame this one, no plugin or <base> can be injected,
 * no form submits anywhere (the submit form is disabled, CLAUDE.md rule 7),
 * and the browser connects only to this site's own routes (CLAUDE.md, data
 * rules). Scripts and images are not restricted: Next.js inlines scripts,
 * and trader pictures load from the URL the API gives (D-013). Restricting
 * scripts would need a per-request nonce for the inline theme script, which
 * would make every page dynamic.
 */
const CONTENT_SECURITY_POLICY = [
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'none'",
  "connect-src 'self'",
].join("; ");

/**
 * Sent with every response (D-054). No referrer leaves the site, matching the
 * pictures' own referrer policy; no page can be framed; no device feature is
 * requested.
 */
export const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
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
