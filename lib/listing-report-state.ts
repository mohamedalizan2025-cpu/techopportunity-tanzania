/**
 * Listing-report domain state (pre-pilot P0B). Reports are human review
 * input only: nothing here can publish, unpublish, approve, reject, or
 * modify any opportunity row, trust decision, deadline, eligibility, or
 * source. All opportunity mutations stay in the existing authorized
 * moderation flow.
 */

export const LISTING_REPORT_REASONS = [
  "incorrect_information",
  "deadline_issue",
  "eligibility_issue",
  "broken_link",
  "suspicious",
  "other",
] as const;

export type ListingReportReason = (typeof LISTING_REPORT_REASONS)[number];

export const LISTING_REPORT_STATUSES = [
  "new",
  "reviewed",
  "resolved",
  "dismissed",
] as const;

export type ListingReportStatus = (typeof LISTING_REPORT_STATUSES)[number];

/** Triage moves forward only; reports never return to `new`. */
export const LISTING_REPORT_TRIAGE_STATUSES = [
  "reviewed",
  "resolved",
  "dismissed",
] as const;

export type ListingReportTriageStatus =
  (typeof LISTING_REPORT_TRIAGE_STATUSES)[number];

export const LISTING_REPORT_REASON_LABELS: Record<ListingReportReason, string> = {
  incorrect_information: "Incorrect information",
  deadline_issue: "Wrong or changed deadline",
  eligibility_issue: "Eligibility concern",
  broken_link: "Broken source or apply link",
  suspicious: "Suspicious or fraudulent listing",
  other: "Other serious listing issue",
};

export const LISTING_REPORT_STATUS_LABELS: Record<ListingReportStatus, string> = {
  new: "New",
  reviewed: "Reviewed",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

export const LISTING_REPORT_DETAILS_MIN = 4;
export const LISTING_REPORT_DETAILS_MAX = 1000;
export const LISTING_REPORT_RESOLUTION_NOTE_MAX = 500;
/** Accidental-resubmission window: same reporter + opportunity + reason. */
export const LISTING_REPORT_DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;
/** Per-user report rate cap (1 minute window, shared in-memory limiter). */
export const LISTING_REPORT_RATE_MAX = 5;

export interface ListingReportMutationState {
  status: "idle" | "success" | "error";
  message: string | null;
  sent: boolean;
}

export const initialListingReportMutationState: ListingReportMutationState = {
  status: "idle",
  message: null,
  sent: false,
};

export interface TriageMutationState {
  status: "idle" | "success" | "error";
  message: string | null;
}

export const initialTriageMutationState: TriageMutationState = {
  status: "idle",
  message: null,
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isListingReportReason(value: unknown): value is ListingReportReason {
  return (
    typeof value === "string" &&
    (LISTING_REPORT_REASONS as readonly string[]).includes(value)
  );
}

export function isListingReportTriageStatus(
  value: unknown
): value is ListingReportTriageStatus {
  return (
    typeof value === "string" &&
    (LISTING_REPORT_TRIAGE_STATUSES as readonly string[]).includes(value)
  );
}

export function isReportId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function cleanReportDetails(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (
    cleaned.length < LISTING_REPORT_DETAILS_MIN ||
    cleaned.length > LISTING_REPORT_DETAILS_MAX
  ) {
    return null;
  }
  return cleaned;
}

export function cleanResolutionNote(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;
  const cleaned = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim();
  if (cleaned.length === 0 || cleaned.length > LISTING_REPORT_RESOLUTION_NOTE_MAX) {
    return null;
  }
  return cleaned;
}

export function parseReportMutation(formData: FormData): {
  opportunityId: string;
  reason: ListingReportReason;
  details: string;
} | null {
  const opportunityId = formData.get("opportunityId");
  const reason = formData.get("reason");
  const details = cleanReportDetails(formData.get("details"));
  if (typeof opportunityId !== "string" || !UUID_PATTERN.test(opportunityId)) {
    return null;
  }
  if (!isListingReportReason(reason) || details === null) return null;
  return { opportunityId, reason, details };
}
