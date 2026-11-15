// Which trader ids our routes accept. Every board decides from this whether a
// row links to a profile, and the profile route refuses anything else.

import { WALLET_ADDRESS } from "@/lib/wallet";

/**
 * A Polymarket wallet, or a Kalshi username as the source's sitemap uses them.
 * An id made only of dots is refused: "." and ".." would turn
 * /api/trader/{id} into another upstream path.
 */
const PROFILE_ID = new RegExp(`^(${WALLET_ADDRESS}|(?!\\.+$)[A-Za-z0-9._-]{1,64})$`);

export function isProfileId(value: string): boolean {
  return PROFILE_ID.test(value);
}
