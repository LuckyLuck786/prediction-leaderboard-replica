import type { ReactNode } from "react";

import { SiteFooter } from "./site-footer";

/** SHELL-01: no top navigation, an 896 px column and the site footer. */
export function LeaderboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden p-3 sm:p-5">
      <main className="mx-auto max-w-4xl">
        {children}
        <SiteFooter />
      </main>
    </div>
  );
}
