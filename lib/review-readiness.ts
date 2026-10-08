import { deriveLifecycleState } from "./lifecycle";
import {
  hasConsistentCountryTruth,
  hasConsistentDeadlineTruth,
  hasMeaningfulDescription,
  isTestOrPlaceholderOpportunity,
} from "./opportunity-trust";
import type { Opportunity } from "./types";

/**
 * Assisted Queue Approval — deterministic review-readiness classification.
 *
 * A per-pending-row READ-ONLY checklist derived from the existing
 * deterministic gates (trust consistency, lifecycle derivation, URL/title
 * identity). It prepares and prioritizes human decisions and NOTHING else:
 * it never publishes, approves, rejects, unpublishes, or mutates any
 * eligibility/trust decision. The human moderator remains the sole
 * publication authority; every state below is a hint, never a verdict.
 *
 * State priority is fixed (first failing gate wins): source-problem →
 * possible-duplicate → deadline-unclear → needs-evidence → ready-for-review.
 * Eligibility `unknown` is valid moderator input and never blocks readiness:
 * the moderator — not this module — decides eligibility from evidence.
 */

export type ReviewReadinessState =
  | "ready-for-review"
  | "needs-evidence"
  | "possible-duplicate"
  | "source-problem"
  | "deadline-unclear";

export const REVIEW_READINESS_LABEL: Record<ReviewReadinessState, string> = {
  "ready-for-review": "Ready for review",
  "needs-evidence": "Needs evidence",
  "possible-duplicate": "Possible duplicate",
  "source-problem": "Source problem",
  "deadline-unclear": "Deadline unclear",
};

/** Honesty footnote: hints for prioritization, never decisions. */
export const REVIEW_READINESS_NOTE =
  "Readiness states are deterministic hints for review order — never verdicts. Approve, reject, and unpublish stay human decisions with verbatim reasons.";

export type ReadinessCheckId =
  | "source-usable"
  | "not-duplicate"
  | "deadline-clear"
  | "evidence-complete";

export interface ReadinessCheck {
  id: ReadinessCheckId;
  label: string;
  pass: boolean;
  detail: string;
}

export interface ReviewReadiness {
  state: ReviewReadinessState;
  checks: ReadinessCheck[];
  /**
   * The duplicate explanation (WHY), when the not-duplicate gate fails.
   * Read-only hint for the moderator: which row matched, by which identity
   * rule, and where to compare. Never a verdict, never a deletion.
   */
  duplicate: DuplicateMatch | null;
  /**
   * Tanzanian-access evidence status (task checklist item
   * "eligibility/access evidence"). Informational on purpose: unknown access
   * does NOT demote readiness — the moderator verifies access on the
   * official page and records it in the decision form, which is the sole
   * enforcement point (approval requires evidenced Tanzanian eligibility).
   * Unknown can never become verified without that human evidence step.
   */
  access: TanzaniaAccessEvidence;
}

export type DuplicateKind = "canonical-url" | "title-core";

export interface DuplicateMatch {
  id: string;
  title: string;
  status: Opportunity["status"];
  slug: string | null;
  kind: DuplicateKind;
  /** True when both rows were found through the same discovery source. */
  sameSource: boolean;
}

export type TanzaniaAccessDecision = "unknown" | "tanzanians_eligible" | "tanzanians_not_eligible";

export interface TanzaniaAccessEvidence {
  decision: TanzaniaAccessDecision;
  evidence: string | null;
  /** True only when stored evidence backs the decision (either direction). */
  evidenced: boolean;
}

/**
 * Minimal row shape the checklist reads. Siblings are the duplicate-identity
 * context (other pending rows AND published rows) — read-only, never
 * mutated, never hidden, never deleted. `status`/`slug` exist only so the
 * duplicate WHY can name the matched row and link to it.
 */
export interface ReadinessRow {
  id: string;
  title: string;
  description: string;
  url: string;
  sourceName?: string | null;
  sourceUrl?: string | null;
  discoveryMethod?: string | null;
  deadline: string | null;
  deadlinePrecision?: string | null;
  deadlineEvidence?: string | null;
  location?: Opportunity["location"];
  trust?: Opportunity["trust"];
  status?: Opportunity["status"];
  slug?: string | null;
}

function validEvidenceUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/**
 * Canonical link identity, mirroring `scripts/discovery/dedupe.ts`
 * `canonicalOpportunityUrl` (hash stripped, tracking params dropped, params
 * sorted, trailing slash normalized). Ported — not imported — so the app
 * layer stays independent of the pipeline scripts, exactly like
 * `lib/triage-bucket.ts` ports its queue helper.
 */
function canonicalRowUrl(value: string): string {
  try {
    const parsed = new URL(value.trim());
    parsed.hash = "";
    for (const key of [...parsed.searchParams.keys()]) {
      if (/^(?:utm_.+|fbclid|gclid|mc_cid|mc_eid)$/i.test(key)) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.searchParams.sort();
    parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return value.trim();
  }
}

function yearsOf(value: string): Set<string> {
  return new Set(value.match(/\b20\d{2}\b/g) ?? []);
}

const TITLE_STOP_WORDS = new Set([
  "a", "an", "and", "at", "for", "in", "of", "program", "programme",
  "the", "to",
]);

/**
 * Conservative cross-source title identity, mirroring
 * `sameOpportunityTitle` in `scripts/discovery/dedupe.ts`: exact equality of
 * a substantial (≥5-token) order-independent core plus a shared cohort year.
 * Partial overlaps and short titles never match — they stay separate rows
 * for human review.
 */
function sameRowTitle(a: string, b: string): boolean {
  const sharedYear = [...yearsOf(a)].some((year) => yearsOf(b).has(year));
  if (!sharedYear) return false;
  const core = (value: string): string[] =>
    [...new Set(
      value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/\b20\d{2}(?:\s*[-/]\s*20\d{2})?\b/g, " ")
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 1 && !TITLE_STOP_WORDS.has(token))
    )].sort();
  const aTokens = core(a);
  const bTokens = core(b);
  return (
    aTokens.length >= 5 &&
    aTokens.length === bTokens.length &&
    aTokens.every((token, index) => token === bTokens[index])
  );
}

/** Source identity for the cross-source duplicate rule. */
function sourceIdentity(row: ReadinessRow): string | null {
  return (
    row.sourceUrl?.trim() ||
    row.sourceName?.trim() ||
    row.discoveryMethod?.trim() ||
    null
  );
}

function findDuplicate(
  row: ReadinessRow,
  siblings: ReadinessRow[]
): DuplicateMatch | null {
  const rowUrl = row.url?.trim() ?? "";
  for (const sibling of siblings) {
    if (sibling.id === row.id) continue;
    const siblingUrl = sibling.url?.trim() ?? "";
    if (rowUrl && siblingUrl && canonicalRowUrl(siblingUrl) === canonicalRowUrl(rowUrl)) {
      return toMatch(sibling, "canonical-url", row);
    }
    const rowSource = sourceIdentity(row);
    const siblingSource = sourceIdentity(sibling);
    if (
      rowSource &&
      siblingSource &&
      rowSource !== siblingSource &&
      row.title &&
      sibling.title &&
      sameRowTitle(row.title, sibling.title)
    ) {
      return toMatch(sibling, "title-core", row);
    }
  }
  return null;
}

function toMatch(
  sibling: ReadinessRow,
  kind: DuplicateKind,
  row: ReadinessRow
): DuplicateMatch {
  const rowSource = sourceIdentity(row);
  const siblingSource = sourceIdentity(sibling);
  return {
    id: sibling.id,
    title: sibling.title,
    status: sibling.status ?? "pending",
    slug: sibling.slug ?? null,
    kind,
    sameSource:
      rowSource !== null && rowSource !== undefined &&
      siblingSource !== null && siblingSource !== undefined &&
      rowSource === siblingSource,
  };
}

/** Plain-language WHY for one duplicate match. Never a verdict. */
export function duplicateWhy(match: DuplicateMatch): string {
  const where = match.status === "published"
    ? "the published corpus"
    : "the pending queue";
  const via = match.sameSource ? "the same discovery source" : "another source";
  return match.kind === "canonical-url"
    ? `Same canonical URL as “${match.title}” (${match.status}, ${where}) via ${via} — tracking parameters and fragments ignored, identity parameters kept.`
    : `Same substantial title core and cohort year as “${match.title}” (${match.status}, ${where}) across sources — exact core-token equality plus a shared year, never fuzzy similarity.`;
}

