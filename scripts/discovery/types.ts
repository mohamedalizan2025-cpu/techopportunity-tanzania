export type SourceType =
  | "university"
  | "government"
  | "ngo"
  | "company"
  | "innovation_hub"
  | "hackathon_platform"
  | "scholarship_provider"
  | "fellowship_provider"
  | "conference"
  | "other";

export interface SourceRecord {
  id: string;
  name: string;
  base_url: string;
  source_type: SourceType;
  country: string;
  region: string | null;
  active: boolean;
  last_checked_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
}

/**
 * Evidence channels. A Source (registry row) is WHO publishes; an evidence
 * document is WHERE a specific claim was found. The opportunity domain
 * downstream never cares which channel produced a candidate — only the
 * adapter layer does. "website"/"feed" are implemented; "api" and "social"
 * are reserved for future owner-approved channels and are never written
 * until such a channel exists.
 */
export type EvidenceChannel = "website" | "feed" | "api" | "social";

/**
 * What a single URL represents in the evidence chain:
 * - "source-base": the registry source's own base page/feed
 * - "evidence-document": a different document that testifies about the
 *   opportunity (e.g. the roundup page listing it). The candidate's own
 *   opportunity URL is recorded separately on the row (`url`).
 */
export type ReferenceKind = "source-base" | "evidence-document";

export interface CandidateOpportunity {
  title: string;
  description: string;
  category: string;
  organization: string | null;
  url: string;
  deadline: string | null;
  venueName: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  /**
   * Physical location country. null = UNKNOWN — discovery never fabricates
   * a country; the row is inserted without the field until a moderator
   * verifies one (migration 0008 makes the column nullable). Evidence
   * comes only from extracted structured data (e.g. JSON-LD address).
   */
  country: string | null;
  sourceId: string;
  /**
   * The fetched document this candidate was extracted from. Stored as
   * `source_url` on the row: for direct extraction it is the registry
   * source's base URL; for roundup children it is the parent page that
   * listed the opportunity (evidence chain: source → parent → item).
   */
  sourceUrl: string;
  /**
   * The document that testifies about this opportunity. Equals sourceUrl
   * today (the pipeline has no distinct evidence documents yet); becomes
   * the anchor when future channels deliver evidence separate from the
   * fetch target. NOT yet persisted — the future references table
   * (migration 0006) is its home.
   */
  evidenceUrl: string | null;
  /** What sourceUrl represents in the evidence chain. */
  referenceKind: ReferenceKind;
  discoveryMethod: "rss" | "json-ld" | "html" | "sitemap";
  /** Rich evidence from one bounded individual-detail fetch, when available. */
  detailEvidence?: DetailEvidence;
}

export type DetailDeadlineKind = "date" | "rolling" | "unknown";

export interface DetailEvidence {
  canonicalTitle: string | null;
  opportunityUrl: string;
  evidenceUrl: string;
  description: string | null;
  applicationUrl: string | null;
  deadline: string | null;
  deadlineKind: DetailDeadlineKind;
  deadlineEvidence: string | null;
  location: string | null;
  eligibilityEvidence: string | null;
  relevanceEvidence: string | null;
}

/**
 * Structured per-source run result. Lets operators reconstruct a historical
 * run from the JSON summary alone: distinguish successful-zero from fetch
 * failure, extraction yield, noise rejection, duplicates and DB failure.
 */
export interface SourceRunResult {
  sourceId: string;
  name: string;
  ok: boolean;
  /** Every candidate extracted, before any gate. */
  candidatesFound: number;
  /** Candidates rejected by validation/noise gates. */
  noiseRejected: number;
  /** Candidates that passed normalization, detail acquisition and validation. */
  structurallyValidCandidates: number;
  /** Structurally valid candidates retaining a source/evidence document. */
  evidencePresent: number;
  /** Structurally valid candidates with explicit deadline/rolling evidence. */
  deadlineEvidencePresent: number;
  /** Candidates whose qualification produced explicit eligibility evidence. */
  eligibilityEvidencePresent: number;
  /** Candidates whose qualification produced explicit relevance evidence. */
  relevanceEvidencePresent: number;
  /** Candidates with an explicit application URL from bounded detail evidence. */
  applicationEvidencePresent: number;
  /** Clearly non-relevant institutional/news/stale records. */
  relevanceRejected: number;
  /** Explicit evidence limits applicants to a nationality excluding Tanzania. */
  eligibilityRejected: number;
  /** Surviving candidates with no eligibility evidence; kept for moderation. */
  eligibilityUnknown: number;
  /** Unique one-hop detail documents fetched for this source. */
  detailFetches: number;
  detailSucceeded: number;
  detailFailures: number;
  detailDeadlineFound: number;
  detailEligibilityFound: number;
  detailApplicationFound: number;
  /** Candidates that passed validation but duplicate existing/batch rows. */
  duplicatesSkipped: number;
  /** Candidates that passed qualification and dedupe, before category lookup. */
  deduplicatedCandidates: number;
  /** Category-resolved candidates ready for the pending insert. */
  validCandidates: number;
  /** Valid candidates skipped only because their category seed is missing. */
  categorySkipped: number;
  /** Actionable yield: rows actually inserted as pending. */
  insertedPending: number;
  /** Whether the source-registry health update itself succeeded. */
  sourceHealthUpdated: boolean;
  sourceHealthError: string | null;
  error: string | null;
}

export interface DiscoverySummary {
  startedAt: string;
  finishedAt: string | null;
  sourcesChecked: number;
  sourcesAttempted: number;
  sourcesSucceeded: number;
  sourcesFailed: number;
  candidatesFound: number;
  noiseRejected: number;
  structurallyValidCandidates: number;
  evidencePresent: number;
  deadlineEvidencePresent: number;
  eligibilityEvidencePresent: number;
  relevanceEvidencePresent: number;
  applicationEvidencePresent: number;
  deduplicatedCandidates: number;
  validCandidates: number;
  insertedPending: number;
  duplicatesSkipped: number;
  categorySkipped: number;
  relevanceRejected: number;
  eligibilityRejected: number;
  eligibilityUnknown: number;
  detailFetches: number;
  detailSucceeded: number;
  detailFailures: number;
  detailDeadlineFound: number;
  detailEligibilityFound: number;
  detailApplicationFound: number;
  sourceHealthFailures: number;
  errors: number;
  perSource: SourceRunResult[];
}
