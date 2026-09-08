import { UiIcon } from "./ui-icon";
import { categoryLabel } from "@/lib/category-labels";
import { SaveOpportunityControl } from "@/components/save-opportunity-control";
import {
  formatAddedDate,
  formatDeadlinePresentation,
  formatDiscoveredDate,
  formatLocationDisplay,
  sourceHostname,
  sourcePresentation,
  UNKNOWN_TANZANIA_ELIGIBILITY,
} from "@/lib/opportunity-presentation";
import type { Opportunity } from "@/lib/types";

export function OpportunityDetail({
  opportunity,
  isSaved = false,
  isAuthenticated = false,
  returnTo,
}: {
  opportunity: Opportunity;
  isSaved?: boolean;
  isAuthenticated?: boolean;
  returnTo: string;
}) {
  const deadline = formatDeadlinePresentation(opportunity.deadline);
  const locationLines = opportunity.location
    ? formatLocationDisplay(opportunity.location)
    : ["Location not specified"];
  const added = formatAddedDate(opportunity.createdAt);
  const discovered = formatDiscoveredDate(opportunity.discoveredAt);
  const hostname = sourceHostname(opportunity.url);

  return (
    <article>
      <header className="border-b border-[var(--line)] pb-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="eyebrow text-[var(--accent-strong)]">
            {categoryLabel(opportunity.category)}
          </span>
          <span className={`status-label status-${deadline.state}`}>
            <UiIcon name="clock" width="14" height="14" />
            {deadline.label}
          </span>
        </div>
        <h1 className="mt-5 max-w-4xl break-words text-3xl font-semibold leading-[1.15] tracking-[-.04em] sm:text-4xl lg:text-5xl">
          {opportunity.title}
        </h1>
        <p className="mt-4 text-base text-[var(--muted)]">
          {opportunity.organization?.trim() || "Organizer not specified"}
        </p>
        {added ? (
          <p className="mt-2 text-sm text-[var(--muted)]">{added}</p>
        ) : null}
      </header>
      <div className="detail-body mt-8">
        <aside
          className="detail-aside order-first lg:order-last"
          aria-label="Opportunity essentials"
        >
          <p className="eyebrow">Your next step</p>
          <h2 className="mt-3 text-xl font-semibold">
            Check the source details
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Confirm the latest requirements and application route before you
            apply.
          </p>
          <a
            href={opportunity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="button-primary mt-5 w-full"
          >
            Open source and application details{" "}
            <UiIcon name="external" className="shrink-0" />
          </a>
          <p className="mt-2 break-words text-xs text-[var(--muted)]">
            Opens in a new tab{hostname ? ` · ${hostname}` : ""}
          </p>
          <div className="mt-4">
            <SaveOpportunityControl
              opportunityId={opportunity.id}
              opportunityTitle={opportunity.title}
              isSaved={isSaved}
              isAuthenticated={isAuthenticated}
              returnTo={returnTo}
            />
          </div>
          <dl className="mt-6 space-y-5 border-t border-[var(--line)] pt-5">
            <div>
              <dt className="text-xs font-semibold text-[var(--muted)]">
                Deadline
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {deadline.dateLabel ?? deadline.label}
              </dd>
              {!deadline.dateLabel ? (
                <dd className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  Check the source page for timing.
                </dd>
              ) : null}
            </div>
            <div>
              <dt className="text-xs font-semibold text-[var(--muted)]">
                Location
              </dt>
              <dd className="mt-1 text-sm leading-6">
                {locationLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-[var(--muted)]">
                Tanzania eligibility
              </dt>
              <dd className="mt-1 text-sm leading-6">
                {UNKNOWN_TANZANIA_ELIGIBILITY}
              </dd>
            </div>
          </dl>
        </aside>
        <div className="min-w-0">
          <section aria-labelledby="about-opportunity">
            <h2
              id="about-opportunity"
              className="text-xl font-semibold tracking-tight"
            >
              About this opportunity
            </h2>
            <p className="detail-description mt-5 whitespace-pre-line text-base leading-8 text-[var(--muted)]">
              {opportunity.description}
            </p>
          </section>
          <section
            className="mt-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
            aria-labelledby="who-can-apply"
          >
            <div className="flex items-center gap-2">
              <UiIcon name="info" />
              <h2 id="who-can-apply" className="text-lg font-semibold">
                Who can apply?
              </h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Tanzania eligibility is not confirmed for this listing. Read the
              source requirements carefully; an opportunity’s location does not
              prove who may apply.
            </p>
          </section>
          <section
            className="mt-8 border-t border-[var(--line)] pt-6"
            aria-labelledby="source-history"
          >
            <h2 id="source-history" className="text-lg font-semibold">
              Source &amp; record history
            </h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-[var(--muted)]">Source</dt>
                <dd className="mt-1 font-medium">
                  {sourcePresentation(opportunity)}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Recorded</dt>
                <dd className="mt-1">
                  {discovered ?? added ?? "Date not available"}
                </dd>
              </div>
            </dl>
            <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
              This listing stores one source/details link. A recorded date is
              not a guarantee that the source is still current. Requirements and
              deadlines can change.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
