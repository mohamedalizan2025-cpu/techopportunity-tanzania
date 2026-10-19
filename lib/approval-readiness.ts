import { deriveLifecycleState } from "./lifecycle";
import {
  hasConsistentCountryTruth,
  hasConsistentDeadlineTruth,
  hasMeaningfulDescription,
} from "./opportunity-trust";
import { parseReviewInput } from "./data/moderation-review";
import {
  reviewReadinessOf,
  type DuplicateMatch,
  type ReadinessRow,
  type TanzaniaAccessEvidence,
} from "./review-readiness";
import {
  OPPORTUNITY_CATEGORIES,
  type Opportunity,
  type OpportunityCategory,
} from "./types";

/**
 * Assisted Approval — deterministic approval-readiness classification.
 *
 * A per-pending-row READ-ONLY answer to one question: could a moderator
 * approve this record right now, using the evidence already stored, without
 * reconstructing the record? It composes the existing review-readiness gates
 * (source + duplicate) with the EXISTING approval parser
 * (`parseReviewInput`) and the existing trust checks. It never publishes,
 * approves, rejects, or mutates any row: the human confirmation and the
 * "Save review & approve" action remain the only publication path.
 *
 * State priority is fixed (first failing gate wins): source-problem →
 * possible-duplicate → deadline-unclear → needs-evidence → ready-for-approval.
 * Eligibility `unknown` or `not_eligible` never becomes ready: approval
 * requires explicit, evidenced `tanzanians_eligible` input.
 */

export type ApprovalReadinessState =
  | "ready-for-approval"
  | "needs-evidence"
  | "possible-duplicate"
  | "source-problem"
  | "deadline-unclear";

export const APPROVAL_READINESS_LABEL: Record<ApprovalReadinessState, string> = {
  "ready-for-approval": "Ready for approval",
  "needs-evidence": "Needs evidence",
  "possible-duplicate": "Possible duplicate",
  "source-problem": "Source problem",
  "deadline-unclear": "Deadline unclear",
};

/** Honesty footnote: hints for prioritization, never decisions. */
export const APPROVAL_READINESS_NOTE =
  "Approval readiness is a deterministic hint computed from stored evidence — never a verdict. Publishing still requires a moderator's confirmed “Save review & approve” action.";

export type ApprovalBlockerCode =
  | "not-pending"
  | "source-problem"
  | "possible-duplicate"
  | "deadline-expired"
  | "deadline-evidence"
  | "description"
  | "relevance-evidence"
  | "eligibility-unknown"
  | "eligibility-not-eligible"
  | "eligibility-evidence"
  | "country-evidence"
  | "category-reference"
  | "organization-reference"
  | "approval-contract";

export interface ApprovalBlocker {
  code: ApprovalBlockerCode;
  label: string;
}

export type ApprovalCheckId =
  | "pending-status"
  | "source-usable"
  | "not-duplicate"
  | "deadline-current"
  | "deadline-evidence"
  | "description-meaningful"
  | "relevance-evidence"
  | "eligibility-verified"
  | "eligibility-evidence"
  | "country-truth"
  | "category-reference"
  | "organization-reference"
  | "approval-contract";

export interface ApprovalCheck {
  id: ApprovalCheckId;
  label: string;
  pass: boolean;
  detail: string;
}

/**
 * Minimal row shape the approval checklist reads. `category` and
 * `organizationId` exist so unresolved live references can be reported
 * without inventing values.
 */
export interface ApprovalReadinessRow {
  id: string;
  title: string;
  description: string;
  url: string;
  category: OpportunityCategory;
  organizationId?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  discoveryMethod?: string | null;
  deadline: string | null;
  deadlinePrecision?: Opportunity["deadlinePrecision"];
  deadlineEvidence?: string | null;
  location?: Opportunity["location"];
  trust?: Opportunity["trust"];
  status?: Opportunity["status"];
  slug?: string | null;
}

/**
 * Live-reference context loaded once per workspace render. Passing a set is
 * fail-closed: a row whose reference is absent from the set is not ready.
 * Omitting a set skips only that live-table check; the approval parser's
 * taxonomy/UUID checks still run.
 */
export interface ApprovalReadinessContext {
  categorySlugs?: ReadonlySet<string> | null;
  organizationIds?: ReadonlySet<string> | null;
}

