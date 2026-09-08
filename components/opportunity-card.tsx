import Link from "next/link";
import { UiIcon } from "./ui-icon";
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
    <article className="opportunity-card group">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="pt-1 text-xs font-semibold uppercase tracking-wider text-[var(--accent-strong)]">
          {categoryLabel(opportunity.category)}
        </span>
        <span className={`status-label status-${deadline.state}`}>
          <UiIcon name="clock" width="14" height="14" />
          {deadline.label}
        </span>
      </div>
      <div className="mt-4 flex-1">
        <h3 className="text-xl font-semibold leading-7 tracking-tight">
          <Link
            href={opportunityHref(opportunity.slug, returnHref)}
            className="after:absolute after:inset-0 after:rounded-[14px] hover:text-[var(--accent-strong)]"
          >
            {opportunity.title}
          </Link>
        </h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {opportunity.organization?.trim() || sourcePresentation(opportunity)}
        </p>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          {opportunityExcerpt(opportunity.description)}
        </p>
      </div>
      <dl className="mt-5 grid gap-2 text-sm text-[var(--muted)]">
        <div>
          <dt className="sr-only">Location</dt>
          <dd className="flex items-start gap-2">
            <UiIcon
              name="pin"
              width="16"
              height="16"
              className="mt-0.5 shrink-0"
            />
            <span>{place ?? "Location not specified"}</span>
          </dd>
        </div>
        <div>
          <dt className="sr-only">Eligibility</dt>
          <dd className="flex items-start gap-2">
            <UiIcon
              name="info"
              width="16"
              height="16"
              className="mt-0.5 shrink-0"
            />
            <span>{UNKNOWN_TANZANIA_ELIGIBILITY}</span>
          </dd>
        </div>
        {deadline.dateLabel ? (
          <div>
            <dt className="sr-only">Deadline date</dt>
            <dd className="flex items-start gap-2">
              <UiIcon
                name="clock"
                width="16"
                height="16"
                className="mt-0.5 shrink-0"
              />
              <span>{deadline.dateLabel}</span>
            </dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
        <div>
          <span
            aria-hidden="true"
            className="flex items-center gap-2 text-sm font-semibold text-[var(--accent-strong)]"
          >
            View details <UiIcon name="arrow" width="16" height="16" />
          </span>
          <span className="mt-1 block text-xs text-[var(--muted)]">
            {added}
          </span>
        </div>
        <SaveOpportunityControl
          opportunityId={opportunity.id}
          opportunityTitle={opportunity.title}
          isSaved={isSaved}
          isAuthenticated={isAuthenticated}
          returnTo={returnHref ?? "/#opportunities"}
          compact
        />
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
        {deadline.dateLabel ? (
          <span className="block">{deadline.dateLabel}</span>
        ) : null}
      </span>
    </Link>
  );
}
