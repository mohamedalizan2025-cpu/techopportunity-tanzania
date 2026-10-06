"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  LISTING_REPORT_DUPLICATE_WINDOW_MS,
  LISTING_REPORT_RATE_MAX,
  cleanResolutionNote,
  isListingReportTriageStatus,
  isReportId,
  parseReportMutation,
  type ListingReportMutationState,
  type TriageMutationState,
} from "../listing-report-state";
import { checkOpportunityInsightRateLimit } from "../opportunity-intelligence/rate-limit";
import { sanitizeNextPath } from "../staff-form-state";
import { getModerationAccess } from "./moderation";
import { getAuthenticatedUser } from "./supabase-auth";

function missingReportsSchema(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("listing_reports") === true
  );
}

/**
 * Authenticated talent report submission. Writes ONLY to
 * `listing_reports` — this action never touches the opportunities table,
 * trust state, deadlines, eligibility, or publication status. Anonymous
 * callers are redirected to sign in (no anonymous DB-write surface).
 */
export async function submitListingReportAction(
  _previousState: ListingReportMutationState,
  formData: FormData
): Promise<ListingReportMutationState> {
  const mutation = parseReportMutation(formData);
  const returnTo = sanitizeNextPath(formData.get("returnTo")) ?? "/";
  if (!mutation) {
    return {
      status: "error",
      message:
        "That report is invalid. Choose a reason and describe the problem in a few words (4–1000 characters).",
      sent: false,
    };
  }

  const user = await getAuthenticatedUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }

  const limit = checkOpportunityInsightRateLimit(
    `listing-report:${user.userId}`,
    Date.now(),
    LISTING_REPORT_RATE_MAX
  );
  if (!limit.allowed) {
    return {
      status: "error",
      message: `Too many reports just now. Try again in ${limit.retryAfterSeconds} seconds.`,
      sent: false,
    };
  }

  const { data: opportunity, error: opportunityError } = await user.client
    .from("opportunities")
    .select("id")
    .eq("id", mutation.opportunityId)
    .eq("status", "published")
    .maybeSingle();
  if (opportunityError) {
    if (missingReportsSchema(opportunityError)) {
      return {
        status: "error",
        message:
          "Reporting is temporarily unavailable. You can still reach us on WhatsApp from the Contact page.",
        sent: false,
      };
    }
    return {
      status: "error",
      message: "This opportunity could not be reported. Please try again.",
      sent: false,
    };
  }
  if (!opportunity) {
    return {
      status: "error",
      message: "This opportunity is not available to report.",
      sent: false,
    };
  }

  const windowStart = new Date(
    Date.now() - LISTING_REPORT_DUPLICATE_WINDOW_MS
  ).toISOString();
  const { data: existing, error: existingError } = await user.client
    .from("listing_reports")
    .select("id")
    .eq("reporter_user_id", user.userId)
    .eq("opportunity_id", mutation.opportunityId)
    .eq("reason", mutation.reason)
    .eq("status", "new")
    .gte("created_at", windowStart)
    .limit(1);
  if (existingError) {
    if (missingReportsSchema(existingError)) {
      return {
        status: "error",
        message:
          "Reporting is temporarily unavailable. You can still reach us on WhatsApp from the Contact page.",
        sent: false,
      };
    }
    return {
      status: "error",
      message: "This report could not be sent. Please try again.",
      sent: false,
    };
  }
  if (existing && existing.length > 0) {
    return {
      status: "success",
      message: "Thanks. Your report was already sent and is waiting for review.",
      sent: true,
    };
  }

  const { error } = await user.client.from("listing_reports").insert({
    reporter_user_id: user.userId,
    opportunity_id: mutation.opportunityId,
    reason: mutation.reason,
    details: mutation.details,
  });
  if (error) {
    if (missingReportsSchema(error)) {
      return {
        status: "error",
        message:
          "Reporting is temporarily unavailable. You can still reach us on WhatsApp from the Contact page.",
        sent: false,
      };
    }
    return {
      status: "error",
      message: "This report could not be sent. Please try again.",
      sent: false,
    };
  }

  revalidatePath("/opportunities/[slug]", "page");
  revalidatePath("/reports");
  return {
    status: "success",
    message: "Thanks. Your report was sent for review.",
    sent: true,
  };
}