export interface ApprovalReadiness {
  state: ApprovalReadinessState;
  ready: boolean;
  checks: ApprovalCheck[];
  blockers: ApprovalBlocker[];
  /** Duplicate WHY context from the existing readiness gate. */
  duplicate: DuplicateMatch | null;
  /** Stored Tanzanian-access evidence; informational, never auto-verified. */
  access: TanzaniaAccessEvidence;
  /** Exact existing-parser refusal for this row, when it would refuse approval. */
  parseMessage: string | null;
}

function normalized(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function boundedEvidence(value: string | null | undefined): string {
  return normalized(value ?? "");
}

function parseableDate(value: string | null | undefined): boolean {
  if (!value) return false;
  return Number.isFinite(Date.parse(value));
}

type StoredDeadlinePrecision =
  | "unknown"
  | "date"
  | "date_time"
  | "rolling"
  | "unspecified";

/**
 * The decision form treats a missing deadline as `unknown`, regardless of the
 * stored `unspecified` default. Mirror that mapping so the checklist answers
 * the same question the form would submit, while a claimed date keeps its
 * stored precision.
 */
function storedDeadlinePrecision(row: ApprovalReadinessRow): StoredDeadlinePrecision {
  const precision = row.deadlinePrecision ?? "unknown";
  if (row.deadline === null && precision === "unspecified") return "unknown";
  return precision;
}

/**
 * Build the exact FormData the moderator's form would submit from the stored
 * row, then run the existing parser. This is the parity bridge between the
 * queue hint and the server's approval gate; it is read-only and exported so
 * tests can prove the same row the hint calls ready is accepted by the parser.
 */
export function approvalFormDataOf(row: ApprovalReadinessRow): FormData {
  const form = new FormData();
  form.set("title", row.title ?? "");
  form.set("category", row.category);
  form.set("description", row.description ?? "");
  form.set("url", row.url ?? "");
  form.set("venue_name", row.location?.venueName ?? "");
  form.set("address", row.location?.address ?? "");
  form.set("city", row.location?.city ?? "");
  form.set("region", row.location?.region ?? "");
  form.set("country", row.location?.country ?? "");
  form.set("country_verification", row.trust?.countryVerification ?? "unknown");
  form.set("country_evidence", row.trust?.countryEvidence ?? "");
  form.set("deadline", row.deadline ? row.deadline.slice(0, 10) : "");
  form.set(
    "deadline_precision",
    row.deadline
      ? "date"
      : row.deadlinePrecision === "rolling"
        ? "rolling"
        : "unknown"
  );
  form.set("deadline_evidence", row.deadlineEvidence ?? "");
  form.set("relevance_evidence", row.trust?.relevanceEvidence ?? "");
  form.set("eligibility", row.trust?.eligibilityDecision ?? "unknown");
  form.set("eligibility_evidence", row.trust?.eligibilityEvidence ?? "");
  form.set("organizationId", row.organizationId ?? "");
  return form;
}

interface DeadlineEvidenceCheck {
  pass: boolean;
  detail: string;
}

function deadlineEvidenceCheck(
  row: ApprovalReadinessRow,
  lifecycle: ReturnType<typeof deriveLifecycleState>
): DeadlineEvidenceCheck {
  const precision = storedDeadlinePrecision(row);
  const consistent = hasConsistentDeadlineTruth({
    deadline: row.deadline ?? null,
    deadlinePrecision: precision,
    deadlineEvidence: row.deadlineEvidence ?? null,
  });
  // Pipeline rows may carry "unspecified" precision with a parseable date and
  // explicit source evidence; the moderator confirms precision, so it passes.
  const reviewable =
    parseableDate(row.deadline) && boundedEvidence(row.deadlineEvidence) !== "";
  const pass = consistent || reviewable;

  if (lifecycle === "expired") {
    return { pass, detail: "Stored deadline has passed — do not approve." };
  }
  if (row.deadline === null) {
    if (precision === "rolling") {
      return {
        pass,
        detail: pass
          ? "Rolling deadline recorded with source evidence."
          : "Rolling precision requires exact source evidence.",
      };
    }
    if (precision === "date" || precision === "date_time") {
      return {
        pass: false,
        detail: "Stored precision claims a date but no deadline exists.",
      };
    }
    return {
      pass,
      detail: pass
        ? "No deadline stored (honestly unknown)."
        : "Deadline evidence exists without a stored deadline.",
    };
  }
  if (consistent) {
    return { pass: true, detail: "Deadline evidence is internally consistent." };
  }
  if (reviewable) {
    return {
      pass: true,
      detail:
        "Deadline value has source evidence; precision unverified — confirm on the official page.",
    };
  }
  return {
    pass: false,
    detail: "Deadline value is missing source evidence or malformed.",
  };
}

export function approvalReadinessOf(
  row: ApprovalReadinessRow,
  siblings: ApprovalReadinessRow[] = [],
  now: Date = new Date(),
  context: ApprovalReadinessContext = {}
): ApprovalReadiness {
  const base = reviewReadinessOf(
    row as ReadinessRow,
    siblings as ReadinessRow[],
    now
  );
  const sourceCheck = base.checks.find((check) => check.id === "source-usable")!;
  const duplicateCheck = base.checks.find((check) => check.id === "not-duplicate")!;

  const status = row.status ?? "pending";
  const pendingPass = status === "pending";

  const lifecycle = deriveLifecycleState(row.deadline ?? null, now);
  const currentPass = lifecycle !== "expired";
  const deadlineEvidence = deadlineEvidenceCheck(row, lifecycle);

  const trust = row.trust;
  const descriptionRaw = row.description ?? "";
  const descriptionPass =
    descriptionRaw.length <= 10000 &&
    hasMeaningfulDescription({
      title: row.title ?? "",
      description: descriptionRaw,
    });

  const relevanceEvidence = boundedEvidence(trust?.relevanceEvidence);
  const relevancePass =
    relevanceEvidence.length >= 10 && relevanceEvidence.length <= 1000;

  const eligibilityDecision = trust?.eligibilityDecision ?? "unknown";
  const eligibilityPass = eligibilityDecision === "tanzanians_eligible";

  const eligibilityEvidence = boundedEvidence(trust?.eligibilityEvidence);
  const eligibilityEvidencePass =
    eligibilityEvidence.length >= 10 && eligibilityEvidence.length <= 1000;

  const countryPass = hasConsistentCountryTruth({
    trust: trust ?? undefined,
    location: row.location ?? null,
  } as Opportunity);

  const categoryTaxonomyPass = (
    OPPORTUNITY_CATEGORIES as readonly string[]
  ).includes(row.category);
  const categoryLivePass =
    context.categorySlugs == null || context.categorySlugs.has(row.category);
  const categoryPass = categoryTaxonomyPass && categoryLivePass;
  const categoryDetail = !categoryTaxonomyPass
    ? "Category is outside the application taxonomy."
    : !categoryLivePass
      ? "Category is not present in the live categories table."
      : "Category is live and valid.";

  const organizationId = row.organizationId?.trim() || null;
  const organizationPass =
    organizationId === null ||
    context.organizationIds == null ||
    context.organizationIds.has(organizationId);
  const organizationDetail =
    organizationId === null
      ? "No organization attached (organizer stays unknown)."
      : context.organizationIds == null
        ? "Organization reference shape is checked by the approval parser."
        : organizationPass
          ? "Organization reference resolves to a live organization."
          : "Organization reference does not resolve to a live organization.";

  const parsed = parseReviewInput(approvalFormDataOf(row));
  const parsePass = parsed.ok;
  const parseMessage = parsed.ok ? null : parsed.message;

  const checks: ApprovalCheck[] = [
    {
      id: "pending-status",
      label: "Pending status",
      pass: pendingPass,
      detail: pendingPass
        ? "Stored status is pending — the only approvable state."
        : "Only pending records can be approved.",
    },
    {
      id: "source-usable",
      label: sourceCheck.label,
      pass: sourceCheck.pass,
      detail: sourceCheck.detail,
    },
    {
      id: "not-duplicate",
      label: duplicateCheck.label,
      pass: duplicateCheck.pass,
      detail: duplicateCheck.detail,
    },
    {
      id: "deadline-current",
      label: "Deadline still open",
      pass: currentPass,
      detail: currentPass
        ? row.deadline === null
          ? "No deadline stored — nothing proves it closed."
          : "Stored deadline has not passed."
        : "Stored deadline has passed — do not approve.",
    },
    {
      id: "deadline-evidence",
      label: "Deadline evidence consistent",
      pass: deadlineEvidence.pass,
      detail: deadlineEvidence.detail,
    },
    {
      id: "description-meaningful",
      label: "Meaningful description",
      pass: descriptionPass,
      detail: descriptionPass
        ? "Description is at least 80 characters and adds evidence beyond the title."
        : descriptionRaw.length > 10000
          ? "Description is longer than 10,000 characters."
          : "Description is too short or identical to the title.",
    },
    {
      id: "relevance-evidence",
      label: "Relevance evidence",
      pass: relevancePass,
      detail: relevancePass
        ? "Explicit technology/research relevance evidence is stored."
        : "Relevance evidence is missing or outside the 10–1,000 character bounds.",
    },
    {
      id: "eligibility-verified",
      label: "Tanzanian eligibility verified",
      pass: eligibilityPass,
      detail: eligibilityPass
        ? "Stored decision is tanzanians_eligible."
        : eligibilityDecision === "tanzanians_not_eligible"
          ? "Stored decision says Tanzanians may not apply."
          : "Tanzanian eligibility is unknown — the Discovery source is not publication authority.",
    },
    {
      id: "eligibility-evidence",
      label: "Exact eligibility evidence",
      pass: eligibilityEvidencePass,
      detail: eligibilityEvidencePass
        ? "Exact evidence that Tanzanians may apply is stored."
        : "Eligibility evidence is missing or outside the 10–1,000 character bounds.",
    },
    {
      id: "country-truth",
      label: "Country evidence consistent",
      pass: countryPass,
      detail: countryPass
        ? "Country value and verification evidence agree (empty stays unknown)."
        : "Country value contradicts its verification evidence or lacks evidence.",
    },
    {
      id: "category-reference",
      label: "Category reference valid",
      pass: categoryPass,
      detail: categoryDetail,
    },
    {
      id: "organization-reference",
      label: "Organization reference valid",
      pass: organizationPass,
      detail: organizationDetail,
    },
    {
      id: "approval-contract",
      label: "Approval parser accepts the row",
      pass: parsePass,
      detail: parsePass
        ? "Every existing approval-form check passes for the stored values."
        : parsed.message,
    },
  ];

  const ready = checks.every((check) => check.pass);

  const expired = lifecycle === "expired";
  const state: ApprovalReadinessState = !sourceCheck.pass
    ? "source-problem"
    : base.duplicate !== null
      ? "possible-duplicate"
      : expired || !deadlineEvidence.pass
        ? "deadline-unclear"
        : ready
          ? "ready-for-approval"
          : "needs-evidence";

  const blockers: ApprovalBlocker[] = [];
  const seen = new Set<ApprovalBlockerCode>();
  function add(code: ApprovalBlockerCode, label: string): void {
    if (seen.has(code)) return;
    seen.add(code);
    blockers.push({ code, label });
  }

  if (!pendingPass) add("not-pending", "Not pending — only pending records can be approved.");
  if (!sourceCheck.pass) add("source-problem", "Source unavailable, unattributed, or contaminated.");
  if (base.duplicate !== null) {
    add(
      "possible-duplicate",
      "Possible duplicate — compare with the matched record before approving."
    );
  }
  if (expired) add("deadline-expired", "Deadline expired — do not approve.");
  if (!deadlineEvidence.pass) {
    add("deadline-evidence", "Deadline evidence missing or inconsistent.");
  }
  if (!descriptionPass) add("description", "Description too short or identical to the title.");
  if (!relevancePass) add("relevance-evidence", "Relevance evidence missing.");
  if (!eligibilityPass) {
    add(
      eligibilityDecision === "tanzanians_not_eligible"
        ? "eligibility-not-eligible"
        : "eligibility-unknown",
      eligibilityDecision === "tanzanians_not_eligible"
        ? "Tanzanians are not eligible."
        : "Tanzanian eligibility not verified."
    );
  }
  if (!eligibilityEvidencePass) {
    add("eligibility-evidence", "Eligibility evidence missing.");
  }
  if (!countryPass) {
    add("country-evidence", "Country evidence missing or inconsistent.");
  }
  if (!categoryPass) add("category-reference", "Category unresolved.");
  if (!organizationPass) {
    add("organization-reference", "Organization reference unresolved.");
  }

  if (!parsePass) {
    const message = parseMessage ?? "The approval parser refused the stored values.";
    // Only suppress the exact parser message when a granular blocker already
    // covers the same failing gate; otherwise keep the parser's own words so
    // title/URL/region/length refusals are never hidden.
    const covered =
      (!eligibilityPass &&
        (message.includes("Tanzanian eligibility") ||
          message.includes("Tanzanians may apply"))) ||
      (!eligibilityEvidencePass && message.includes("Tanzanians may apply")) ||
      (!relevancePass && message.includes("technology/research relevance")) ||
      (!descriptionPass &&
        (message.includes("meaningful description") ||
          message.includes("description must add evidence"))) ||
      ((!deadlineEvidence.pass || expired) && /deadline/i.test(message)) ||
      (!countryPass &&
        (/country/i.test(message) ||
          message.includes("verified Tanzania") ||
          message.includes("classifies this opportunity"))) ||
      (!categoryPass && /category/i.test(message)) ||
      (!organizationPass && /organization/i.test(message));
    if (!covered) add("approval-contract", message);
  }

  return {
    state,
    ready,
    checks,
    blockers,
    duplicate: base.duplicate,
    access: base.access,
    parseMessage,
  };
}

/**
 * Queue priority: ready records first, then duplicates, evidence work,
 * deadline work, and source work. Ready records are ordered by the nearest
 * valid deadline (no deadline last); every other state stays
 * oldest-submitted-first (created_at, id tie-break) for deterministic,
 * navigation-stable order.
 */
export const APPROVAL_READINESS_PRIORITY: Record<ApprovalReadinessState, number> = {
  "ready-for-approval": 0,
  "possible-duplicate": 1,
  "needs-evidence": 2,
  "deadline-unclear": 3,
  "source-problem": 4,
};

function deadlineTimestamp(value: string | null): number | null {
  if (!value) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

export function orderApprovalQueue<
  T extends {
    opportunity: { createdAt: string; id: string; deadline: string | null };
    state: ApprovalReadinessState;
  }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const rank =
      APPROVAL_READINESS_PRIORITY[a.state] -
      APPROVAL_READINESS_PRIORITY[b.state];
    if (rank !== 0) return rank;

    if (
      a.state === "ready-for-approval" &&
      b.state === "ready-for-approval"
    ) {
      const aDeadline = deadlineTimestamp(a.opportunity.deadline);
      const bDeadline = deadlineTimestamp(b.opportunity.deadline);
      if (aDeadline !== null && bDeadline !== null && aDeadline !== bDeadline) {
        return aDeadline - bDeadline;
      }
      if (aDeadline !== null && bDeadline === null) return -1;
      if (aDeadline === null && bDeadline !== null) return 1;
    }

    const time =
      Date.parse(a.opportunity.createdAt) -
      Date.parse(b.opportunity.createdAt);
    if (Number.isFinite(time) && time !== 0) return time;
    return a.opportunity.id.localeCompare(b.opportunity.id);
  });
}

