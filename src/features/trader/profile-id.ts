// Which trader ids our routes accept. Every board decides from this whether a
// row links to a profile, and the profile route refuses anything else.

/**
 * A Polymarket wallet, or a Kalshi username as the source's sitemap uses them.
 * An id made only of dots is refused: "." and ".." would turn
 * /api/trader/{id} into another upstream path.
 */
const PROFILE_ID = /^(0x[0-9a-fA-F]{40}|(?!\.+$)[A-Za-z0-9._-]{1,64})$/;

/** A Polymarket wallet address. */
export const WALLET = /^0x[0-9a-fA-F]{40}$/;

export function isProfileId(value: string): boolean {
  return PROFILE_ID.test(value);
}
