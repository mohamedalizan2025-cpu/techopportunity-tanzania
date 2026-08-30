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
  isValidOpportunityId,
  listReviewCategoryOptions,
} from "@/lib/data/moderation";
import { listOrganizationOptions } from "@/lib/data/opportunities";
import { formatLocationDisplay } from "@/lib/opportunity-presentation";
import { TRIAGE_BUCKET_LABEL, triageBucketOf } from "@/lib/triage-bucket";
import { DecisionForm } from "../decision-form";

export const metadata: Metadata = {
  title: "Review submission · TechOpportunity Tanzania",
  robots: { index: false, follow: false },
};

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ModerationReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;
  const access = await getModerationAccess();

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      redirect(`/login?next=${encodeURIComponent(`/moderation/${id}`)}`);
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-50 px-6 py-24 text-center font-sans dark:bg-black">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Access restricted
        </h1>
        <p className="max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Your account does not have moderation permissions.
        </p>
        <form action={logOutAction}>
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-full border border-black/[.10] bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Sign out
          </button>
        </form>
      </div>
    );
  }

  if (!isValidOpportunityId(id)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-50 px-6 py-24 font-sans dark:bg-black">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Submission not found
        </h1>
        <Link
          href="/moderation"
          className="text-sm font-medium underline underline-offset-4 text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to queue
        </Link>
      </div>
    );
  }

  const opportunity = await getPendingOpportunityById(id);

  if (!opportunity) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-50 px-6 py-24 font-sans dark:bg-black">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          No longer pending
        </h1>
        <p className="max-w-md text-center text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          This submission was not found in the pending queue — it may already
          have been reviewed.
        </p>
        <Link
          href="/moderation"
          className="text-sm font-medium underline underline-offset-4 text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to queue
        </Link>
      </div>
    );
  }

  const organizations = await listOrganizationOptions();
  const auditStatus = await getEnrichmentAuditStatus();
  const navigation = await getQueueNavigation(id);
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
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-2xl flex-1 px-6 pb-32 pt-12 sm:pt-16">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/moderation"
              className="text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              ← Moderation queue
            </Link>
            {navigation.position !== null ? (
              <span className="rounded-full border border-black/[.08] bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400">
                Item {navigation.position} of {navigation.total}
              </span>
            ) : null}
          </div>
          <form action={logOutAction}>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full border border-black/[.10] bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Sign out
            </button>
          </form>
        </div>

        {/* Source evidence — the moderator's primary verification anchor. */}
        <section
          aria-label="Source evidence"
          className="mt-6 rounded-lg border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-950"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Source evidence
          </h2>
          <a
            href={opportunity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Open official page ↗
          </a>
          <dl className="mt-4 flex flex-col gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            {opportunity.sourceName ? (
              <div>
                <dt className="inline font-medium text-black dark:text-zinc-50">
                  Discovered from:{" "}
                </dt>
                <dd className="inline">
                  {opportunity.sourceName}
                  {opportunity.discoveryMethod ? ` · ${opportunity.discoveryMethod}` : ""}
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="inline font-medium text-black dark:text-zinc-50">
                Discovered:{" "}
              </dt>
              <dd className="inline">
                {dateFormatter.format(new Date(opportunity.discoveredAt ?? opportunity.createdAt))}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium text-black dark:text-zinc-50">
                Submitted:{" "}
              </dt>
              <dd className="inline">{dateFormatter.format(new Date(opportunity.createdAt))}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
            Facts below were discovered automatically and may be wrong —
            verify them against the official page before approving.
          </p>
        </section>

        {/* As discovered — compact record summary (the decision form below is
            the only editable copy; no duplicated detail render). */}
        <section aria-label="As discovered" className="mt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-black/[.08] bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-600 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400">
              {categoryLabel(opportunity.category)}
            </span>
            <span className="rounded-full border border-dashed border-black/[.15] px-3 py-1 text-xs text-zinc-500 dark:border-white/[.2] dark:text-zinc-400">
              Triage hint (heuristic — verify): {TRIAGE_BUCKET_LABEL[triageBucket]}
            </span>
          </div>
          <h1 className="mt-3 break-words text-2xl font-semibold leading-tight tracking-tight text-black sm:text-3xl dark:text-zinc-50">
            {opportunity.title}
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {opportunity.organization ?? "Organizer unknown"} ·{" "}
            {opportunity.deadline
              ? `Deadline ${dateFormatter.format(new Date(opportunity.deadline))}`
              : "No deadline listed"}
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {locationLines.join(" · ")}
          </p>
          <details className="mt-4 rounded-lg border border-black/[.08] bg-white p-4 text-sm dark:border-white/[.145] dark:bg-zinc-950">
            <summary className="cursor-pointer select-none font-medium text-black dark:text-zinc-50">
              Discovered description
            </summary>
            <p className="mt-3 whitespace-pre-line leading-6 text-zinc-600 dark:text-zinc-400">
              {opportunity.description}
            </p>
          </details>
        </section>

        <section className="mt-10 border-t border-black/[.08] pt-8 dark:border-white/[.145]">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            Decision
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
              nextPendingId={navigation.nextId}
              categoryOptions={categoryOptions}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