function parseableDate(value: string | null): boolean {
  if (!value) return false;
  const time = Date.parse(value);
  return Number.isFinite(time);
}

export function reviewReadinessOf(
  row: ReadinessRow,
  siblings: ReadinessRow[] = [],
  now: Date = new Date()
): ReviewReadiness {
  const evidenceUrl =
    row.trust?.canonicalEvidenceUrl?.trim() || row.url?.trim() || null;
  const attributed = Boolean(
    row.sourceName?.trim() || row.sourceUrl?.trim() || row.discoveryMethod?.trim()
  );
  const contaminated = isTestOrPlaceholderOpportunity({
    title: row.title ?? "",
    description: row.description ?? "",
    url: row.url ?? "",
    sourceName: row.sourceName ?? null,
    discoveryMethod: row.discoveryMethod ?? null,
  });

  const sourcePass =
    validEvidenceUrl(evidenceUrl) && attributed && !contaminated;
  const sourceDetail = !validEvidenceUrl(evidenceUrl)
    ? "No usable http/https evidence link on this row."
    : !attributed
      ? "No source attribution (registry source, source link, or discovery method)."
      : contaminated
        ? "Title/shape matches the test-or-placeholder contamination guard."
        : `Evidence link present${row.sourceName?.trim() ? ` via ${row.sourceName.trim()}` : ""}.`;

  const duplicate = sourcePass ? findDuplicate(row, siblings) : null;
  const duplicateDetail = duplicate
    ? duplicateWhy(duplicate)
    : "No canonical-link or cross-source title-core match in the review corpus (pending + published).";

  const lifecycle = deriveLifecycleState(row.deadline ?? null, now);
  const consistentDeadline = hasConsistentDeadlineTruth({
    deadline: row.deadline ?? null,
    deadlinePrecision:
      (row.deadlinePrecision as "unknown" | "date" | "rolling" | undefined) ??
      "unknown",
    deadlineEvidence: row.deadlineEvidence ?? null,
  });
  // Pipeline rows may carry a plain source value with "unspecified"
  // precision: a parseable date plus explicit source evidence is reviewable
  // (the moderator verifies precision), so it passes with that note.
  const reviewableDeadlineValue =
    parseableDate(row.deadline) &&
    Boolean(row.deadlineEvidence && row.deadlineEvidence.trim().length > 0);
  const deadlinePass =
    lifecycle !== "expired" && (consistentDeadline || reviewableDeadlineValue);
  const deadlineDetail =
    lifecycle === "expired"
      ? "Stored deadline has passed — verify expiry against the source before deciding."
      : !row.deadline
        ? "No deadline evidence stored (honestly unknown)."
        : consistentDeadline
          ? "Deadline evidence is internally consistent."
          : reviewableDeadlineValue
            ? "Deadline value with source evidence; precision unverified — confirm on the official page."
            : "Deadline value is malformed or contradicts its evidence.";

  const trust = row.trust;
  const accessDecision = (trust?.eligibilityDecision ?? "unknown") as TanzaniaAccessDecision;
  const accessEvidenceRaw = (trust?.eligibilityEvidence ?? "").trim();
  const access: TanzaniaAccessEvidence = {
    decision: accessDecision,
    evidence: accessEvidenceRaw === "" ? null : trust?.eligibilityEvidence ?? null,
    evidenced:
      (accessDecision === "tanzanians_eligible" || accessDecision === "tanzanians_not_eligible") &&
      accessEvidenceRaw !== "",
  };
  const evidencePass =
    Boolean(trust) &&
    Boolean(trust?.relevanceEvidence && trust.relevanceEvidence.trim().length > 0) &&
    hasMeaningfulDescription({
      title: row.title ?? "",
      description: row.description ?? "",
    }) &&
    hasConsistentCountryTruth({
      trust: trust ?? undefined,
      location: row.location ?? null,
    } as Opportunity);
  const evidenceDetail = !trust
    ? "No qualification evidence stored (relevance never assessed)."
    : !trust.relevanceEvidence?.trim()
      ? "Relevance assessed but no relevance evidence recorded."
      : !hasMeaningfulDescription({ title: row.title ?? "", description: row.description ?? "" })
        ? "Description too short or identical to the title."
        : !hasConsistentCountryTruth({
            trust,
            location: row.location ?? null,
          } as Opportunity)
          ? "Country value contradicts its verification evidence."
          : "Description, relevance evidence, and country truth present; eligibility stays for the moderator.";

  const checks: ReadinessCheck[] = [
    { id: "source-usable", label: "Usable source evidence", pass: sourcePass, detail: sourceDetail },
    { id: "not-duplicate", label: "No duplicate signal", pass: duplicate === null, detail: duplicateDetail },
    { id: "deadline-clear", label: "Deadline state clear", pass: deadlinePass, detail: deadlineDetail },
    { id: "evidence-complete", label: "Review evidence complete", pass: evidencePass, detail: evidenceDetail },
  ];

  const state: ReviewReadinessState = !sourcePass
    ? "source-problem"
    : duplicate !== null
      ? "possible-duplicate"
      : !deadlinePass
        ? "deadline-unclear"
        : !evidencePass
          ? "needs-evidence"
          : "ready-for-review";

  return { state, checks, duplicate, access };
}

