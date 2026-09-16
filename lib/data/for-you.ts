import type { AuthenticatedUserContext } from "./supabase-auth";
import { getPublicBrowseData } from "./opportunities";
import { getTalentProfile } from "./talent-profile";
import {
  buildMatchingInput,
  hasCoreProfile,
  rankForYou,
  type RankedOpportunity,
} from "../personalization";

/**
 * The For You layer. It reads the SAME trusted, published, lifecycle-active
 * corpus that Explore uses (getPublicBrowseData with an empty query) and only
 * orders/explains a subset of it with the user's OWN profile. For You never
 * introduces new or untrusted opportunities and never restricts Explore
 * (docs/PLATFORM_ARCHITECTURE.md).
 */
export interface ForYouResult {
  /** False only when the owner-gated 0018 profile schema is not yet applied. */
  available: boolean;
  /** True when the profile carries at least one usable core signal. */
  hasProfile: boolean;
  entries: RankedOpportunity[];
}

const EMPTY_FOR_YOU: ForYouResult = {
  available: false,
  hasProfile: false,
  entries: [],
};

export async function getForYouData(
  user: AuthenticatedUserContext
): Promise<ForYouResult> {
  const [profileResult, browse] = await Promise.all([
    getTalentProfile(user),
    getPublicBrowseData({}),
  ]);

  if (!profileResult.available) return EMPTY_FOR_YOU;

  const input = buildMatchingInput(profileResult.profile);
  if (!hasCoreProfile(input)) {
    return { available: true, hasProfile: false, entries: [] };
  }

  return {
    available: true,
    hasProfile: true,
    entries: rankForYou(browse.opportunities, input),
  };
}
