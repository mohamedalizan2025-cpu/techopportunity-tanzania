import type { Opportunity, OpportunityCategory } from "./types";
import type { CountryVerification, EligibilityDecision } from "./opportunity-trust";

/**
 * Opportunity taxonomy: three orthogonal dimensions.
 *
 *   1. TYPE      — what kind of actionable opportunity it is. This is the
 *                  existing `categories` lookup (OPPORTUNITY_CATEGORIES), the
 *                  single source of truth shared with the DB, discovery and
 *                  the submit form. Reused, never duplicated.
 *   2. GEOGRAPHY — exactly two top-level groups, National / International.
 *                  Cities and regions (Zanzibar, Dar es Salaam, Arusha, …)
 *                  stay metadata/filter dimensions, never top-level groups.
 *   3. SECTOR    — the subject area, classified SEPARATELY from type.
 *
 * Geography and sector are DERIVED, deterministic pure functions of evidence
 * already stored on the row (country, country_verification, eligibility,
 * eligibility_evidence, title, description, category). No new columns and no
 * manual tagging: every opportunity — including each new Discovery candidate —
 * is classified automatically the moment its evidence exists, and the same
 * classifier powers public browse, the Moderator queue and discovery logging.
 *
 * HONESTY (ENGINEERING_RULES data-integrity rule 4): unknown stays unknown.
 * Geography is never inferred from a foreign country, a source domain, or the
 * bare words "international"/"global"/"worldwide" alone; sector is never
 * forced. An unclassifiable dimension returns null and fails safe — it never
 * creates an "Ambiguous" workflow item and never blocks admission.
 */

// --- Geography: exactly two top-level groups -------------------------------

export const GEOGRAPHY_GROUPS = ["national", "international"] as const;
export type Geography = (typeof GEOGRAPHY_GROUPS)[number];

export const GEOGRAPHY_LABELS: Record<Geography, string> = {
  national: "National",
  international: "International",
};

/** Short explanatory copy for the public/moderator filter controls. */
export const GEOGRAPHY_HINTS: Record<Geography, string> = {
  national: "Tanzania-based or Tanzania-focused",
  international: "Foreign/global with evidenced access for Tanzanians",
};

// --- Sector: practical, extensible, independent from type ------------------

export const SECTORS = [
  "ai-data",
  "cybersecurity",
  "engineering",
  "health",
  "agriculture",
  "mining",
  "blue-economy",
  "climate-environment",
  "tourism",
  "education",
  "finance",
  "energy",
  "entrepreneurship",
] as const;
export type Sector = (typeof SECTORS)[number];

export const SECTOR_LABELS: Record<Sector, string> = {
  "ai-data": "AI / Data",
  cybersecurity: "Cybersecurity",
  engineering: "Engineering",
  health: "Health",
  agriculture: "Agriculture",
  mining: "Mining",
  "blue-economy": "Blue Economy",
  "climate-environment": "Climate / Environment",
  tourism: "Tourism",
  education: "Education",
  finance: "Finance",
  energy: "Energy",
  entrepreneurship: "Entrepreneurship",
};

/**
 * The evidence geography is derived from. Every field is optional so the same
 * function serves the app (a full Opportunity, trust present only when the M31
 * schema is live) and discovery (a candidate plus its qualification verdict).
 */
export interface GeographyEvidence {
  country?: string | null;
  countryVerification?: CountryVerification | "unknown" | null;
  eligibility?: EligibilityDecision | "unknown" | null;
  eligibilityEvidence?: string | null;
}

/**
 * Positive Tanzania-focus wording inside eligibility evidence ("open to
 * Tanzanians", "Tanzanian citizens may apply"). Distinguishes a Tanzania-focused
 * call — National — from an Africa-wide/worldwide call that merely happens to be
 * open to Tanzanians — International. Absence of the token is NOT evidence of
 * anything; it simply leaves the row to the country/eligibility rules below.
 */
const TANZANIA_FOCUS = /\btanzania(?:n|ns)?\b/i;

/**
 * National / International classification.
 *
 *   national      — Tanzania-based or Tanzania-focused on positive evidence:
 *                   a verified/structured Tanzania country, or eligibility
 *                   evidence explicitly naming Tanzania(n)s.
 *   international — NOT Tanzania-based AND Tanzanians have EVIDENCED access
 *                   (eligibility `tanzanians_eligible`, i.e. an explicit
 *                   Tanzania / Africa-wide / worldwide / WBG-member statement).
 *                   Never inferred from a foreign country or generic worldwide
 *                   wording alone.
 *   null          — unknown. Fails safe: no group, no ambiguous workflow. The
 *                   row still enters/keeps its normal pending lifecycle and a
 *                   moderator can resolve country/eligibility later.
 */
export function deriveGeography(evidence: GeographyEvidence): Geography | null {
  const country = evidence.country?.trim().toLowerCase() ?? null;
  const verification = evidence.countryVerification ?? "unknown";
  const eligibility = evidence.eligibility ?? "unknown";

  if (verification === "verified_tanzania" || country === "tanzania") {
    return "national";
  }
  if (TANZANIA_FOCUS.test(evidence.eligibilityEvidence ?? "")) {
    return "national";
  }
  if (eligibility === "tanzanians_eligible") {
    return "international";
  }
  return null;
}

