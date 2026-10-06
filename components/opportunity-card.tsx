import Link from "next/link";
import { UiIcon } from "./ui-icon";
import { OpportunityCover } from "./opportunity-cover";
import { categoryLabel } from "@/lib/category-labels";
import { geographyOf } from "@/lib/taxonomy";
import { SaveOpportunityControl } from "@/components/save-opportunity-control";
import {
  formatAddedDate,
  formatCardLocation,
  formatDeadlinePresentation,
  formatTrustBadge,
  opportunityCardExcerpt,
  opportunityHref,
  sourcePresentation,
  sourceHostname,
  eligibilityPresentation,
} from "@/lib/opportunity-presentation";
import type { Opportunity } from "@/lib/types";

export function OpportunityCard({
  opportunity,
  now,
  returnHref,
  isSaved = false,
  isAuthenticated = false,
  showCover = false,
}: {
  opportunity: Opportunity;
  now?: Date;
  returnHref?: string;
  isSaved?: boolean;
  isAuthenticated?: boolean;
  /**
   * Civic Hybrid P0: cards are information-first and image-free by
   * default. A cover renders only when a caller explicitly passes a
   * real, provenanced asset path via `showCover` in a future milestone.
   */
  showCover?: boolean;
}) {
  const deadline = formatDeadlinePresentation(opportunity.deadline, now);
  const place = formatCardLocation(opportunity.location);
  const added = formatAddedDate(opportunity.createdAt);
  const badge = formatTrustBadge(opportunity);
  const eligibility = eligibilityPresentation(opportunity);
  const geography = geographyOf(opportunity);

  return (
    <article className="opportunity-card group">
      {showCover ? (
        <div className="opportunity-card-cover" aria-hidden="true">
          <OpportunityCover opportunity={opportunity} />
        </div>
      ) : null}
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand)]">
        {categoryLabel(opportunity.category)}
        {geography ? (
          <span className="font-medium normal-case tracking-normal text-[var(--muted)]">
            {" "}· {geography === "national" ? "Tanzania" : "International"}
          </span>
        ) : null}
      </p>
      <h3 className="mt-2 text-lg font-semibold leading-6 tracking-tight text-[var(--foreground)]">
        <Link
          href={opportunityHref(opportunity.slug, returnHref)}
          prefetch={false}
          className="after:absolute after:inset-0 after:rounded-md hover:text-[var(--brand)]"
        >
          {opportunity.title}
        </Link>
      </h3>
      <p className="mt-1.5 text-[0.8125rem] text-[var(--muted)]">
        {opportunity.organization?.trim() || sourceHostname(opportunity.url) || sourcePresentation(opportunity)}
      </p>
      <p className="mt-2.5 text-sm leading-6 text-[var(--muted)]">
        {opportunityCardExcerpt(opportunity.description)}
      </p>
      <ul className="mt-4 space-y-2 border-t border-[var(--line)] pt-3 text-[0.8125rem] leading-5 text-[var(--muted)]">
        <li className="flex items-start gap-2">
          <UiIcon
            name="pin"
            width="16"
            height="16"
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <span>{place ?? "Location not specified"}</span>
        </li>
        <li className="flex items-start gap-2">
          <UiIcon
            name="clock"
            width="16"
            height="16"
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <span>
            <span className={`status-label status-${deadline.state} mr-2`}>{deadline.label}</span>
            {deadline.dateLabel ? deadline.dateLabel : null}
          </span>
        </li>
        <li className="flex items-start gap-2">
          {badge ? (
            <UiIcon
              name="shield"
              width="16"
              height="16"
              className="mt-0.5 shrink-0 text-[var(--verified)]"
              aria-hidden="true"
            />
          ) : (
            <UiIcon
              name="info"
              width="16"
              height="16"
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
          )}
          <span>{badge ? `${badge.label} · ` : ""}{eligibility.label}</span>
        </li>
      </ul>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span
            aria-hidden="true"
            className="flex items-center gap-2 text-sm font-semibold text-[var(--brand)]"
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
      prefetch={false}
      className="group flex min-h-20 items-center justify-between gap-4 rounded-md border border-transparent px-3 py-3 transition hover:border-[var(--line)] hover:bg-[var(--surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
    >
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-[var(--primary-text)]">
          {categoryLabel(opportunity.category)}
        </span>
        <span className="mt-1 block text-sm font-semibold leading-5 text-[var(--foreground)] group-hover:text-[var(--primary-text)]">
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
