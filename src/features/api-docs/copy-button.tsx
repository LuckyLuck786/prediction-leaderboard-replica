"use client";

import { useState } from "react";

const RESET_AFTER_MS = 1500;

type CopyState = "idle" | "copied" | "failed";
const LABELS: Record<CopyState, string> = { idle: "Copy", copied: "Copied", failed: "Copy failed" };

/** API-02 / API-03: copies a snippet. Clipboard access can be refused; it says so. */
export function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<CopyState>("idle");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch (error) {
      console.error("Copy to clipboard failed.", error);
      setState("failed");
    }
    setTimeout(() => setState("idle"), RESET_AFTER_MS);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className="rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:bg-accent"
    >
      {LABELS[state]}
    </button>
  );
}
