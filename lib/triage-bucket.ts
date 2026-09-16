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
  2: "scholarship / fellowship / grant / internship / accelerator / research call",
  3: "jobs",
  4: "admissions / programmes",
  5: "hackathon / competition / public-sector challenge",
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
    case "accelerator":
    case "research-call":
      return 2;
    case "jobs":
      return 3;
    case "admissions":
      return 4;
    case "hackathon":
    case "competition":
    case "public-challenge":
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

/**
 * Normalizer shared by the furniture review flag below: lowercase,
 * non-alphanumeric runs collapsed to one space. Stored titles keep their
 * original punctuation (including aggregator HTML entities); matching always
 * runs both sides through this same function.
 */
export function normalizeQueueTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Frozen site-furniture title set (Bulk Production Cleanup milestone).
 *
 * Exact normalized titles of the 55 high-confidence page-furniture rows
 * reviewed one by one from live production evidence (site navigation,
 * section headers, timetables, galleries, reports, and similar page
 * furniture that cannot denote a bounded opportunity under any reading).
 * Like every triage signal this is a prioritization hint, never truth: the
 * `flag=furniture` queue filter only narrows the visible list so a moderator
 * can batch-review these rows, and nothing here approves, rejects, or
 * reclassifies anything. Extending this set requires its own record-by-record
 * review; never add a title that could plausibly name a real call.
 */
const FURNITURE_QUEUE_TITLES: ReadonlySet<string> = new Set(
  [
    "Quick Links",
    "Latest News",
    "Monetary Policy",
    "Payment &amp; Settlement systems",
    "Financial Markets",
    "Advertisements",
    "Financial Sector Supervision",
    "Campus Life",
    "Teaching Timetable",
    "SEMESTER II EXAMINATION TIMETABLE FOR THE 2025/2026 ACADEMIC YEAR",
    "OUR VISION",
    "News &amp; Events",
    "Shortcut Links",
    "Contact Us",
    "Useful links",
    "Empowering Tanzania's Digital Future.",
    "Publications",
    "More from Ifakara Health Institute",
    "ISO 9001:2015",
    "Data Repository",
    "Contribution to New Knowledge",
    "Latest Events",
    "Our Projects",
    "We're a Registered Charity Organization in Tanzania",
    "Ground Breaking Research",
    "Tovuti Zinazohusiana",
    "Kurasa za Karibu",
    "Social Media",
    "Official Map of Tanzania",
    "ANNOUNCEMENTS",
    "POPULAR LINKS",
    "SUA NEWSLETTERS",
    "USEFUL INFORMATION",
    "Study Options",
    "About the University",
    "Help &amp; Support",
    "Subfooter Menu",
    "Top Bar Menu",
    "University School",
    "Other Resources",
    "ANNUAL REPORT 2024",
    "Main navigation",
    "Our Quick Links",
    "Other Links",
    "Welcome Note",
    "Latest Announcements",
    "Upcoming Events",
    "VETA Gallery",
    "Join the community",
    "Explore our involvement",
    "View our events",
  ].map(normalizeQueueTitle)
);

/**
 * Furniture REVIEW FLAG: true only for an exact frozen-set title match.
 * Display-and-filter aid only; the moderator remains the final authority.
 */
export function isFurnitureQueueItem(title: string): boolean {
  return FURNITURE_QUEUE_TITLES.has(normalizeQueueTitle(title));
}
