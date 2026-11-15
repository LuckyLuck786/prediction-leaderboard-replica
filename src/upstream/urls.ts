// The one rule for URLs that come from upstream. Every schema uses it, so a
// picture or link is treated the same on the boards and on profiles.

import source from "./source.json";

/**
 * An https URL, or null. Relative paths (the Kalshi board sends some pictures
 * as "/api/kalshi-avatar/...") resolve against the upstream origin. The query
 * string is kept: an image host may need it.
 */
export function safeHttpsUrl(value: string | null | undefined): string | null {
  if (!value || !URL.canParse(value, source.origin)) return null;
  const url = new URL(value, source.origin);
  return url.protocol === "https:" ? url.toString() : null;
}

/**
 * For outbound links: an absolute https URL only, never resolved against the
 * upstream origin (a bare X handle must not become a link to the data
 * source's site), with the query string and fragment removed, so no referral
 * or tracking parameter is passed on (DEV-05).
 */
export function cleanLinkUrl(value: string | null | undefined): string | null {
  if (!value || !URL.canParse(value)) return null;
  const url = new URL(value);
  if (url.protocol !== "https:") return null;
  url.search = "";
  url.hash = "";
  return url.toString();
}
