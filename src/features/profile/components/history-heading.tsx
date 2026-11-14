"use client";

import { Info } from "lucide-react";
import { useId, useState } from "react";

/**
 * PROF-04 heading. The source keeps its note on Kalshi history behind an info
 * icon beside the heading, so the card is the same height with or without
 * it. Here the icon is a button that shows the note on click or tap, which
 * also works on a phone and from the keyboard.
 */
export function HistoryHeading({ note }: { note: string | null }) {
  const [open, setOpen] = useState(false);
  const noteId = useId();

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="history-heading" className="text-sm font-medium text-muted-foreground">
          P&amp;L history
        </h2>
        {note ? (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={noteId}
            aria-label={open ? "Hide the note about this history" : "About this history"}
            onClick={() => setOpen((value) => !value)}
            className="rounded p-0.5 text-muted-foreground hover:text-foreground"
          >
            <Info aria-hidden className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {note ? (
        <p id={noteId} hidden={!open} className="-mt-2 mb-3 text-xs text-muted-foreground">
          {note}
        </p>
      ) : null}
    </>
  );
}
