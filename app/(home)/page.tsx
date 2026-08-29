import { EmptyState } from "@/components/empty-state";
import { AssistantPanel } from "@/components/assistant-panel";
import {
  OpportunityFilters,
  FilterLink,
  buildHref,
} from "@/components/opportunity-filters";
import { categoryLabel } from "@/lib/category-labels";
import { buildCardMetaSegments } from "@/lib/opportunity-presentation";
import { listLiveCategories } from "@/lib/data/categories";
import {
  listPublishedLocations,
  listPublishedOpportunities,
  parseDeadlineFilter,
  sanitizeFilterValue,
  sanitizeSearchQuery,
} from "@/lib/data/opportunities";
import {
  OPPORTUNITY_CATEGORIES,
  type Opportunity,
  type OpportunityCategory,
} from "@/lib/types";
import Link from "next/link";

interface HomePageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    q?: string;
    city?: string;
    region?: string;
    deadline?: string;
  }>;
}

function parseCategory(value?: string): OpportunityCategory | null {
  return (OPPORTUNITY_CATEGORIES as readonly string[]).includes(value ?? "")
    ? (value as OpportunityCategory)
    : null;
}

function parseSort(value?: string): "deadline" | "newest" {
  return value === "newest" ? "newest" : "deadline";
}

function formatCardDeadline(iso: string | null): string {
  // Missing deadline = unknown, never a claim that it is rolling.
  if (!iso) return "No deadline listed";
  return `Deadline ${new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso))}`;
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const metaSegments = buildCardMetaSegments(opportunity);

  return (
    <li>
      <Link
        href={`/opportunities/${opportunity.slug}`}
        className="block rounded-lg border border-black/[.08] bg-white p-4 text-left transition-colors hover:border-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 dark:border-white/[.145] dark:bg-zinc-950 dark:hover:border-white/40 dark:focus-visible:ring-white/60"
      >
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
          {categoryLabel(opportunity.category)}
        </span>
        <p className="break-words font-medium text-black dark:text-zinc-50">
          {opportunity.title}
        </p>
        {metaSegments.length > 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {metaSegments.join(" · ")}
          </p>
        ) : null}
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
          {formatCardDeadline(opportunity.deadline)}
        </p>
      </Link>
    </li>
  );
}

function DiscoveryHeading({ children }: { children: string }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
      {children}
    </h2>
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const category = parseCategory(params.category);
  const sort = parseSort(params.sort);
  const q = sanitizeSearchQuery(params.q);
  const city = sanitizeFilterValue(params.city);
  const region = sanitizeFilterValue(params.region);
  const deadline = parseDeadlineFilter(params.deadline);
  const opportunities = await listPublishedOpportunities({
    category,
    sort,
    q,
    city,
    region,
    deadline,
  });
  const locations = await listPublishedLocations();
  // Live taxonomy: only categories with a seeded row are shown, so the UI
  // never claims a category that the database does not currently have.
  const liveCategories = await listLiveCategories();
  const isFiltered =
    category !== null || q !== null || city !== null || region !== null || deadline !== null;

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main id="main-content" tabIndex={-1} className="flex w-full max-w-3xl flex-col items-center gap-10 py-16 text-center sm:py-24">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl dark:text-zinc-50">
            Find opportunities you can apply for
          </h1>
          <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Scholarships, fellowships, grants, internships, hackathons,
            competitions, workshops and conferences — in Tanzania and beyond.
            Every published listing links to its official page.
          </p>
        </div>

        {liveCategories.length > 0 ? (
          <section
            aria-label="Browse by opportunity type"
            className="flex w-full flex-col items-center gap-3"
          >
            <DiscoveryHeading>Browse by type</DiscoveryHeading>
            <ul className="flex flex-wrap justify-center gap-2">
              <li>
                <FilterLink
                  href={buildHref(null, sort, { q, city, region, deadline })}
                  active={category === null}
                >
                  All
                </FilterLink>
              </li>
              {liveCategories.map(({ slug, label }) => (
                <li key={slug}>
                  <FilterLink
                    href={buildHref(slug, sort, { q, city, region, deadline })}
                    active={category === slug}
                  >
                    {label}
                  </FilterLink>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section
          aria-label="Browse by deadline"
          className="flex w-full flex-col items-center gap-3"
        >
          <DiscoveryHeading>By deadline</DiscoveryHeading>
          <ul className="flex flex-wrap justify-center gap-2">
            <li>
              <FilterLink href="/?deadline=soon" active={deadline === "soon"}>
                Closing soon (14 days)
              </FilterLink>
            </li>
            <li>
              <FilterLink href="/?deadline=upcoming" active={deadline === "upcoming"}>
                Upcoming deadlines
              </FilterLink>
            </li>
            <li>
              <FilterLink href="/?deadline=rolling" active={deadline === "rolling"}>
                No deadline listed
              </FilterLink>
            </li>
          </ul>
        </section>

        <OpportunityFilters
          activeCategory={category}
          activeSort={sort}
          activeQuery={q}
          activeCity={city}
          activeRegion={region}
          activeDeadline={deadline}
          locations={locations}
        />

        <AssistantPanel />

        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Know something missing?{" "}
          <Link
            href="/submit"
            className="font-medium underline underline-offset-4 transition-colors hover:text-black dark:hover:text-zinc-50"
          >
            Submit an opportunity
          </Link>
        </p>

        {opportunities.length === 0 ? (
          <EmptyState
            title={isFiltered ? "Nothing found" : "No opportunities yet"}
            message={
              q !== null
                ? `No published opportunities match “${q}”. Try different keywords or clear the search.`
                : isFiltered
                  ? "No published opportunities match these filters. Try widening your search."
                  : "Approved opportunities will appear here as soon as they are published."
            }
          />
        ) : (
          <ul className="flex w-full flex-col gap-3">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
