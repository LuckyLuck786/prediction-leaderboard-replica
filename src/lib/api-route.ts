// Shared by this site's JSON routes.

const NOT_FOUND = 404;

/** True when value is one of the listed values, narrowing its type. */
export function isOneOf<T extends string>(list: readonly T[], value: string): value is T {
  return (list as readonly string[]).includes(value);
}

/**
 * The answer to a period a JSON route does not serve: JSON, like every other
 * answer of the route, not the site's HTML 404 page (BUG-085).
 */
export function unknownPeriod(known: readonly string[]): Response {
  return Response.json({ error: "Unknown period", periods: known }, { status: NOT_FOUND });
}
