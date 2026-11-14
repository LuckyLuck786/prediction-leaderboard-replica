// View state for a leaderboard page and the rules for changing it.

import {
  DEFAULT_PERIOD,
  DEFAULT_QUERY,
  PAGE_SIZE,
  type ExtraColumn,
  type LeaderboardPeriod,
  type LeaderboardQuery,
  type PlatformFilter,
  type SortKey,
} from "./model";
import { nextSort } from "./query";

export interface LeaderboardState {
  period: LeaderboardPeriod;
  query: LeaderboardQuery;
  extraColumns: readonly ExtraColumn[];
  /** How many rows are shown; grows by one page per "Show more". */
  visibleCount: number;
}

export type LeaderboardAction =
  | { type: "setPeriod"; period: LeaderboardPeriod }
  | { type: "patchQuery"; patch: Partial<Omit<LeaderboardQuery, "sort">> }
  | { type: "sortBy"; key: SortKey }
  | { type: "toggleColumn"; column: ExtraColumn }
  | { type: "showMore" };

export function createInitialState(platform: PlatformFilter): LeaderboardState {
  return {
    period: DEFAULT_PERIOD,
    query: { ...DEFAULT_QUERY, platform },
    extraColumns: [],
    visibleCount: PAGE_SIZE,
  };
}

export function reduceLeaderboard(
  state: LeaderboardState,
  action: LeaderboardAction,
): LeaderboardState {
  switch (action.type) {
    // Anything that changes which rows match starts again from the first page.
    case "setPeriod":
      return { ...state, period: action.period, visibleCount: PAGE_SIZE };
    case "patchQuery":
      return {
        ...state,
        query: { ...state.query, ...action.patch },
        visibleCount: PAGE_SIZE,
      };
    case "sortBy":
      return {
        ...state,
        query: { ...state.query, sort: nextSort(state.query.sort, action.key) },
        visibleCount: PAGE_SIZE,
      };
    case "toggleColumn": {
      const showing = state.extraColumns.includes(action.column);
      const extraColumns = showing
        ? state.extraColumns.filter((column) => column !== action.column)
        : [...state.extraColumns, action.column];
      // A column that is no longer shown cannot stay the sort column.
      const sortedByRemoved = showing && state.query.sort?.key === action.column;
      return {
        ...state,
        extraColumns,
        query: sortedByRemoved ? { ...state.query, sort: null } : state.query,
      };
    }
    case "showMore":
      return { ...state, visibleCount: state.visibleCount + PAGE_SIZE };
  }
}
