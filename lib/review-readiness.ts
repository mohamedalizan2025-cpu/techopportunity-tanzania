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
}

/**
 * Minimal row shape the checklist reads. Siblings are other pending rows
 * used ONLY for the duplicate-identity check — never mutated, never hidden.
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
): ReadinessRow | null {
  const rowUrl = row.url?.trim() ?? "";
  for (const sibling of siblings) {
    if (sibling.id === row.id) continue;
    const siblingUrl = sibling.url?.trim() ?? "";
    if (rowUrl && siblingUrl && canonicalRowUrl(siblingUrl) === canonicalRowUrl(rowUrl)) {
      return sibling;
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
      return sibling;
    }
  }
  return null;
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
    ? "Shares its canonical link — or cohort year plus exact title core — with another pending row."
    : "No canonical-link or cross-source title-core match in the pending queue.";

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

  return { state, checks };
}
