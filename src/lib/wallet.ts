// What a Polymarket wallet address looks like: one definition for every check.

/** A wallet address as a pattern fragment, for rules that accept more than wallets. */
export const WALLET_ADDRESS = "0x[0-9a-fA-F]{40}";

/** Exactly one wallet address. */
export const WALLET = new RegExp(`^${WALLET_ADDRESS}$`);
