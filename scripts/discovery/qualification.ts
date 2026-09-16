import type { CandidateOpportunity, SourceType } from "./types";
import { M31_QUALIFICATION_RULE_VERSION } from "../../lib/opportunity-trust";
import { evaluateDeadline } from "../../lib/deadline-intelligence";

export { M31_QUALIFICATION_RULE_VERSION };

/**
 * Authoritative-source admission contract (Active Lifecycle Hardening).
 *
 * No authoritative evidence = no active opportunity record. Aggregators,
 * social, community posts, news and other secondary channels may remain
 * discovery leads, but a candidate enters the active Moderator queue only
 * from a credible authoritative first-party origin OR with resolved
 * authoritative evidence (an explicit external application portal).
 * Unverified leads stay outside the active corpus; ambiguity is never an
 * active-queue state (ambiguous relevance is already withheld below).
 */
export const AUTHORITATIVE_SOURCE_TYPES: ReadonlySet<SourceType> = new Set([
  "university",
  "government",
  "ngo",
  "company",
  "innovation_hub",
  "scholarship_provider",
  "fellowship_provider",
]);

const SECONDARY_EVIDENCE_HOSTS: ReadonlySet<string> = new Set([
  "opportunitydesk.org",
  "opportunitiesforafricans.com",
  "linkedin.com",
  "instagram.com",
  "facebook.com",
  "x.com",
  "twitter.com",
  "tiktok.com",
]);

