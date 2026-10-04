import type { MatchingInput } from "../../lib/personalization";
import type { Geography } from "../../lib/taxonomy";
import type { Opportunity, OpportunityCategory } from "../../lib/types";
import type {
  DeadlineUrgency,
  EligibilityAssessment,
} from "../../lib/opportunity-intelligence/contract";

export const PUBLIC_CORPUS_EVALUATION_NOW = new Date("2026-10-04T12:00:00.000Z");

export interface PublicCorpusEvaluationCase {
  id: string;
  coverage: string[];
  opportunity: Opportunity;
  profile: MatchingInput;
  expected: {
    geography: Geography | null;
    eligibility: EligibilityAssessment["status"];
    deadlineUrgency: DeadlineUrgency["level"];
    minimumWhyFit: number;
    trustedForRuntime: boolean;
  };
}

const STUDENT_PROFILE: MatchingInput = {
  schemaVersion: 1,
  careerLevel: "student",
  fieldDiscipline: "computer science",
  sectors: ["ai-data"],
  preferredTypes: ["competition", "internship", "fellowship"],
  skills: ["python"],
  region: "Dar es Salaam",
  experienceLevel: "entry",
  goals: null,
};

const FOUNDER_PROFILE: MatchingInput = {
  schemaVersion: 1,
  careerLevel: "recent-graduate",
  fieldDiscipline: "business",
  sectors: ["entrepreneurship"],
  preferredTypes: ["fellowship"],
  skills: ["retail"],
  region: null,
  experienceLevel: "entry",
  goals: null,
};

interface PublicFactOptions {
  index: number;
  slug: string;
  title: string;
  category: OpportunityCategory;
  description: string;
  url: string;
  deadline: string | null;
  eligibility: "unknown" | "tanzanians_eligible" | "tanzanians_not_eligible";
  eligibilityEvidence: string | null;
  countryVerification: "unknown" | "verified_tanzania" | "verified_other";
  country: string | null;
  countryEvidence: string | null;
}

/**
 * Hand-verified public facts (observed live 2026-10-04), NOT database rows.
 * The harness never reads production data or private user data; these
 * snapshots pin what the public site claimed so the validator, unknown
 * handling, and redaction can be exercised against realistic inputs.
 */
function publicFact(options: PublicFactOptions): Opportunity {
  return {
    id: `11111111-1111-4111-8111-${String(options.index).padStart(12, "0")}`,
    slug: options.slug,
    title: options.title,
    category: options.category,
    organization: null,
    description: options.description,
    url: options.url,
    deadline: options.deadline,
    deadlinePrecision: options.deadline === null ? "unknown" : "date",
    deadlineEvidence: options.deadline ? `Source page states ${options.deadline}.` : null,
    location: options.country ? {
      venueName: null,
      address: null,
      city: null,
      region: null,
      country: options.country,
      latitude: null,
      longitude: null,
    } : null,
    imageUrl: null,
    status: "published",
    createdAt: "2026-09-20T00:00:00.000Z",
    sourceName: "Public shelf snapshot",
    sourceUrl: options.url,
    discoveredAt: "2026-09-20T00:00:00.000Z",
    discoveryMethod: "evaluation_snapshot",
    trust: {
      relevanceDecision: "relevant",
      relevanceEvidence: "Hand-verified public listing snapshot.",
      eligibilityDecision: options.eligibility,
      eligibilityEvidence: options.eligibilityEvidence,
      qualificationRuleVersion: "evaluation-public-v1",
      countryVerification: options.countryVerification,
      countryEvidence: options.countryEvidence,
      lastVerifiedAt: "2026-10-04T00:00:00.000Z",
      decidedBy: "00000000-0000-4000-8000-999999999999",
      decidedAt: "2026-10-04T00:00:00.000Z",
      canonicalEvidenceUrl: options.url,
    },
  };
}

