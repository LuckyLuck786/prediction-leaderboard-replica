import Link from "next/link";

import { TopBarShell } from "@/features/shell/top-bar-shell";

/** The 404 page for unknown routes and traders, inside the site shell so the disclaimer stays. */
export default function NotFound() {
  return (
    <TopBarShell width="narrow">
      <div className="py-16 text-center">
        <h1 className="mb-2 text-xl">Not found</h1>
        <p className="text-sm text-muted-foreground">
          There is no page or tracked trader at this address.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/" className="underline">
            Back to the leaderboard
          </Link>
        </p>
      </div>
    </TopBarShell>
  );
}
