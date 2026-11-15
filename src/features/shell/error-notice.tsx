"use client";

import { useEffect } from "react";

/**
 * The body of an error page: what failed, and a button to try again. The
 * error is logged in the browser console. Each error page puts this inside
 * its own shell, so the disclaimer stays on screen (CLAUDE.md rule 6).
 */
export function ErrorNotice({
  error,
  logMessage,
  title,
  detail,
  retry,
}: {
  error: unknown;
  /** Console message, so a report says which page failed. */
  logMessage: string;
  title: string;
  detail: string;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(logMessage, error);
  }, [logMessage, error]);

  return (
    <div role="alert" className="py-16 text-center text-sm text-muted-foreground">
      <h1 className="mb-2 text-xl text-foreground">{title}</h1>
      <p>{detail}</p>
      <button
        type="button"
        onClick={retry}
        className="mt-4 border border-border px-3 py-1 text-foreground hover:bg-accent"
      >
        Try again
      </button>
    </div>
  );
}
