"use client";

import { useState } from "react";

import { initialsOf } from "@/lib/format";

/**
 * A trader's picture, straight from the URL the API returns, with initials
 * when there is no picture or it fails to load.
 */
export function TraderAvatar({ name, url }: { name: string; url: string | null }) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <span
        aria-hidden
        data-testid="trader-avatar"
        className="flex h-full w-full items-center justify-center rounded-full bg-secondary text-[9px] font-medium text-secondary-foreground sm:text-xs"
      >
        {initialsOf(name)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- plain image on purpose: docs/DECISIONS.md, D-013
    <img
      data-testid="trader-avatar"
      src={url}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      // An image can fail before React attaches onError. Catch that case too.
      ref={(image) => {
        if (image?.complete && image.naturalWidth === 0) setFailed(true);
      }}
      className="h-full w-full rounded-full object-cover"
    />
  );
}
