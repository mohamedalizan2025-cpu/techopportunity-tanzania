import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logOutAction } from "@/lib/data/auth-actions";
import { categoryLabel } from "@/lib/category-labels";
import {
  getEnrichmentAuditStatus,
  getModerationAccess,
  getPendingOpportunityById,
  getQueueNavigation,
  isQueueFilterEmpty,
  isValidOpportunityId,
  listReviewCategoryOptions,
  parseQueueFilter,
  queueFilterQuery,
} from "@/lib/data/moderation";
import { listOrganizationOptions } from "@/lib/data/opportunities";
import { getPublishedOpportunityById } from "@/lib/data/published-management";
import { formatLocationDisplay } from "@/lib/opportunity-presentation";
import { TRIAGE_BUCKET_LABEL, triageBucketOf } from "@/lib/triage-bucket";
import { DecisionForm } from "../decision-form";

export const metadata: Metadata = {
  title: "Review submission · TechOpportunity Tanzania",
  robots: { index: false, follow: false },
};

interface ReviewPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ModerationReviewPage({ params, searchParams }: ReviewPageProps) {
  const { id } = await params;
  const rawSearchParams = await searchParams;
  const modeParam = Array.isArray(rawSearchParams.mode)
    ? rawSearchParams.mode[0]
    : rawSearchParams.mode;
  const isPublishedReview = modeParam === "published";
  // Queue view filter (bucket/source), carried forward from the queue link
  // so "next in queue" stays inside the batch the moderator chose.
  const filter = parseQueueFilter(rawSearchParams);
  const filterQuery = queueFilterQuery(filter);
  const queueHref = isPublishedReview
    ? "/published-management"
    : `/moderation${filterQuery}`;
  const access = await getModerationAccess();

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      const next = `/moderation/${id}${isPublishedReview ? "?mode=published" : ""}`;
      redirect(`/login?next=${encodeURIComponent(next)}`);
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[var(--background)] px-6 py-24 text-center font-sans">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Access restricted
        </h1>
        <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
          Your account does not have moderation permissions.
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

  if (!isValidOpportunityId(id)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[var(--background)] px-6 py-24 font-sans">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Submission not found
        </h1>
        <Link
          href={queueHref}
          className="text-sm font-medium underline underline-offset-4 text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Back to {isPublishedReview ? "published records" : "queue"}
        </Link>
      </div>
    );
  }

  const opportunity = isPublishedReview
    ? await getPublishedOpportunityById(id)
    : await getPendingOpportunityById(id);

  if (!opportunity) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[var(--background)] px-6 py-24 font-sans">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          {isPublishedReview ? "No longer published" : "No longer pending"}
        </h1>
        <p className="max-w-md text-center text-sm leading-6 text-[var(--muted)]">
          {isPublishedReview
            ? "This opportunity is no longer published — it may have been unpublished while you were reviewing it."
            : "This submission was not found in the pending queue — it may already have been reviewed."}
        </p>
        <Link
          href={queueHref}
          className="text-sm font-medium underline underline-offset-4 text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          ← Back to {isPublishedReview ? "published records" : "queue"}
        </Link>
      </div>
    );
  }

  const organizations = await listOrganizationOptions();
  const auditStatus = await getEnrichmentAuditStatus();
  const navigation = isPublishedReview
    ? { position: null, total: 0, nextId: null }
    : await getQueueNavigation(id, filter);
  const nextHref = navigation.nextId
    ? `/moderation/${navigation.nextId}${filterQuery}`
    : null;
  const categoryOptions = await listReviewCategoryOptions(
    opportunity.category,
    categoryLabel
  );

  const triageBucket = triageBucketOf(opportunity.category, opportunity.title);
  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
  const locationLines =
    opportunity.location === null
      ? ["Location not specified"]
      : formatLocationDisplay(opportunity.location);

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)] font-sans">
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-2xl flex-1 px-6 pb-32 pt-12 sm:pt-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href={queueHref}
              className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              ← {isPublishedReview ? "Published records" : "Moderation queue"}
            </Link>
            {navigation.position !== null ? (
              <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--muted)]">
                Item {navigation.position} of {navigation.total}
                {isQueueFilterEmpty(filter) ? "" : " in this filter"}
              </span>
            ) : null}
          </div>
          <form action={logOutAction}>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
            >
              Sign out
            </button>
          </form>
        </div>

        {/* Source evidence — the moderator's primary verification anchor. */}
        <section
          aria-label="Source evidence"
          className="mt-6 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-5"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Source evidence
          </h2>
          <a
            href={opportunity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex h-11 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-strong)]"
          >
            Open official page ↗
          </a>
          <dl className="mt-4 flex flex-col gap-1.5 text-sm text-[var(--muted)]">
            {opportunity.sourceName ? (
              <div>
                <dt className="inline font-medium text-[var(--foreground)]">
                  Discovered from:{" "}
                </dt>
                <dd className="inline">
                  {opportunity.sourceName}
                  {opportunity.discoveryMethod ? ` · ${opportunity.discoveryMethod}` : ""}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="inline font-medium text-[var(--foreground)]">
                Discovered:{" "}
              </dt>
              <dd className="inline">
                {dateFormatter.format(new Date(opportunity.discoveredAt ?? opportunity.createdAt))}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-[var(--foreground)]">
                Submitted:{" "}
              </dt>
              <dd className="inline">{dateFormatter.format(new Date(opportunity.createdAt))}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-[var(--muted)]">
              {isPublishedReview
                ? "Re-check every trust field against current official evidence before keeping this record published."
                : "Facts below were discovered automatically and may be wrong — verify them against the official page before approving."}
          </p>
        </section>

        {/* As discovered — compact record summary (the decision form below is
            the only editable copy; no duplicated detail render). */}
        <section aria-label="As discovered" className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              {categoryLabel(opportunity.category)}
            </span>
            <span className="rounded-full border border-dashed border-[var(--line)] px-3 py-1 text-xs text-[var(--muted)]">
              Triage hint (heuristic — verify): {TRIAGE_BUCKET_LABEL[triageBucket]}
            </span>
          </div>
          <h1 className="mt-3 break-words text-2xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-3xl">
            {opportunity.title}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {opportunity.organization ?? "Organizer unknown"} ·{" "}
            {opportunity.deadline
              ? `Deadline ${dateFormatter.format(new Date(opportunity.deadline))}`
              : "No deadline listed"}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {locationLines.join(" · ")}
          </p>
          <details className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-4 text-sm">
            <summary className="cursor-pointer select-none font-medium text-[var(--foreground)]">
              Discovered description
            </summary>
            <p className="mt-3 whitespace-pre-line leading-6 text-[var(--muted)]">
              {opportunity.description}
            </p>
          </details>
        </section>

        <section className="mt-10 border-t border-[var(--line)] pt-8">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {isPublishedReview ? "Published opportunity re-review" : "Decision"}
          </h2>
          {!auditStatus.active ? (
            <p
              role="status"
              className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
            >
              Enrichment audit trail is inactive ({auditStatus.reason}). Review
              edits will still be saved, but field-level changes will not be
              recorded. Apply migration 0003 to activate the audit trail.
            </p>
          ) : null}
          <div className="mt-4">
            <DecisionForm
              opportunity={opportunity}
              organizations={organizations}
              nextHref={nextHref}
              queueHref={queueHref}
              categoryOptions={categoryOptions}
              mode={isPublishedReview ? "published" : "pending"}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
