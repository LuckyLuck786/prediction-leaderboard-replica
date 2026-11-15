// Where the server fetches data from. Server only.
//
// Each origin can be replaced through an environment variable, which the
// end-to-end tests use to point the app at a local fixture server. Nothing
// sets them in production, where the defaults below apply.

import "server-only";

import { POLYMARKET_DATA_DEFAULT_ORIGIN } from "./settings";
import source from "./source.json";

/** Plain http is accepted only for a server on this machine, such as the test fixtures. */
const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Exported for tests: reads an origin override, refusing anything but https or a local server. */
export function originFromEnv(
  name: string,
  fallback: string,
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const value = env[name];
  if (!value) return fallback;
  const url = URL.canParse(value) ? new URL(value) : null;
  const allowed =
    url !== null &&
    (url.protocol === "https:" || (url.protocol === "http:" && LOCAL_HOSTNAMES.has(url.hostname)));
  if (!url || !allowed) {
    throw new Error(`${name} must be an https URL, or http on localhost; got "${value}"`);
  }
  return url.origin;
}

/** Where the server reads the boards and trader records; a test can point it elsewhere. */
export const UPSTREAM_ORIGIN = originFromEnv("UPSTREAM_ORIGIN", source.origin);
/** Where the server reads Polymarket P&L series; a test can point it elsewhere. */
export const POLYMARKET_DATA_ORIGIN = originFromEnv("POLYMARKET_DATA_ORIGIN", POLYMARKET_DATA_DEFAULT_ORIGIN);