export interface StaffListingReport {
  id: string;
  reason: string;
  details: string;
  status: string;
  createdAt: string;
  reporterUserId: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  resolutionNote: string | null;
  opportunity: {
    id: string;
    slug: string;
    title: string;
    status: string;
  } | null;
}

/**
 * Staff triage list. Moderator/admin only; reporters never appear here
 * except through this gate. Returns report rows with their linked
 * opportunity snapshot for context — reading only.
 */
export async function listListingReportsForStaff(): Promise<{
  available: boolean;
  entries: StaffListingReport[];
}> {
  const access = await getModerationAccess();
  if (!access.ok) return { available: false, entries: [] };
  const { data, error } = await access.staff.client
    .from("listing_reports")
    .select(
      "id, reason, details, status, created_at, reporter_user_id, reviewed_by, reviewed_at, resolution_note, opportunity:opportunities ( id, slug, title, status )"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) {
    if (!missingReportsSchema(error)) {
      console.error("[lib/data] Failed to list listing reports:", error.message);
    }
    return { available: false, entries: [] };
  }
  return {
    available: true,
    entries: ((data ?? []) as unknown as Array<Record<string, unknown>>).map(
      (row) => {
        const opportunity = (
          Array.isArray(row.opportunity) ? row.opportunity[0] : row.opportunity
        ) as StaffListingReport["opportunity"];
        return {
          id: row.id,
          reason: row.reason,
          details: row.details,
          status: row.status,
          createdAt: row.created_at,
          reporterUserId: row.reporter_user_id,
          reviewedBy: row.reviewed_by,
          reviewedAt: row.reviewed_at,
          resolutionNote: row.resolution_note,
          opportunity,
        } as StaffListingReport;
      }
    ),
  };
}

/**
 * Staff triage status change. Updates ONLY triage columns on the report
 * row (status/reviewed_by/reviewed_at/resolution_note). It cannot change
 * any opportunity row: this action issues no write to the opportunities
 * table, trust state, or publication status. Listing changes, when
 * warranted, go through the existing authorized moderation flow.
 */
export async function triageListingReportAction(
  _previousState: TriageMutationState,
  formData: FormData
): Promise<TriageMutationState> {
  const reportId = formData.get("reportId");
  const status = formData.get("status");
  if (!isReportId(reportId) || !isListingReportTriageStatus(status)) {
    return {
      status: "error",
      message: "That triage request is invalid.",
    };
  }
  const note = cleanResolutionNote(formData.get("resolutionNote"));
  if (
    typeof formData.get("resolutionNote") === "string" &&
    formData.get("resolutionNote") !== "" &&
    note === null
  ) {
    return {
      status: "error",
      message: "A resolution note must be 500 characters or fewer.",
    };
  }

  const access = await getModerationAccess();
  if (!access.ok) {
    return {
      status: "error",
      message:
        access.reason === "unauthenticated"
          ? "Sign in to triage reports."
          : "Only moderators can triage reports.",
    };
  }

  const { error } = await access.staff.client
    .from("listing_reports")
    .update({
      status,
      reviewed_by: access.staff.userId,
      reviewed_at: new Date().toISOString(),
      resolution_note: note,
    })
    .eq("id", reportId);
  if (error) {
    if (missingReportsSchema(error)) {
      return {
        status: "error",
        message: "Report triage is temporarily unavailable.",
      };
    }
    return {
      status: "error",
      message: "This report could not be updated. Please try again.",
    };
  }

  revalidatePath("/reports");
  return { status: "success", message: "Report updated." };
}