/**
 * Queue priority for review work: READY items carry complete evidence for a
 * fast human decision (approve or reject), so they come first; every other
 * state needs more moderator work, ordered by how decisive that work is.
 * Within a state the queue keeps oldest-submitted-first (created_at, id
 * tie-break), so the order stays deterministic and navigation-stable. The
 * queue page and next-in-queue navigation must both use this order.
 */
export const REVIEW_READINESS_PRIORITY: Record<ReviewReadinessState, number> = {
  "ready-for-review": 0,
  "possible-duplicate": 1,
  "needs-evidence": 2,
  "deadline-unclear": 3,
  "source-problem": 4,
};

export function orderReviewQueue<
  T extends { opportunity: { createdAt: string; id: string }; state: ReviewReadinessState }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const rank = REVIEW_READINESS_PRIORITY[a.state] - REVIEW_READINESS_PRIORITY[b.state];
    if (rank !== 0) return rank;
    const time = Date.parse(a.opportunity.createdAt) - Date.parse(b.opportunity.createdAt);
    if (Number.isFinite(time) && time !== 0) return time;
    return a.opportunity.id.localeCompare(b.opportunity.id);
  });
}

export interface ReviewReadinessCounts {
  total: number;
  ready: number;
  needsEvidence: number;
  possibleDuplicate: number;
  sourceProblem: number;
  deadlineUnclear: number;
}

/** Staff-visible operational counts, computed from already-loaded rows only. */
export function countReviewQueue(
  items: Array<{ state: ReviewReadinessState }>
): ReviewReadinessCounts {
  const counts: ReviewReadinessCounts = {
    total: items.length,
    ready: 0,
    needsEvidence: 0,
    possibleDuplicate: 0,
    sourceProblem: 0,
    deadlineUnclear: 0,
  };
  for (const item of items) {
    switch (item.state) {
      case "ready-for-review": counts.ready += 1; break;
      case "needs-evidence": counts.needsEvidence += 1; break;
      case "possible-duplicate": counts.possibleDuplicate += 1; break;
      case "source-problem": counts.sourceProblem += 1; break;
      case "deadline-unclear": counts.deadlineUnclear += 1; break;
    }
  }
  return counts;
}

/**
 * Hostile-input-safe parser for the `readiness` queue filter param. Accepts
 * only the exact state slugs; anything else (including legacy values) maps
 * to null — no constraint, never a guess.
 */
export function parseReviewReadinessState(
  raw: string | null | undefined
): ReviewReadinessState | null {
  if (!raw) return null;
  const slug = raw.trim().toLowerCase();
  return (Object.keys(REVIEW_READINESS_LABEL) as ReviewReadinessState[]).includes(
    slug as ReviewReadinessState
  )
    ? (slug as ReviewReadinessState)
    : null;
}