function hostOf(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

export function isAuthoritativeSourceType(sourceType?: SourceType): boolean {
  return sourceType !== undefined && AUTHORITATIVE_SOURCE_TYPES.has(sourceType);
}

/** Explicit past deadline (lifecycle "expired") — never actionable. */
export function isExpiredCandidate(
  candidate: Pick<CandidateOpportunity, "deadline">,
  now: Date = new Date()
): boolean {
  if (!candidate.deadline) return false;
  return evaluateDeadline({ deadline: candidate.deadline }, now).status === "closed";
}

/**
 * Resolved authoritative evidence for a secondary-origin candidate: an
 * explicit application URL pointing outside known secondary/aggregator
 * hosts and outside the candidate's own page host. An apply link on the
 * same aggregator host is not an external authoritative portal.
 */
export function hasAuthoritativeEvidence(candidate: CandidateOpportunity): boolean {
  const applicationUrl = candidate.detailEvidence?.applicationUrl;
  if (!applicationUrl) return false;
  const appHost = hostOf(applicationUrl);
  if (!appHost || SECONDARY_EVIDENCE_HOSTS.has(appHost)) return false;
  const candidateHost = hostOf(candidate.url);
  if (candidateHost && appHost === candidateHost) return false;
  return true;
}

/**
 * Single admission predicate for the active Moderator queue. Combines the
 * existing qualification verdict with the two active-hardening gates:
 * explicit expiry and authoritative origin/evidence. Historical rows are
 * untouched — this gates INSERTION only.
 */
export function shouldAdmitCandidate(
  candidate: CandidateOpportunity,
  qualification: OpportunityQualification,
  sourceType?: SourceType,
  now: Date = new Date()
): boolean {
  if (!shouldEnterModerationQueue(qualification)) return false;
  if (isExpiredCandidate(candidate, now)) return false;
  if (isAuthoritativeSourceType(sourceType)) return true;
  return hasAuthoritativeEvidence(candidate);
}

export type OpportunityRelevance = "relevant" | "ambiguous" | "not_relevant";
export type TanzaniaAccessibility =
  | "tanzanians_eligible"
  | "unknown"
  | "tanzanians_not_eligible";
export type QualificationEvidenceQuality = "explicit" | "limited" | "none";

export interface OpportunityQualification {
  relevance: OpportunityRelevance;
  tanzaniaAccessibility: TanzaniaAccessibility;
  evidenceQuality: QualificationEvidenceQuality;
  relevanceEvidence: string | null;
  eligibilityEvidence: string | null;
}

export interface QualificationContext {
  sourceType?: SourceType;
}

const CLEARLY_NON_OPPORTUNITY_TITLES = [
  /^(?:annual report|sua newsletters?)(?:\s+\d{4})?$/i,
  /^(?:semester .* examination|teaching) timetable\b/i,
  /^(?:phd|postdoctoral|masters?) programmes?$/i,
  /^(?:financial sector supervision|the national council of technical education|ministry of education, science and technology)$/i,
  /^university of dar es salaam$/i,
  /^(?:orodha ya waliochaguliwa|majina ya waliochaguliwa)\b/i,
];

const NEWS_REPORTING_TITLE =
  /\b(showcases?|challenged|celebrates?|visited?|signs? (?:an? )?agreement|to collaborate with|implements? vision|akagua|asisitiza|yaweka historia|yaendelea kukuza|yapongeza|yafanya kikao|kuimarisha ushirikiano|zajadili utekelezaji)\b/i;

const ACTION_CALL =
  /\b(apply|application for|applications? (?:are )?(?:open|invited)|call for applications?|call for proposals?|register|registration|submit|deadline|admissions? open|nominations? open|fomu ya maombi|tangazo la udahili)\b/i;

const TARGET_OPPORTUNITY =
  /\b(hackathons?|fellowships?|internships?|scholarships?|accelerators?|incubators?|bootcamps?|workshops?|conferences?|summits?|developer events?|tech(?:nology)? competitions?|innovation challenges?|startup challenges?|research opportunities|consultancy opportunities|volunteer opportunities|vacanc(?:y|ies)|grants? (?:for|to|programmes?|programs?|funding|challenges?|calls?)|(?:research|innovation|startup) grants?|challenges? 20\d{2}|competitions? 20\d{2})\b/i;

// Product boundary, independent from opportunity shape. A call can be real
// yet still belong on a general jobs, admissions, scholarship or events site.
// Require a positive technology/research/innovation signal; never infer fit
// from the source's country, organization, or generic opportunity wording.
const STRONG_PRODUCT_SCOPE =
  /\b(?:ai|artificial intelligence|machine learning|data(?: science| engineering| analytics)?|software|developers?|programming|coding|open source|computer(?: science| engineering| systems?)?|cyber(?:security)?|digital(?: health| skills?| transformation| innovation)?|technology|tech|technical|ict|information and communication systems?|engineering|stem|innovation|innovators?|startup|entrepreneur(?:ship|s?)?|fintech|agritech|healthtech|climatetech|robotics?|cloud computing|embedded systems?|network security|hackathons?)\b/i;

const RESEARCH_SIGNAL = /\b(?:scientific|science|research(?:ers?| opportunities?)?)\b/i;
const RESEARCH_DOMAIN =
  /\b(?:computing|computer|data|digital|engineering|energy|environment|health|medical|neuroscience|climate|technology|innovation|stem)\b/i;

// Evidence-backed nationalities seen in the live inventory. This deliberately
// stays small: broad country guessing would create false exclusions.
const EXPLICIT_OTHER_NATIONALITY_TITLE =
  /\b(?:for|open to)\s+(?:young\s+)?(?:kenyans?|nigerians?|south africans?|ghanaians?|canadians?|asians?|eritreans?)\b|\b(?:kenyans?|nigerians?|south africans?|ghanaians?|canadians?|asians?|eritreans?)\s+(?:citizens?|nationals?|residents?|graduates?|startups?|innovators?|entrepreneurs?|changemakers?|students?|women|youth)\b/i;

const EXPLICIT_OTHER_NATIONALITY_BODY =
  /\b(?:eligibility|requirements|who can apply|applicants? must)\b[\s\S]{0,240}\b(?:only\s+)?(?:kenyans?|nigerians?|south africans?|ghanaians?|canadians?|asians?|eritreans?)\b/i;

// Some programmes express the same exclusion as an exhaustive operating-
// location requirement rather than a nationality requirement. This is
// eligibility evidence only when restrictive language ("open to ... located
// in") and a small, measured foreign-jurisdiction list occur together.
// Ordinary venue/location prose remains deliberately outside this rule.
const EXPLICIT_FOREIGN_LOCATION_RESTRICTION =
  /\b(?:program|programme|opportunity|applications?)\s+(?:is|are)\s+open to\s+(?:eligible\s+)?(?:small\s+)?(?:businesses|applicants?|participants?|candidates?)\s+(?:located|based|resident)\s+in\s*:?\s*(?:canada|united states|u\.?s\.?(?:a\.)?|united kingdom|u\.?k\.?|kenya|nigeria|south africa|ghana|atlanta|charlotte|chicago|dallas(?:\/fort worth)?|los angeles|new york city|philadelphia|san diego|west virginia)\b/i;

const EXPLICIT_TANZANIA =
  /\b(?:open to|eligible (?:to|for)|applications? (?:are )?(?:open to|invited from)|for)\s+(?:all\s+)?tanzanians?\b|\btanzanian (?:citizens?|nationals?|residents?|students?|developers?|innovators?|entrepreneurs?|researchers?) (?:may|can|are eligible to)\b/i;

const EXPLICIT_AFRICA_WIDE =
  /\b(?:open to|applications? (?:are )?(?:open to|invited from)|eligible (?:to|for)|for)\s+(?:applicants? |participants? |students? |developers? |researchers? |entrepreneurs? |women )?(?:from )?(?:all |all 54 )?african (?:countries|nationals?|citizens?|residents?|applicants?|participants?|students?|developers?|researchers?|entrepreneurs?|women)\b|\b(?:you|who) are african\b[\s\S]{0,100}\b(?:reside|resident) in an african country\b|\b(?:citizens?|nationals?|residents?|refugees?)(?:\s+or\s+(?:citizens?|nationals?|residents?|refugees?))?\s+of\s+(?:an?\s+)?african\s+(?:country|union member state)\b/i;

const EXPLICIT_WORLDWIDE =
  /\b(?:open to|applications? (?:are )?(?:open to|invited from)|eligible (?:to|for))\b[\s\S]{0,100}\b(?:all countries|worldwide|all over the world|regardless of nationality)\b|\b(?:people|applicants?|candidates?)\s+of\s+all\s+nationalities\s+(?:are\s+)?(?:welcome|eligible)\s+to\s+apply\b/i;

// Exact measured contract from the 2027 WBG Young Professionals Program.
// Tanzania is an official World Bank Group member country; generic phrases
// such as "member country" remain unknown because the organization matters.
const EXPLICIT_WBG_MEMBER_COUNTRY =
  /\b(?:applicants?|candidates?)\s+must\s+(?:hold|have)\s+(?:the\s+)?nationality\s+of\s+(?:a\s+)?world bank group member countr(?:y|ies)\b/i;

const INSTITUTIONAL_SOURCE_TYPES = new Set<SourceType>([
  "university",
  "government",
  "ngo",
  "company",
  "scholarship_provider",
]);

function matchedEvidence(text: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[0]) return match[0].replace(/\s+/g, " ").trim().slice(0, 240);
  }
  return null;
}

