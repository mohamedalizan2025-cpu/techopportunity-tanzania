import Link from "next/link";
import { categoryLabel } from "@/lib/category-labels";
import { SaveOpportunityControl } from "@/components/save-opportunity-control";
import {
  formatAddedDate,
  formatCardLocation,
  formatDeadlinePresentation,
  opportunityExcerpt,
  opportunityHref,
  sourcePresentation,
  UNKNOWN_TANZANIA_ELIGIBILITY,
} from "@/lib/opportunity-presentation";
import type { Opportunity } from "@/lib/types";

const deadlineStyles = {
  active: "bg-[var(--accent-soft)] text-[var(--accent-strong)]",
  urgent: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  expired: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  unknown: "bg-[var(--muted-surface)] text-[var(--muted)]",
};

function MetaIcon({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--muted-surface)] text-[10px] font-bold text-[var(--muted)]"
    >
      {children}
    </span>
  );
}

export function OpportunityCard({
  opportunity,
  now,
  returnHref,
  isSaved = false,
  isAuthenticated = false,
}: {
  opportunity: Opportunity;
  now?: Date;
  returnHref?: string;
  isSaved?: boolean;
  isAuthenticated?: boolean;
}) {
  const deadline = formatDeadlinePresentation(opportunity.deadline, now);
  const place = formatCardLocation(opportunity.location);
  const added = formatAddedDate(opportunity.createdAt);

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_12px_35px_rgba(18,48,34,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-[0_16px_45px_rgba(18,48,34,0.1)] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
          {categoryLabel(opportunity.category)}
        </span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${deadlineStyles[deadline.state]}`}
        >
          {deadline.label}
        </span>
      </div>

      <div className="mt-5 flex-1">
        <h3 className="text-xl font-semibold leading-7 tracking-[-0.02em] text-[var(--foreground)]">
          <Link
            href={opportunityHref(opportunity.slug, returnHref)}
            className="rounded-sm outline-none before:absolute before:inset-0 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-4"
          >
            <span className="relative group-hover:text-[var(--accent-strong)]">
              {opportunity.title}
            </span>
          </Link>
        </h3>
        <p className="mt-2 text-sm font-medium text-[var(--muted)]">
          {opportunity.organization?.trim() || "Organizer not specified"}
        </p>
        <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
          {opportunityExcerpt(opportunity.description)}
        </p>
      </div>

      <dl className="mt-5 grid gap-2 border-t border-[var(--line)] pt-4 text-xs leading-5 text-[var(--muted)] sm:grid-cols-2">
        <div className="flex gap-2">
          <MetaIcon>L</MetaIcon>
          <div>
            <dt className="sr-only">Location</dt>
            <dd>{place ?? "Location not specified"}</dd>
          </div>
        </div>
        <div className="flex gap-2">
          <MetaIcon>E</MetaIcon>
          <div>
            <dt className="sr-only">Eligibility</dt>
            <dd>{UNKNOWN_TANZANIA_ELIGIBILITY}</dd>
          </div>
        </div>
        <div className="flex gap-2">
          <MetaIcon>S</MetaIcon>
          <div>
            <dt className="sr-only">Source</dt>
            <dd>{sourcePresentation(opportunity)}</dd>
          </div>
        </div>
        <div className="flex gap-2">
          <MetaIcon>D</MetaIcon>
          <div>
            <dt className="sr-only">Deadline date</dt>
            <dd>
              {deadline.dateLabel ?? "Check the source page for timing"}
            </dd>
          </div>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="block text-xs text-[var(--subtle)]">{added}</span>
          <div className="mt-3">
            <SaveOpportunityControl
              opportunityId={opportunity.id}
              opportunityTitle={opportunity.title}
              isSaved={isSaved}
              isAuthenticated={isAuthenticated}
              returnTo={returnHref ?? "/#opportunities"}
              compact
            />
          </div>
        </div>
        <span
          aria-hidden="true"
          className="text-sm font-semibold text-[var(--accent-strong)] transition-transform group-hover:translate-x-1"
        >
          View opportunity →
        </span>
      </div>
    </article>
  );
}

export function SnapshotOpportunityLink({
  opportunity,
  now,
  returnHref,
}: {
  opportunity: Opportunity;
  now?: Date;
  returnHref?: string;
}) {
  const deadline = formatDeadlinePresentation(opportunity.deadline, now);
  return (
    <Link
      href={opportunityHref(opportunity.slug, returnHref)}
      className="group flex min-h-20 items-center justify-between gap-4 rounded-xl border border-transparent px-3 py-3 transition hover:border-[var(--line)] hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
    >
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-[var(--accent-strong)]">
          {categoryLabel(opportunity.category)}
        </span>
        <span className="mt-1 block text-sm font-semibold leading-5 text-[var(--foreground)] group-hover:text-[var(--accent-strong)]">
          {opportunity.title}
        </span>
      </span>
      <span className="shrink-0 text-right text-xs font-medium leading-5 text-[var(--muted)]">
        {deadline.label}
        {deadline.dateLabel ? <span className="block">{deadline.dateLabel}</span> : null}
      </span>
    </Link>
  );
}
