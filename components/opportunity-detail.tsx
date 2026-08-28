import { categoryLabel } from "@/lib/category-labels";
import type { Opportunity } from "@/lib/types";

function formatDeadline(iso: string | null): string {
  // Absence of a deadline is not evidence of rolling admissions — state
  // only what the record actually contains.
  if (!iso) return "No deadline listed";
  const formatted = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
  return `Deadline: ${formatted}`;
}

function formatLocationLines(location: {
  venueName: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
}): string[] {
  const lines = [location.venueName, location.address].filter(
    (line): line is string => line !== null && line.trim() !== ""
  );
  const placeParts = [location.city, location.region, location.country].filter(
    (part): part is string => part !== null && part.trim() !== ""
  );
  if (placeParts.length > 0) lines.push(placeParts.join(", "));
  return lines;
}

export function OpportunityDetail({ opportunity }: { opportunity: Opportunity }) {
  const deadlineText = formatDeadline(opportunity.deadline);
  const locationLines =
    opportunity.location === null
      ? ["Location not specified — see the official page for venue details."]
      : formatLocationLines(opportunity.location);

  return (
    <>
      <header className="flex flex-col gap-3">
        <span className="w-fit rounded-full border border-black/[.08] bg-white px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-600 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400">
          {categoryLabel(opportunity.category)}
        </span>
        <h1 className="break-words text-3xl font-semibold leading-tight tracking-tight text-black sm:text-4xl dark:text-zinc-50">
          {opportunity.title}
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400">
          {opportunity.organization ?? "Organizer — see the official page"}
        </p>
      </header>

      <dl className="mt-8 flex flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-5 text-sm dark:border-white/[.145] dark:bg-zinc-950 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
          <dt className="w-28 shrink-0 font-medium text-black dark:text-zinc-50">
            Location
          </dt>
          <dd className="text-zinc-600 dark:text-zinc-400">
            {locationLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </dd>
        </div>
        <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
          <dt className="w-28 shrink-0 font-medium text-black dark:text-zinc-50">
            Deadline
          </dt>
          <dd className="text-zinc-600 dark:text-zinc-400">{deadlineText}</dd>
        </div>
      </dl>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          About this opportunity
        </h2>
        <p className="mt-3 whitespace-pre-line text-base leading-7 text-zinc-600 dark:text-zinc-400">
          {opportunity.description}
        </p>
      </section>

      <a
        href={opportunity.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
      >
        Apply / View official page ↗
      </a>
    </>
  );
}
