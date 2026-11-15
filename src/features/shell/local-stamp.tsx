"use client";

import { useSyncExternalStore } from "react";

import { formatStamp } from "@/lib/format";

const subscribeToNothing = () => () => {};

/**
 * A timestamp in the viewer's own time zone. The server cannot know that
 * zone, so it renders UTC and says so; the browser then swaps in local time.
 */
export function LocalStamp({ iso }: { iso: string }) {
  const text = useSyncExternalStore(
    subscribeToNothing,
    () => formatStamp(iso),
    () => `${formatStamp(iso, "UTC")} UTC`,
  );
  return <time dateTime={iso}>{text}</time>;
}
