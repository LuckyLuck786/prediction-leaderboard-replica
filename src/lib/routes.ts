/** Local profile route for a trader id (a wallet or a Kalshi username). */
export const profilePath = (id: string) => `/account/${encodeURIComponent(id)}`;
