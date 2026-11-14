import type { Metadata } from "next";

import { TopBarShell } from "@/features/shell/top-bar-shell";

export const metadata: Metadata = { title: "Get listed" };

const FIELD =
  "h-[38px] w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60";
const LABEL = "mb-1.5 block text-sm font-medium";

/**
 * SUB-02: the same screen as the source's submission form, switched off.
 * The fieldset is disabled, the form has no action, and nothing is sent.
 */
export default function SubmitPage() {
  return (
    <TopBarShell width="narrow" backLabel="Back">
      <h1 className="mb-2 text-2xl font-bold">Get listed</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        On a real leaderboard this is where a trader would ask to be added.
      </p>
      <p role="note" className="mb-6 border border-border px-3 py-2 text-sm">
        This demo collects nothing, so the form is switched off.
      </p>
      <form aria-describedby="submit-off">
        <fieldset disabled className="space-y-5">
          <div>
            <label htmlFor="x-handle" className={LABEL}>
              X handle
            </label>
            <input id="x-handle" name="x-handle" placeholder="@handle" className={FIELD} />
          </div>
          <div>
            <label htmlFor="platform" className={LABEL}>
              Platform
            </label>
            <select id="platform" name="platform" className={FIELD} defaultValue="polymarket">
              <option value="polymarket">Polymarket</option>
              <option value="kalshi">Kalshi</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label htmlFor="account" className={LABEL}>
              Polymarket wallet or Kalshi username
            </label>
            <input id="account" name="account" placeholder="0x… or username" className={FIELD} />
          </div>
          <div>
            <label htmlFor="pnl" className={LABEL}>
              Profit and loss
            </label>
            <input id="pnl" name="pnl" placeholder="$125,000" className={FIELD} />
          </div>
          <button
            type="submit"
            className="h-10 w-full rounded-lg bg-primary text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            Submit
          </button>
        </fieldset>
        <p id="submit-off" className="mt-3 text-center text-xs text-muted-foreground">
          Switched off in this demo. Nothing you type is sent anywhere.
        </p>
      </form>
    </TopBarShell>
  );
}
