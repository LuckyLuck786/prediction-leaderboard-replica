"use client";

import { useEffect, useSyncExternalStore } from "react";

import { THEME_INIT_SCRIPT, applySavedTheme } from "./theme";

const subscribeToNothing = () => () => {};

/**
 * The saved-theme script, present only in the server HTML (D-028).
 *
 * The browser runs it while parsing <head>, before the first paint. During
 * hydration React adopts that existing tag (server snapshot: true), then
 * renders nothing. So React never creates a <script> element in the browser,
 * which it would not run and which made it log an error whenever it rendered
 * the root layout client-side, for example on a 404 page.
 */
export function ThemeScript() {
  const isServerHtml = useSyncExternalStore(
    subscribeToNothing,
    () => false,
    () => true,
  );
  // Belt and braces: re-apply once mounted, in case React re-rendered <html>.
  useEffect(applySavedTheme, []);
  if (!isServerHtml) return null;
  return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />;
}
