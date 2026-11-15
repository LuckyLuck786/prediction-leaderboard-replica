import { TopBarShell } from "@/features/shell/top-bar-shell";

const BLOCK = "rounded bg-muted/40 motion-safe:animate-pulse";

/**
 * Shown at once when a profile is opened and has not been built yet: profile
 * links are not prefetched (D-048), so the first visit waits for upstream.
 * Shaped like the page (avatar, month strip, chart card) so nothing jumps.
 */
export default function ProfileLoading() {
  return (
    <TopBarShell width="wide">
      <div role="status" aria-busy="true">
        <span className="sr-only">Loading the trader&apos;s profile</span>
        <div aria-hidden className="mb-8 flex items-start gap-4">
          <div className={`h-16 w-16 shrink-0 rounded-full sm:h-[76px] sm:w-[76px] ${BLOCK}`} />
          <div className="flex-1 space-y-2 pt-1">
            <div className={`h-7 w-48 ${BLOCK}`} />
            <div className={`h-5 w-64 max-w-full ${BLOCK}`} />
          </div>
        </div>
        <div aria-hidden className={`mb-6 h-[51px] w-full ${BLOCK}`} />
        <div aria-hidden className={`mb-6 h-[262px] w-full ${BLOCK}`} />
      </div>
    </TopBarShell>
  );
}
