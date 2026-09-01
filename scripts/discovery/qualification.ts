import type { CandidateOpportunity } from "./types";

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

// Evidence-backed nationalities seen in the live inventory. This deliberately
// stays small: broad country guessing would create false exclusions.
const EXPLICIT_OTHER_NATIONALITY_TITLE =
  /\b(?:for|open to)\s+(?:young\s+)?(?:kenyans?|nigerians?|south africans?|ghanaians?|canadians?|asians?|eritreans?)\b|\b(?:kenyans?|nigerians?|south africans?|ghanaians?|canadians?|asians?|eritreans?)\s+(?:citizens?|nationals?|residents?|graduates?|startups?|innovators?|entrepreneurs?|changemakers?|students?|women|youth)\b/i;

const EXPLICIT_OTHER_NATIONALITY_BODY =
  /\b(?:eligibility|requirements|who can apply|applicants? must)\b[\s\S]{0,240}\b(?:only\s+)?(?:kenyans?|nigerians?|south africans?|ghanaians?|canadians?|asians?|eritreans?)\b/i;

const EXPLICIT_TANZANIA =
  /\b(?:open to|eligible (?:to|for)|applications? (?:are )?(?:open to|invited from)|for)\s+(?:all\s+)?tanzanians?\b|\btanzanian (?:citizens?|nationals?|residents?|students?|developers?|innovators?|entrepreneurs?|researchers?) (?:may|can|are eligible to)\b/i;

const EXPLICIT_AFRICA_WIDE =
  /\b(?:open to|applications? (?:are )?(?:open to|invited from)|eligible (?:to|for)|for)\s+(?:applicants? |participants? |students? |developers? |researchers? |entrepreneurs? |women )?(?:from )?(?:all |all 54 )?african (?:countries|nationals?|citizens?|residents?|applicants?|participants?|students?|developers?|researchers?|entrepreneurs?|women)\b|\b(?:you|who) are african\b[\s\S]{0,100}\b(?:reside|resident) in an african country\b|\b(?:citizens?|nationals?|residents?|refugees?)(?:\s+or\s+(?:citizens?|nationals?|residents?|refugees?))?\s+of\s+(?:an?\s+)?african\s+(?:country|union member state)\b/i;

const EXPLICIT_WORLDWIDE =
  /\b(?:open to|applications? (?:are )?(?:open to|invited from)|eligible (?:to|for))\b[\s\S]{0,100}\b(?:all countries|worldwide|all over the world|regardless of nationality)\b/i;

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
  return years.length > 0 && Math.max(...years) <= now.getUTCFullYear() - 2;
}

/**
 * Deterministic qualification with separate, explainable dimensions.
 * Source country, organizer, URL, physical location, language, and the bare
 * words "international"/"global" are intentionally never eligibility input.
 */
export function qualifyOpportunity(
  candidate: CandidateOpportunity,
  now = new Date()
): OpportunityQualification {
  const title = candidate.title.trim();
  const detailEligibility = candidate.detailEvidence?.eligibilityEvidence ?? "";
  const body = `${candidate.title}\n${candidate.description}\n${detailEligibility}`;

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

  let relevance: OpportunityRelevance = "ambiguous";
  let relevanceEvidence: string | null = null;
  if (nonOpportunityEvidence || reportingEvidence || staleEvidence || detailHasNoAction) {
    relevance = "not_relevant";
    relevanceEvidence = nonOpportunityEvidence
      ?? reportingEvidence
      ?? staleEvidence
      ?? "detail page contains no explicit opportunity action, application link, or deadline";
  } else {
    const targetEvidence = candidate.detailEvidence?.relevanceEvidence
      ?? matchedEvidence(title, [ACTION_CALL, TARGET_OPPORTUNITY]);
    if (targetEvidence) {
      relevance = "relevant";
      relevanceEvidence = targetEvidence;
    }
  }

  let tanzaniaAccessibility: TanzaniaAccessibility = "unknown";
  let eligibilityEvidence: string | null = null;
  const exclusion = matchedEvidence(title, [EXPLICIT_OTHER_NATIONALITY_TITLE])
    ?? matchedEvidence(body, [EXPLICIT_OTHER_NATIONALITY_BODY]);
  if (exclusion) {
    tanzaniaAccessibility = "tanzanians_not_eligible";
    eligibilityEvidence = exclusion;
  } else {
    const inclusion = matchedEvidence(body, [EXPLICIT_TANZANIA, EXPLICIT_AFRICA_WIDE, EXPLICIT_WORLDWIDE]);
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
  return qualification.relevance !== "not_relevant"
    && qualification.tanzaniaAccessibility !== "tanzanians_not_eligible";
}