function isClearlyStale(title: string, deadline: string | null, now: Date): boolean {
  if (deadline && new Date(deadline).getTime() >= now.getTime()) return false;
  const years = [...title.matchAll(/\b(20\d{2})\b/g)].map((match) => Number(match[1]));
  // A title whose latest cohort year is already behind the current UTC year
  // is no longer an actionable call. Cross-year titles containing the current
  // year (for example 2025/2026 during 2026) remain reviewable.
  return years.length > 0 && Math.max(...years) < now.getUTCFullYear();
}

/**
 * Deterministic qualification with separate, explainable dimensions.
 * Source country, organizer, URL, physical location, language, and the bare
 * words "international"/"global" are intentionally never eligibility input.
 */
export function qualifyOpportunity(
  candidate: CandidateOpportunity,
  now = new Date(),
  context: QualificationContext = {}
): OpportunityQualification {
  const title = candidate.title.trim();
  const detailEligibility = candidate.detailEvidence?.eligibilityEvidence ?? "";
  const body = `${candidate.title}\n${candidate.description}\n${detailEligibility}`;

  const expiredEvidence = isExpiredCandidate(candidate, now)
    ? `explicit deadline already passed: ${candidate.deadline}`.slice(0, 240)
    : null;
  const nonOpportunityEvidence = matchedEvidence(title, CLEARLY_NON_OPPORTUNITY_TITLES);
  const reportingEvidence = !ACTION_CALL.test(title) && NEWS_REPORTING_TITLE.test(title)
    ? matchedEvidence(title, [NEWS_REPORTING_TITLE])
    : null;
  const staleEvidence = isClearlyStale(title, candidate.deadline, now)
    ? `title is dated before ${now.getUTCFullYear() - 1}: ${title}`.slice(0, 240)
    : null;
  const detailHasNoAction = Boolean(candidate.detailEvidence)
    && !candidate.detailEvidence?.relevanceEvidence
    && !candidate.detailEvidence?.applicationUrl
    && !candidate.detailEvidence?.deadlineEvidence;
  const strongScopeEvidence = matchedEvidence(body, [STRONG_PRODUCT_SCOPE]);
  const researchSignal = matchedEvidence(body, [RESEARCH_SIGNAL]);
  const researchDomain = matchedEvidence(body, [RESEARCH_DOMAIN]);
  const scopeEvidence = strongScopeEvidence ?? (
    researchSignal && researchDomain
      ? `${researchSignal}; ${researchDomain}`.slice(0, 240)
      : null
  );
  const excludedAdmission = candidate.category === "admissions"
    ? "university admissions are outside the technology-opportunity scope"
    : null;
  const outsideProductScope = !scopeEvidence
    ? "candidate has no explicit technology, research, science/engineering, innovation/startup, developer, data/AI, or hackathon evidence"
    : null;

  let relevance: OpportunityRelevance = "ambiguous";
  let relevanceEvidence: string | null = null;
  if (expiredEvidence || nonOpportunityEvidence || reportingEvidence || staleEvidence || detailHasNoAction || excludedAdmission || outsideProductScope) {
    relevance = "not_relevant";
    relevanceEvidence = expiredEvidence
      ?? nonOpportunityEvidence
      ?? reportingEvidence
      ?? staleEvidence
      ?? (detailHasNoAction
        ? "detail page contains no explicit opportunity action, application link, or deadline"
        : null)
      ?? excludedAdmission
      ?? outsideProductScope;
  } else {
    const targetEvidence = candidate.detailEvidence?.relevanceEvidence
      ?? matchedEvidence(title, [ACTION_CALL, TARGET_OPPORTUNITY]);
    if (targetEvidence) {
      relevance = "relevant";
      relevanceEvidence = targetEvidence;
    }
  }

  // Institutional homepages repeatedly expose headings for courses, news,
  // projects, membership and navigation. When such a candidate has neither
  // an explicit action nor a target opportunity-family signal, ambiguity is
  // not enough to put it in the moderation queue. Aggregator feeds retain the
  // existing ambiguity path because their item boundary is itself evidence.
  if (
    relevance === "ambiguous"
    && context.sourceType !== undefined
    && INSTITUTIONAL_SOURCE_TYPES.has(context.sourceType)
  ) {
    relevance = "not_relevant";
    relevanceEvidence = "institutional source candidate has no explicit opportunity action or target-family evidence";
  }

  let tanzaniaAccessibility: TanzaniaAccessibility = "unknown";
  let eligibilityEvidence: string | null = null;
  const exclusion = matchedEvidence(title, [EXPLICIT_OTHER_NATIONALITY_TITLE])
    ?? matchedEvidence(body, [EXPLICIT_OTHER_NATIONALITY_BODY, EXPLICIT_FOREIGN_LOCATION_RESTRICTION]);
  if (exclusion) {
    tanzaniaAccessibility = "tanzanians_not_eligible";
    eligibilityEvidence = exclusion;
  } else {
    const inclusion = matchedEvidence(body, [
      EXPLICIT_TANZANIA,
      EXPLICIT_AFRICA_WIDE,
      EXPLICIT_WORLDWIDE,
      EXPLICIT_WBG_MEMBER_COUNTRY,
    ]);
    if (inclusion) {
      tanzaniaAccessibility = "tanzanians_eligible";
      eligibilityEvidence = inclusion;
    }
  }

  const evidenceQuality: QualificationEvidenceQuality =
    relevance === "not_relevant" || tanzaniaAccessibility !== "unknown"
      ? "explicit"
      : relevance === "relevant" && Boolean(candidate.evidenceUrl)
        ? "limited"
        : "none";

  return {
    relevance,
    tanzaniaAccessibility,
    evidenceQuality,
    relevanceEvidence,
    eligibilityEvidence,
  };
}

export function shouldEnterModerationQueue(qualification: OpportunityQualification): boolean {
  return qualification.relevance === "relevant"
    && qualification.tanzaniaAccessibility !== "tanzanians_not_eligible";
}
