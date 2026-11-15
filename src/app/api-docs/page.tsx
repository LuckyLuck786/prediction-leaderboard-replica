import type { Metadata } from "next";

import { CopyButton } from "@/features/api-docs/copy-button";
import { CACHE_MINUTES, ENDPOINTS, FETCH_EXAMPLE } from "@/features/api-docs/endpoints";
import { DATA_CREDIT } from "@/features/shell/brand";
import { TopBarShell } from "@/features/shell/top-bar-shell";
import { INSET_FOCUS_RING } from "@/lib/focus";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "API" };

const MONO = "font-mono text-xs";

export default function ApiDocsPage() {
  return (
    <TopBarShell width="medium" backLabel="Back">
      <h1 className="mb-2 text-2xl font-bold">API</h1>
      <p className="mb-2 text-sm text-muted-foreground">
        Read-only JSON for the boards on this site. No key needed. Each response is cached on
        our server for {CACHE_MINUTES} minutes, and says whether it is live data or the saved
        snapshot.
      </p>
      <p className="mb-8 text-sm text-muted-foreground">
        These routes only reshape a public source. For anything serious, use{" "}
        <a href={DATA_CREDIT.href} target="_blank" rel="noopener noreferrer" className="underline">
          the original API
        </a>{" "}
        directly, and credit it.
      </p>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold">Example</h2>
        <div className="overflow-hidden rounded-lg bg-secondary">
          <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
            <span>JavaScript</span>
            <CopyButton text={FETCH_EXAMPLE} />
          </div>
          {/* Scrolls sideways on a phone, so it takes keyboard focus (BUG-061). */}
          <pre
            tabIndex={0}
            role="region"
            aria-label="Example request in JavaScript"
            className={cn("overflow-x-auto p-3", MONO, INSET_FOCUS_RING)}
          >
            {FETCH_EXAMPLE}
          </pre>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold">Endpoints</h2>
        <div className="space-y-4 text-sm">
          {ENDPOINTS.map((endpoint) => (
            <article key={endpoint.path} className="rounded-lg border border-border p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className={MONO}>
                  <span className="text-positive">GET</span> {endpoint.path}
                </h3>
                <CopyButton text={endpoint.path} />
              </div>
              <p className="mb-2 text-muted-foreground">{endpoint.description}</p>
              <p className="text-xs text-muted-foreground">
                Params: <span className={MONO}>{endpoint.params}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Try:{" "}
                <a href={endpoint.example} className={`${MONO} underline`}>
                  {endpoint.example}
                </a>
              </p>
              <p className="text-xs text-muted-foreground">
                Fields: <span className={MONO}>{endpoint.fields}</span>
              </p>
            </article>
          ))}
        </div>
      </section>
    </TopBarShell>
  );
}
