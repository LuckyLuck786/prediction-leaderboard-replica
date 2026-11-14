"use client";

import { Moon, Sun } from "lucide-react";

import { toggleTheme } from "./theme";

/**
 * Both icons are rendered and CSS picks one, so the server and the browser
 * agree on the markup whatever theme is active.
 */
export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="flex h-8 w-8 items-center justify-center text-foreground hover:bg-accent"
    >
      <Moon aria-hidden className="hidden h-4 w-4 dark:block" />
      <Sun aria-hidden className="h-4 w-4 dark:hidden" />
      <span className="sr-only">Switch between dark and light theme</span>
    </button>
  );
}
