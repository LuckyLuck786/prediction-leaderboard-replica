// Where a board's data came from: upstream just now, or the saved snapshot.

/** Pages label snapshot data as such, with its date and how much of the board it holds. */
export type DataSource =
  | { kind: "live" }
  | {
      kind: "snapshot";
      /** ISO timestamp of when the snapshot was taken. */
      capturedAt: string;
      /** How many traders upstream listed for this period at that time. */
      upstreamTotal: number;
    };
