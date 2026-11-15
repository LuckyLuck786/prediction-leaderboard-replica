import type { ReactNode } from "react";

/** SHELL-03: no header or footer bar, one 768 px column centered on the screen. */
export function BareShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center overflow-x-hidden">
      <main className="mx-4 w-full max-w-3xl py-8">{children}</main>
    </div>
  );
}
