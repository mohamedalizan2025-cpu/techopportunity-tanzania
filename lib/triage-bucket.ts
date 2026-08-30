import type { OpportunityCategory } from "./types";

/**
 * Shared moderation triage bucket logic (Milestone 10).
 *
 * Ported one-to-one from scripts/discovery/triage-queue.ts so the queue UI
 * and the CLI helper agree. Honesty rules (binding, same as the script):
 *
 *   - Buckets 1 and 8 are HEURISTIC SIGNALS from title wording only — they
 *     are prioritization hints, never truth. The moderator remains the final
 *     authority; nothing here approves, rejects, or reclassifies anything.
 *   - Bucket order is a review-order SUGGESTION only. The rendered queue and
 *     next-in-queue navigation keep their deterministic created_at ordering.
 */

export type TriageBucket = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const TRIAGE_BUCKET_LABEL: Record<TriageBucket, string> = {
  1: "actionable-looking (heuristic — verify)",
  2: "scholarship / fellowship / grant / internship",
  3: "jobs",
  4: "admissions / programmes",
  5: "hackathon / competition",
  6: "workshop / conference / tech-event",
  7: "ambiguous",
  8: "news/institutional-looking (heuristic — verify)",
};

/** Buckets worth surfacing first, in suggested review order. */
export const TRIAGE_BUCKET_PRIORITY: TriageBucket[] = [1, 2, 3, 4, 5, 6, 7, 8];

/** Compact row-badge labels for the moderation queue. */
export const TRIAGE_BUCKET_SHORT: Record<TriageBucket, string> = {
  1: "looks actionable*",
  2: "high value",
  3: "jobs",
  4: "admissions",
  5: "hackathon/competition",
  6: "event/training",
  7: "ambiguous",
  8: "news-like*",
};

/** Honesty footnote for the starred heuristic buckets (1 and 8). */
export const TRIAGE_HEURISTIC_NOTE =
  "* heuristic title signal — a prioritization hint, never a verdict. Verify before deciding.";

const ACTION_HINTS =
  /apply|application|call for|invitation|deadline|scholarship|fellowship|grant|internship|vacancy|job|ajira|nafasi za kazi|udahili|stashahada|kujiunga|registration|register|submit|open(ing)?s?\b|opportunity|opportunities|competition|challenge|hackathon|bootcamp|award|fund(ing)?\b/i;

const NEWS_HINTS =
  /^(latest|breaking)?\s*news\b|^(our )?(latest )?updates?\b|welcome note|press release|^about (us|the)|^(annual |quarterly )?report|statement (by|from|on)|^(the )?minister|^waziri|akagua|akifafanua|asema|asisitiza|kongamano la uzinduzi|photo gallery|^gallery\b|obituary|condolence/i;

export function triageBucketOf(
  category: OpportunityCategory | null,
  title: string
): TriageBucket {
  switch (category) {
    case "scholarship":
    case "fellowship":
    case "grant":
    case "internship":
      return 2;
    case "jobs":
      return 3;
    case "admissions":
      return 4;
    case "hackathon":
    case "competition":
      return 5;
    case "workshop":
    case "conference":
    case "tech-event":
      return 6;
    default:
      break;
  }
  // category `other`/unknown: fall back to title signals.
  if (NEWS_HINTS.test(title)) return 8;
  if (ACTION_HINTS.test(title)) return 1;
  return 7;
}

export interface TriageItem {
  id: string;
  bucket: TriageBucket;
}

/**
 * Pure selector: the queue item suggested to review first, honoring the
 * bucket priority and, inside a bucket, the queue's own (stable) order.
 * Returns null for an empty queue. Never mutates the queue order.
 */
export function firstSuggestedReview<T extends TriageItem>(items: T[]): T | null {
  for (const bucket of TRIAGE_BUCKET_PRIORITY) {
    const match = items.find((item) => item.bucket === bucket);
    if (match) return match;
  }
  return null;
}
