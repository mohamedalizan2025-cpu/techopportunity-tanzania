import { OPPORTUNITY_CATEGORIES, type OpportunityCategory } from "../types";
import { TANZANIA_REGIONS } from "../tanzania-regions";
import type { CountryVerification } from "../opportunity-trust";

/**
 * Pure parsing/validation for the moderator review form. No database access —
 * the caller executes the protected update. Provenance fields (source_id,
 * discovered_at, discovery_method, submitted_by) are deliberately not read
 * from the form anywhere in this module: they are structurally immutable.
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

export interface ReviewInput {
  title: string;
  category: OpportunityCategory;
  description: string;
  url: string;
  venueName: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  /** Moderator-verified country; null keeps the record honest as unknown. */
  country: string | null;
  countryVerification: CountryVerification;
  countryEvidence: string | null;
  deadline: string | null;
  deadlinePrecision: "unknown" | "date" | "rolling";
  deadlineEvidence: string | null;
  relevanceEvidence: string;
  eligibilityEvidence: string;
  organizationId: string | null;
}

export type ParseReviewResult =
  | { ok: true; review: ReviewInput }
  | { ok: false; message: string };

function field(formData: FormData, name: string): string {
  const raw = formData.get(name);
  return typeof raw === "string" ? raw.trim() : "";
}

function cleanSingleLine(value: string, maxLength: number): string | null {
  if (value === "") return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (cleaned.length === 0) return null;
  if (cleaned.length > maxLength) return null;
  return cleaned;
}

function normalizeDeadlineInput(value: string): string | null {
  if (value === "") return null;
  if (DATE_ONLY.test(value)) {
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function parseReviewInput(formData: FormData): ParseReviewResult {
  const title = field(formData, "title").replace(/\s+/g, " ");
  if (title.length < 3 || title.length > 200) {
    return { ok: false, message: "Title must be between 3 and 200 characters." };
  }

  const category = field(formData, "category");
  if (!(OPPORTUNITY_CATEGORIES as readonly string[]).includes(category)) {
    return { ok: false, message: "Choose a valid category." };
  }

  const rawDescription = field(formData, "description").replace(/\r\n/g, "\n");
  if (rawDescription.length < 80 || rawDescription.length > 10000) {
    return { ok: false, message: "Approval requires a meaningful description between 80 and 10,000 characters." };
  }
  if (rawDescription.replace(/\s+/g, " ").trim().toLowerCase() === title.toLowerCase()) {
    return { ok: false, message: "The description must add evidence beyond the title." };
  }

  const url = field(formData, "url");
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return { ok: false, message: "The official URL is not a valid absolute URL." };
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return { ok: false, message: "The official URL must use http or https." };
  }

  const deadline = normalizeDeadlineInput(field(formData, "deadline"));
  if (field(formData, "deadline") !== "" && deadline === null) {
    return { ok: false, message: "Deadline is not a valid date." };
  }
  const rawDeadlinePrecision = field(formData, "deadline_precision");
  const deadlinePrecision = rawDeadlinePrecision === "date" || rawDeadlinePrecision === "rolling"
    ? rawDeadlinePrecision
    : "unknown";
  const deadlineEvidence = cleanSingleLine(field(formData, "deadline_evidence"), 1000);
  if (deadline !== null && deadlinePrecision !== "date") {
    return { ok: false, message: "A known deadline must be marked as a source date." };
  }
  if (deadline === null && deadlinePrecision === "date") {
    return { ok: false, message: "Date precision requires a deadline value." };
  }
  if ((deadline !== null || deadlinePrecision === "rolling") && deadlineEvidence === null) {
    return { ok: false, message: "Known or rolling deadlines require exact source evidence." };
  }

  const venueName = cleanSingleLine(field(formData, "venue_name"), 200);
  if (field(formData, "venue_name") !== "" && venueName === null) {
    return { ok: false, message: "Venue name is too long (max 200 characters)." };
  }

  const address = cleanSingleLine(field(formData, "address"), 300);
  if (field(formData, "address") !== "" && address === null) {
    return { ok: false, message: "Address is too long (max 300 characters)." };
  }

  const city = cleanSingleLine(field(formData, "city"), 120);
  if (field(formData, "city") !== "" && city === null) {
    return { ok: false, message: "City is too long (max 120 characters)." };
  }

  const regionRaw = field(formData, "region");
  let region: string | null = null;
  if (regionRaw !== "") {
    const canonical = TANZANIA_REGIONS.find(
      (r) => r.toLowerCase() === regionRaw.toLowerCase()
    );
    if (!canonical) {
      return { ok: false, message: "Region must be one of the canonical Tanzanian regions." };
    }
    region = canonical;
  }

  // Country is moderator free text (worldwide scope) — bounded only, never
  // defaulted. Empty means unknown and stores NULL once forward migration
  // 0013 is applied.
  const country = cleanSingleLine(field(formData, "country"), 100);
  if (field(formData, "country") !== "" && country === null) {
    return { ok: false, message: "Country is too long (max 100 characters)." };
  }
  const countryVerificationRaw = field(formData, "country_verification");
  const countryVerification: CountryVerification =
    countryVerificationRaw === "verified_tanzania" || countryVerificationRaw === "verified_other"
      ? countryVerificationRaw
      : "unknown";
  const countryEvidence = cleanSingleLine(field(formData, "country_evidence"), 1000);
  if (countryVerification === "unknown" && (country !== null || countryEvidence !== null)) {
    return { ok: false, message: "Country text must remain empty until its source evidence is verified." };
  }
  if (countryVerification !== "unknown" && (country === null || countryEvidence === null)) {
    return { ok: false, message: "A verified country requires both the country and exact evidence." };
  }
  if (
    countryVerification === "verified_tanzania" &&
    country?.toLowerCase() !== "tanzania"
  ) {
    return { ok: false, message: "Verified Tanzania requires country to be Tanzania." };
  }
  if (
    countryVerification === "verified_other" &&
    country?.toLowerCase() === "tanzania"
  ) {
    return { ok: false, message: "Use verified Tanzania for Tanzania evidence." };
  }

  const relevanceEvidence = cleanSingleLine(field(formData, "relevance_evidence"), 1000);
  if (!relevanceEvidence || relevanceEvidence.length < 10) {
    return { ok: false, message: "Approval requires explicit technology/research relevance evidence." };
  }
  if (field(formData, "eligibility") !== "tanzanians_eligible") {
    return { ok: false, message: "Keep this record pending or reject it until Tanzanian eligibility is verified." };
  }
  const eligibilityEvidence = cleanSingleLine(field(formData, "eligibility_evidence"), 1000);
  if (!eligibilityEvidence || eligibilityEvidence.length < 10) {
    return { ok: false, message: "Approval requires exact evidence that Tanzanians may apply." };
  }

  const organizationRaw = field(formData, "organizationId");
  let organizationId: string | null = null;
  if (organizationRaw !== "") {
    if (!UUID_PATTERN.test(organizationRaw)) {
      return { ok: false, message: "Invalid organization reference." };
    }
    organizationId = organizationRaw;
  }

  return {
    ok: true,
    review: {
      title,
      category: category as OpportunityCategory,
      description: rawDescription,
      url,
      venueName,
      address,
      city,
      region,
      country,
      countryVerification,
      countryEvidence,
      deadline,
      deadlinePrecision,
      deadlineEvidence,
      relevanceEvidence,
      eligibilityEvidence,
      organizationId,
    },
  };
}
