// Test helpers shared by unit, component and end-to-end tests.

/** The item at `index`, or a failed test naming what was missing. */
export function nth<T>(list: readonly T[], index: number, what = "item"): T {
  const item = list[index];
  if (item === undefined) throw new Error(`No ${what} at index ${index} (found ${list.length})`);
  return item;
}
