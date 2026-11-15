// The browser side of our own board routes (/api/boards and /api/kalshi):
// never upstream directly (CLAUDE.md, data rules).
//
// Our server builds each payload from data it has already validated, with the
// same types, so the browser checks only the outline, each row's key and the
// period. The check is written by hand so that no schema library ships to the
// browser.

import type { DataSource } from "@/upstream/data-source";

/** A board as our routes send it: the period's rows and where they came from. */
export interface BoardPayloadOf<P extends string, Row> {
  board: { period: P; lastUpdated: string; traders: Row[]; rejectedCount: number };
  source: DataSource;
}

type Fields = Record<string, unknown>;

const isFields = (value: unknown): value is Fields => typeof value === "object" && value !== null;

function isDataSource(value: unknown): value is DataSource {
  if (!isFields(value)) return false;
  if (value.kind === "live") return true;
  return (
    value.kind === "snapshot" &&
    typeof value.capturedAt === "string" &&
    typeof value.upstreamTotal === "number"
  );
}

/** What is wrong with an answer, or null when it has the payload's outline. */
function outlineProblem(body: unknown, period: string, isRow: (row: Fields) => boolean): string | null {
  if (!isFields(body) || !isFields(body.board)) return "no board";
  const { board } = body;
  if (board.period !== period) return `period ${String(board.period)}, not ${period}`;
  if (typeof board.lastUpdated !== "string") return "no lastUpdated";
  if (typeof board.rejectedCount !== "number") return "no rejectedCount";
  if (!Array.isArray(board.traders)) return "no traders";
  const badRow = board.traders.findIndex((row) => !isFields(row) || !isRow(row));
  if (badRow !== -1) return `trader ${badRow} lacks its key`;
  if (!isDataSource(body.source)) return "no data source";
  return null;
}

/**
 * One period from one of our board routes, in the browser, checked before use.
 * `isRow` checks the field each row is keyed by.
 */
export async function fetchBoardPayload<P extends string, Row>(
  path: string,
  period: P,
  isRow: (row: Fields) => boolean,
): Promise<BoardPayloadOf<P, Row>> {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path} answered ${response.status}`);
  const body: unknown = await response.json();
  const problem = outlineProblem(body, period, isRow);
  if (problem) throw new Error(`${path}: ${problem}`);
  // outlineProblem has checked every field read here.
  return body as BoardPayloadOf<P, Row>;
}