/**
 * Sector patterns, ordered most-distinctive first so a strong signal wins over
 * a broad one (deterministic first match). Deliberately narrow: a sector is a
 * filter hint derived from text, so precision is preferred over recall and an
 * unmatched row stays null rather than being forced into a catch-all. Adding a
 * sector later is one entry here plus one label above — extensible, not giant.
 */
const SECTOR_PATTERNS: Array<[Sector, RegExp]> = [
  ["cybersecurity", /cyber[\s-]?security|\binfosec\b|network security|ethical hacking|penetration test(?:ing|s)?|\bcisa\b|data protection|cyber\s?(?:defence|defense|crime|resilience)/i],
  ["ai-data", /\bai\b|artificial intelligence|machine learning|deep learning|data scien|data analytic|big data|generative ai|\bgenai\b|neural network|computer vision|\bnlp\b|natural language processing|open data|data engineer|data-driven|data visuali|\bdatasets?\b|data management|data governance/i],
  ["blue-economy", /blue economy|fisher(?:y|ies)|aquaculture|\bmarine\b|\boceans?\b|coastal|lake (?:victoria|tanganjika|nyasa|malawi)|seaweed|maritime|\bports?\b/i],
  ["mining", /\bmining\b|mineral|extractive|geolog|\bores?\b|petroleum|oil and gas|tanzanite|\bgold\b|diamond|quarry/i],
  ["energy", /\benergy\b|electrif|solar|\bwind (?:power|energy|farm)\b|hydro(?:power|electric)?|natural gas|biomass|power (?:generation|grid|plant|sector)|geothermal/i],
  ["climate-environment", /\bclimate\b|environment|renewable|carbon|sustainab|conservation|biodivers|recycl|waste management|green (?:economy|energy|development|growth|jobs)|deforest|reforest|wetland|resilien/i],
  ["agriculture", /agricultur|agribusiness|agritech|\bfarming\b|\bcrops?\b|livestock|food security|horticulture|irrigation|poultry|dairy|\bmaize\b|\brice\b|pastoral/i],
  ["health", /\bhealth\b|medical|clinical|disease|pandemic|epidemiolog|pharma|biotech|nursing|hospital|vaccin|public health|well-?being|nutrition|malari|maternal|\bhiv\b/i],
  ["engineering", /engineering|\bengineers?\b|robotics|mechatronics|civil (?:engineering|works)?|structural|electrical|mechanical|automation|hardware|embedded systems|manufactur|construction|infrastructure/i],
  ["finance", /financ|fintech|banking|investment|microfinance|insurance|accounting|\btrading\b|crypto|blockchain|monetary|fiscal|capital market/i],
  ["tourism", /tourism|hospitality|\bhotels?\b|\btravel(?:ling)?\b|\btours?\b|wildlife|safari|cultural heritage|ecotourism|national park/i],
  ["education", /education|edtech|\blearning\b|\bteaching\b|\bteachers?\b|\bschools?\b|curriculum|literacy|pedagog|capacity building|vocational|\bveta\b|higher education|classroom|\bstem\b/i],
  ["entrepreneurship", /entrepreneur|start-?ups?|incubat|accelerat|\bsmes?\b|\bmsmes?\b|self-employ|\bventures?\b|\bfounders?\b|\bpitch(?:ing)?\b|business (?:development|plan|growth|incubat)|enterprise (?:development|growth)|\bmsme\b/i],
];

/**
 * Deterministic sector inference from opportunity text (title + description).
 * Independent from TYPE by design: a scholarship, a hackathon and a grant can
 * all sit in the same sector. Returns null when nothing matches — unknown stays
 * unknown, never forced into a catch-all and never an ambiguous workflow.
 */
export function inferSector(
  texts: Array<string | null | undefined>
): Sector | null {
  const haystack = texts.filter(Boolean).join(" \n ");
  if (haystack.trim().length === 0) return null;
  for (const [sector, pattern] of SECTOR_PATTERNS) {
    if (pattern.test(haystack)) return sector;
  }
  return null;
}

// --- Convenience wrappers over a full Opportunity --------------------------

export function geographyOf(
  opportunity: Pick<Opportunity, "location" | "trust">
): Geography | null {
  return deriveGeography({
    country: opportunity.location?.country ?? null,
    countryVerification: opportunity.trust?.countryVerification ?? "unknown",
    eligibility: opportunity.trust?.eligibilityDecision ?? "unknown",
    eligibilityEvidence: opportunity.trust?.eligibilityEvidence ?? null,
  });
}

export function sectorOf(
  opportunity: Pick<Opportunity, "title" | "description">
): Sector | null {
  return inferSector([opportunity.title, opportunity.description]);
}

export interface OpportunityClassification {
  /** Opportunity type — the existing category taxonomy (single source of truth). */
  type: OpportunityCategory;
  geography: Geography | null;
  sector: Sector | null;
}

/** Full three-dimension classification of one opportunity. */
export function classifyOpportunity(
  opportunity: Opportunity
): OpportunityClassification {
  return {
    type: opportunity.category,
    geography: geographyOf(opportunity),
    sector: sectorOf(opportunity),
  };
}

// --- Hostile-input-safe query-param parsers --------------------------------

export function parseGeography(raw: string | null | undefined): Geography | null {
  return raw === "national" || raw === "international" ? raw : null;
}

export function parseSector(raw: string | null | undefined): Sector | null {
  return (SECTORS as readonly string[]).includes(raw ?? "")
    ? (raw as Sector)
    : null;
}
