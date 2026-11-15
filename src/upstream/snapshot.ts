// The saved snapshot: what the boards show when upstream is unavailable. One
// loader for the whole file; each board then parses its own part with the
// same parser a live answer goes through.

import "server-only";

import { z } from "zod";

import rawSnapshot from "./snapshot/leaderboard.json";

const fileSchema = z.object({
  capturedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "not a date"),
  // A part that is missing fails in the board that reads it, which names it.
  periods: z.record(z.string(), z.unknown()).default({}),
  kalshi: z.record(z.string(), z.unknown()).default({}),
});

export interface SnapshotFile {
  /** ISO timestamp of when the snapshot was taken. */
  capturedAt: string;
  /** Home board answers by period, each with the `upstreamTotal` of that time. */
  periods: Record<string, unknown>;
  /** Kalshi board answers by period, each with the `upstreamTotal` of that time. */
  kalshi: Record<string, unknown>;
}

/**
 * Checks a snapshot file's outline. The snapshot is our own committed file, so
 * a broken one is a build-stopping defect: this throws, and the tests and the
 * build both fail loudly rather than ship a blank page (D-026).
 */
export function parseSnapshotFile(input: unknown): SnapshotFile {
  const file = fileSchema.safeParse(input);
  if (!file.success) throw new Error(`Saved snapshot is invalid: ${z.prettifyError(file.error)}`);
  return { ...file.data, capturedAt: new Date(file.data.capturedAt).toISOString() };
}

/** The committed snapshot file, unchecked: pass it to a board's parser. */
export const SAVED_SNAPSHOT: unknown = rawSnapshot;
