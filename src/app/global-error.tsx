"use client";

import { useEffect } from "react";

import { DISCLAIMER, PRODUCT_NAME } from "@/features/shell/brand";
import { DARK_CLASS } from "@/features/shell/theme";

import "./globals.css";

/**
 * Shown only if the root layout itself fails, so it brings its own html and
 * body, and still carries the disclaimer (CLAUDE.md rule 6).
 */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error("Root layout failed.", error);
  }, [error]);

  return (
    <html lang="en" className={DARK_CLASS}>
      <body className="min-h-screen bg-background text-foreground">
        <title>{PRODUCT_NAME}</title>
        <main role="alert" className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-muted-foreground">
          <h1 className="mb-2 text-xl text-foreground">This site could not load right now</h1>
          <p>Try again in a moment.</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 border border-border px-3 py-1 text-foreground hover:bg-accent"
          >
            Try again
          </button>
          <p className="mt-16 text-xs">{DISCLAIMER}</p>
        </main>
      </body>
    </html>
  );
}
