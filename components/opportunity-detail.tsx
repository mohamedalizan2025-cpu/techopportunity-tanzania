import { categoryLabel } from "@/lib/category-labels";
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

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--background)] p-4">
      <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--subtle)]">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium leading-6 text-[var(--foreground)]">
        {children}
      </dd>
    </div>
  );
}

export function OpportunityDetail({ opportunity }: { opportunity: Opportunity }) {
  const deadline = formatDeadlinePresentation(opportunity.deadline);
  const locationLines = opportunity.location
    ? formatLocationDisplay(opportunity.location)
    : ["Location not specified"];
  const added = formatAddedDate(opportunity.createdAt);
  const discovered = formatDiscoveredDate(opportunity.discoveredAt);
  const hostname = sourceHostname(opportunity.url);

  return (
    <article>
      <header className="border-b border-[var(--line)] pb-8 sm:pb-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--accent-strong)]">
            {categoryLabel(opportunity.category)}
          </span>
          {deadline.state === "urgent" ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900 dark:bg-amber-950 dark:text-amber-200">
              {deadline.label}
            </span>
          ) : null}
        </div>
        <h1 className="mt-5 break-words text-3xl font-semibold leading-[1.12] tracking-[-0.04em] text-[var(--foreground)] sm:text-5xl">
          {opportunity.title}
        </h1>
        <p className="mt-4 text-lg text-[var(--muted)]">
          {opportunity.organization?.trim() || "Organizer not specified"}
        </p>
        {added ? <p className="mt-3 text-xs text-[var(--subtle)]">{added}</p> : null}
      </header>

      <dl className="mt-8 grid gap-3 sm:grid-cols-2">
        <Fact label="Deadline">
          <span className="block">{deadline.label}</span>
          {deadline.dateLabel ? (
            <span className="block font-normal text-[var(--muted)]">{deadline.dateLabel}</span>
          ) : (
            <span className="block font-normal text-[var(--muted)]">Check the source page for timing</span>
          )}
        </Fact>
        <Fact label="Location">
          {locationLines.map((line) => <span key={line} className="block">{line}</span>)}
        </Fact>
        <Fact label="Tanzania eligibility">
          <span>{UNKNOWN_TANZANIA_ELIGIBILITY}</span>
          <span className="mt-1 block font-normal text-[var(--muted)]">
            Location does not prove who may apply.
          </span>
        </Fact>
        <Fact label="Source">
          <span>{sourcePresentation(opportunity)}</span>
          {hostname ? <span className="mt-1 block break-all font-normal text-[var(--muted)]">{hostname}</span> : null}
        </Fact>
        <Fact label="Record history">
          <span>{discovered ?? added ?? "Date not available"}</span>
          {discovered && added ? <span className="mt-1 block font-normal text-[var(--muted)]">{added}</span> : null}
        </Fact>
      </dl>

      <section className="mt-10" aria-labelledby="about-opportunity">
        <h2 id="about-opportunity" className="text-2xl font-semibold tracking-[-0.025em] text-[var(--foreground)]">
          About this opportunity
        </h2>
        <p className="mt-4 whitespace-pre-line text-base leading-8 text-[var(--muted)]">
          {opportunity.description}
        </p>
      </section>

      <section className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--background)] p-5" aria-labelledby="who-can-apply">
        <h2 id="who-can-apply" className="text-lg font-semibold text-[var(--foreground)]">
          Who can apply?
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Applicant requirements are not stored as a separate confirmed field for this listing. Read the description above and confirm eligibility on the source page.
        </p>
      </section>

      <aside className="mt-10 rounded-2xl border border-[var(--line)] bg-[var(--accent-soft)] p-5 text-sm leading-6 text-[var(--muted)]">
        <p className="font-semibold text-[var(--foreground)]">Check before you apply</p>
        <p className="mt-1">
          Requirements and dates can change. Confirm the latest details on the source page before submitting an application.
        </p>
      </aside>

      <a
        href={opportunity.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[var(--accent)] px-7 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(13,107,78,0.2)] transition hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-4 sm:w-auto"
      >
        Open source and application details <span aria-hidden="true" className="ml-2">↗</span>
      </a>
      <p className="mt-3 max-w-xl text-xs leading-5 text-[var(--subtle)]">
        This listing stores one source/details link. Confirm the application route and current requirements on that page.
      </p>
    </article>
  );
}
