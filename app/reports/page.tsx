import type { Metadata } from "next";
import Link from "next/link";
import { StaffNav } from "@/components/staff-nav";
import { ReportTriageForm } from "@/components/report-triage-form";
import { logOutAction } from "@/lib/data/auth-actions";
import {
  listListingReportsForStaff,
  type StaffListingReport,
} from "@/lib/data/listing-report-actions";
import {
  LISTING_REPORT_REASON_LABELS,
  LISTING_REPORT_STATUS_LABELS,
  LISTING_REPORT_STATUSES,
  type ListingReportStatus,
} from "@/lib/listing-report-state";
import { getModerationAccess } from "@/lib/data/moderation";

export const metadata: Metadata = {
  title: "Listing reports · TechOpportunity Tanzania",
  robots: { index: false, follow: false },
};

function reasonLabel(reason: string): string {
  return (LISTING_REPORT_REASON_LABELS as Record<string, string>)[reason] ?? reason;
}

function statusLabel(status: string): string {
  return (LISTING_REPORT_STATUS_LABELS as Record<string, string>)[status] ?? status;
}

function Group({
  status,
  entries,
}: {
  status: ListingReportStatus;
  entries: StaffListingReport[];
}) {
  if (entries.length === 0) return null;
  return (
    <section aria-labelledby={`reports-${status}`} className="mt-8">
      <h2
        id={`reports-${status}`}
        className="text-lg font-semibold text-[var(--foreground)]"
      >
        {statusLabel(status)} · {entries.length}
      </h2>
      <ul className="mt-4 grid gap-3">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-4"
          >
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-[var(--foreground)]">
                {reasonLabel(entry.reason)}
              </span>
              <span aria-hidden="true" className="text-[var(--subtle)]">·</span>
              <span className="text-[var(--muted)]">
                {entry.opportunity ? entry.opportunity.title : "Listing unavailable"}
              </span>
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Listing status: {entry.opportunity ? entry.opportunity.status : "unknown"}
              {" · "}Reported {entry.createdAt} by reporter {entry.reporterUserId.slice(0, 8)}…
              {entry.reviewedAt ? ` · Last triaged ${entry.reviewedAt}` : ""}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--foreground)]">
              {entry.details}
            </p>
            {entry.resolutionNote ? (
              <p className="mt-2 border-l-2 border-[var(--line-strong)] pl-3 text-sm leading-6 text-[var(--muted)]">
                Note: {entry.resolutionNote}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {entry.opportunity ? (
                <>
                  <Link
                    href={`/moderation/${entry.opportunity.id}`}
                    className="inline-flex min-h-11 items-center font-semibold text-[var(--accent-strong)] underline-offset-2 hover:underline"
                  >
                    Open in review queue →
                  </Link>
                  <Link
                    href={`/opportunities/${entry.opportunity.slug}`}
                    className="inline-flex min-h-11 items-center font-semibold text-[var(--muted)] underline-offset-2 hover:underline"
                  >
                    Public detail →
                  </Link>
                </>
              ) : null}
            </div>
            {entry.status === "new" || entry.status === "reviewed" ? (
              <ReportTriageForm reportId={entry.id} />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default async function ListingReportsPage() {
  const access = await getModerationAccess();

  if (!access.ok) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[var(--background)] px-6 py-24 text-center font-sans">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Access restricted
        </h1>
        <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
          Listing reports are an internal staff tool.
        </p>
        <form action={logOutAction}>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          >
            Sign out
          </button>
        </form>
      </div>
    );
  }

  const reports = await listListingReportsForStaff();
  const newCount = reports.entries.filter((entry) => entry.status === "new").length;

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 bg-[var(--background)]">
      <StaffNav />
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          Staff · Trust input
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
          Listing reports
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
          User-submitted listing problems for human review. Triaging a
          report never changes the listing itself — use the review queue
          when a listing needs action.
        </p>
        {!reports.available ? (
          <div
            role="alert"
            className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
          >
            Report triage is temporarily unavailable. Reporting storage may
            not be provisioned yet.
          </div>
        ) : reports.entries.length === 0 ? (
          <p role="status" className="mt-8 rounded-md border border-[var(--line)] bg-[var(--surface)] p-6 text-sm leading-6 text-[var(--muted)]">
            No reports submitted yet.
          </p>
        ) : (
          <>
            <p role="status" className="mt-4 text-sm text-[var(--muted)]">
              {newCount} new {newCount === 1 ? "report" : "reports"} waiting
              for review
            </p>
            {LISTING_REPORT_STATUSES.map((status) => (
              <Group
                key={status}
                status={status as ListingReportStatus}
                entries={reports.entries.filter((entry) => entry.status === status)}
              />
            ))}
          </>
        )}
      </div>
    </main>
  );
}