export const PUBLIC_CORPUS_EVALUATION_CASES: PublicCorpusEvaluationCase[] = [
  {
    id: "public-afdb-internship",
    coverage: ["live International internship", "member-country eligibility", "deadline soon"],
    opportunity: publicFact({
      index: 1,
      slug: "afdb-internship-program-2027",
      title: "African Development Bank (AfDB) Internship Program 2027",
      category: "internship",
      description: "Applications are open for the African Development Bank Internship Program 2027 Session 1 for nationals of member countries.",
      url: "https://www.afdb.org/en/vacancy/2027-internship-program-session-1-97099",
      deadline: "2026-10-12",
      eligibility: "tanzanians_eligible",
      eligibilityEvidence: "Applicants must be nationals of AfDB member countries; Tanzania is a member.",
      countryVerification: "verified_other",
      country: "Côte d'Ivoire",
      countryEvidence: "Official vacancy based in Abidjan, Côte d'Ivoire.",
    }),
    profile: STUDENT_PROFILE,
    expected: { geography: "international", eligibility: "verified_for_tanzanians", deadlineUrgency: "urgent", minimumWhyFit: 0, trustedForRuntime: true },
  },
  {
    id: "public-mandela-washington",
    coverage: ["live flagship fellowship", "explicit Tanzania eligibility", "deadline soon"],
    opportunity: publicFact({
      index: 2,
      slug: "mandela-washington-fellowship-2027",
      title: "Mandela Washington Fellowship for Young African Leaders 2027",
      category: "fellowship",
      description: "Applications are open for young African leaders aged 25-35, including citizens of Tanzania.",
      url: "https://www.mandelawashingtonfellowship.org/2027-application-instructions/",
      deadline: "2026-10-13",
      eligibility: "tanzanians_eligible",
      eligibilityEvidence: "Tanzania is listed among the eligible African countries.",
      countryVerification: "verified_other",
      country: "United States",
      countryEvidence: "Fellowship takes place in the United States.",
    }),
    profile: FOUNDER_PROFILE,
    expected: { geography: "international", eligibility: "verified_for_tanzanians", deadlineUrgency: "urgent", minimumWhyFit: 0, trustedForRuntime: true },
  },
  {
    id: "public-anzisha",
    coverage: ["live founder fellowship", "African-citizen eligibility", "deadline upcoming"],
    opportunity: publicFact({
      index: 3,
      slug: "anzisha-fellowship-2027",
      title: "Anzisha Fellowship 2027 for Young Entrepreneurs",
      category: "fellowship",
      description: "Applications are open for young African founders aged 15-22 already running a venture in Africa.",
      url: "https://anzisha.org/apply/",
      deadline: "2026-11-10",
      eligibility: "tanzanians_eligible",
      eligibilityEvidence: "Open to citizens of an African country with a venture operating in Africa.",
      countryVerification: "verified_other",
      country: "South Africa",
      countryEvidence: "Programme run from South Africa; open across Africa.",
    }),
    profile: FOUNDER_PROFILE,
    expected: { geography: "international", eligibility: "verified_for_tanzanians", deadlineUrgency: "upcoming", minimumWhyFit: 1, trustedForRuntime: true },
  },
  {
    id: "public-imlc",
    coverage: ["live worldwide competition", "deadline far", "student fit"],
    opportunity: publicFact({
      index: 4,
      slug: "international-machine-learning-competition-2026",
      title: "International Machine Learning Competition 2026",
      category: "competition",
      description: "Open to students worldwide interested in machine learning; submission deadline 13 December 2026.",
      url: "https://opportunitydesk.org/2026/09/24/international-machine-learning-competition-2026/",
      deadline: "2026-12-13",
      eligibility: "tanzanians_eligible",
      eligibilityEvidence: "Open to students worldwide.",
      countryVerification: "unknown",
      country: null,
      countryEvidence: null,
    }),
    profile: STUDENT_PROFILE,
    expected: { geography: "international", eligibility: "verified_for_tanzanians", deadlineUrgency: "upcoming", minimumWhyFit: 1, trustedForRuntime: true },
  },
  {
    id: "public-ysp-unknown",
    coverage: ["live competition", "unknown eligibility stays unknown", "unknowns handled"],
    opportunity: publicFact({
      index: 5,
      slug: "ysp-global-policy-brief-competition-2026",
      title: "Youth for Sustainable Policy Global Policy Brief Competition 2026",
      category: "competition",
      description: "Global youth writing competition for ages 16-30; no country restriction is stated in the verified evidence.",
      url: "https://opportunitydesk.org/2026/09/02/ysp-global-policy-brief-competition-2026/",
      deadline: "2026-10-15",
      eligibility: "unknown",
      eligibilityEvidence: null,
      countryVerification: "unknown",
      country: null,
      countryEvidence: null,
    }),
    profile: STUDENT_PROFILE,
    expected: { geography: null, eligibility: "unknown", deadlineUrgency: "urgent", minimumWhyFit: 0, trustedForRuntime: false },
  },
  {
    id: "public-kectil",
    coverage: ["live youth leadership", "developing-country eligibility", "Tanzania named"],
    opportunity: publicFact({
      index: 6,
      slug: "kectil-program-2027",
      title: "Kectil Program 2027 for Young Leaders",
      category: "other",
      description: "One-year online leadership program for youth aged 17-26 living in developing countries, including Tanzania.",
      url: "https://kectil.com/apply",
      deadline: "2026-11-15",
      eligibility: "tanzanians_eligible",
      eligibilityEvidence: "Youth aged 17-26 living in developing countries; Tanzania is listed.",
      countryVerification: "unknown",
      country: null,
      countryEvidence: null,
    }),
    profile: STUDENT_PROFILE,
    expected: { geography: "national", eligibility: "verified_for_tanzanians", deadlineUrgency: "upcoming", minimumWhyFit: 0, trustedForRuntime: true },
  },
];