export interface ApprovalReadinessCounts {
  total: number;
  ready: number;
  needsEvidence: number;
  possibleDuplicate: number;
  sourceProblem: number;
  deadlineUnclear: number;
}

/** Staff-visible operational counts, computed from already-loaded rows only. */
export function countApprovalQueue(
  items: Array<{ state: ApprovalReadinessState }>
): ApprovalReadinessCounts {
  const counts: ApprovalReadinessCounts = {
    total: items.length,
    ready: 0,
    needsEvidence: 0,
    possibleDuplicate: 0,
    sourceProblem: 0,
    deadlineUnclear: 0,
  };
  for (const item of items) {
    switch (item.state) {
      case "ready-for-approval": counts.ready += 1; break;
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
 * only exact approval-state slugs; anything else (including the legacy
 * ready-for-review slug) maps to null here. The queue filter composes this
 * with the existing review-state parser for backward compatibility.
 */
export function parseApprovalReadinessState(
  raw: string | null | undefined
): ApprovalReadinessState | null {
  if (!raw) return null;
  const slug = raw.trim().toLowerCase();
  return (
    Object.keys(APPROVAL_READINESS_LABEL) as ApprovalReadinessState[]
  ).includes(slug as ApprovalReadinessState)
    ? (slug as ApprovalReadinessState)
    : null;
}
