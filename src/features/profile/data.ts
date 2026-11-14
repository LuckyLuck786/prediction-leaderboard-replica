// Live trader profile. Server only. There is no snapshot for profiles: an
// unknown trader is a 404, and any other failure is shown as such.

import { fetchUpstreamJson, isNotFound } from "@/upstream/client";

import { isProfileId, type TraderProfile } from "./model";
import { parseProfile } from "./schema";

/** Upstream failed for a reason other than "no such trader". */
export class ProfileUnavailableError extends Error {
  constructor(id: string) {
    super(`Profile ${id} is unavailable right now`);
    this.name = "ProfileUnavailableError";
  }
}

export type ProfileResult =
  | { kind: "found"; profile: TraderProfile }
  | { kind: "not-found" }
  | { kind: "unavailable" };

export async function getProfile(id: string): Promise<ProfileResult> {
  if (!isProfileId(id)) return { kind: "not-found" };
  try {
    const body = await fetchUpstreamJson(`/api/trader/${encodeURIComponent(id)}`);
    const parsed = parseProfile(body, id);
    if (!parsed.ok) throw new Error(`Profile ${id} failed validation: ${parsed.error}`);
    return { kind: "found", profile: parsed.profile };
  } catch (error) {
    if (isNotFound(error)) return { kind: "not-found" };
    console.error(`Profile ${id}: unavailable.`, error);
    return { kind: "unavailable" };
  }
}
