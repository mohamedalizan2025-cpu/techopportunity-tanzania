import Link from "next/link";
import { UiIcon } from "@/components/ui-icon";
import { EmptyState } from "@/components/empty-state";
import {
  OpportunityCard,
  SnapshotOpportunityLink,
} from "@/components/opportunity-card";
import {
  OpportunityFilters,
  buildHref,
} from "@/components/opportunity-filters";
import { listLiveCategories } from "@/lib/data/categories";
import { listSavedOpportunityIds } from "@/lib/data/saved-opportunities";
import { getAuthenticatedUser } from "@/lib/data/supabase-auth";
import {
  getPublicBrowseData,
  parseDeadlineFilter,
  parseOpportunityCategory,
  parseOpportunitySort,
  sanitizeFilterValue,
  sanitizeSearchQuery,
} from "@/lib/data/opportunities";
import {
  buildHomepageSnapshot,
  formatResultCount,
} from "@/lib/opportunity-presentation";
import { parseGeography, parseSector } from "@/lib/taxonomy";

export const revalidate = 60;

const PAGE_SIZE = 24;

/** Append or update the `page` query param on a browse href, preserving any hash. */
function buildPageHref(href: string, nextPage: number): string {
  const [beforeHash, hash = ""] = href.split("#");
  const [path, query = ""] = beforeHash.split("?");
  const params = new URLSearchParams(query);
  params.set("page", String(nextPage));
  const qs = params.toString();
  return `${path}${qs ? `?${qs}` : ""}${hash ? `#${hash}` : ""}`;
}

interface HomePageProps {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    q?: string;
    city?: string;
    region?: string;
    deadline?: string;
    geography?: string;
    sector?: string;
    page?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const category = parseOpportunityCategory(params.category);
  const q = sanitizeSearchQuery(params.q);
  const sort = parseOpportunitySort(params.sort, q !== null);
  const city = sanitizeFilterValue(params.city);
  const region = sanitizeFilterValue(params.region);
  const deadline = parseDeadlineFilter(params.deadline);
  const geography = parseGeography(params.geography);
  const sector = parseSector(params.sector);
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const [browseData, liveCategories, user] = await Promise.all([
    getPublicBrowseData({ category, sort, q, city, region, deadline, geography, sector }),
    listLiveCategories(),
    getAuthenticatedUser(),
  ]);
  const { opportunities, locations } = browseData;
  const savedIds = user
    ? await listSavedOpportunityIds(user)
    : new Set<string>();

  const isFiltered =
    category !== null ||
    q !== null ||
    city !== null ||
    region !== null ||
    deadline !== null ||
    geography !== null ||
    sector !== null;
  const now = new Date();
  const snapshot = isFiltered
    ? { closingSoon: [], recentlyAdded: [] }
    : buildHomepageSnapshot(opportunities, now);
  const browseHref = `${buildHref(category, sort, { q, city, region, deadline, geography, sector })}#opportunities`;
  const visibleOpportunities = opportunities.slice(0, page * PAGE_SIZE);
  const hasMore = opportunities.length > visibleOpportunities.length;
  const showMoreHref = buildPageHref(browseHref, page + 1);
  const resultLabel = hasMore
    ? `Showing ${visibleOpportunities.length} of ${opportunities.length} opportunities`
    : formatResultCount(opportunities.length);

  return (
    <main id="main-content" tabIndex={-1} className="flex-1">
      <section className="border-b border-[var(--line)] bg-[var(--hero)]">
        <div className={`page-shell ${isFiltered ? "py-5" : "py-7 sm:py-9"}`}>
          <p className="eyebrow">For Tanzania’s emerging talent</p>
          <h1 className={isFiltered ? "mt-2 text-3xl font-semibold tracking-tight" : "hero-title mt-3"}>
            {isFiltered ? "Find your next opportunity" : "Opportunities worth acting on."}
          </h1>
          {!isFiltered ? (
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
              <p className="max-w-2xl text-base leading-7 text-[var(--muted)]">
                Find your next step in study, work or innovation. Check the source,
                see what fits, and keep track from interest to application.
              </p>
              <p className="border-l-2 border-[var(--accent)] pl-4 text-sm leading-6 text-[var(--muted)]">
                Human-reviewed before publication. Evidence and missing details
                are marked on each listing. <a href="#trust-heading" className="font-semibold text-[var(--accent-strong)] underline underline-offset-4">How to read the evidence</a>
              </p>
            </div>
          ) : null}
          {user ? (
            <nav aria-label="Your journey" className="mt-4 flex flex-wrap gap-x-5 text-sm">
              <span className="inline-flex min-h-11 items-center font-semibold">Explore</span>
              <Link href="/for-you" className="inline-flex min-h-11 items-center font-semibold text-[var(--accent-strong)] underline underline-offset-4">For You</Link>
              <Link href="/activity" className="inline-flex min-h-11 items-center font-semibold text-[var(--accent-strong)] underline underline-offset-4">Your activity</Link>
            </nav>
          ) : null}
        </div>
      </section>

      <section
        id="opportunities"
        aria-labelledby="opportunities-heading"
        className="scroll-mt-20"
      >
        <div className="page-shell py-5 sm:py-7">
          <OpportunityFilters
            activeCategory={category}
            activeSort={sort}
            activeQuery={q}
            activeCity={city}
            activeRegion={region}
            activeDeadline={deadline}
            activeGeography={geography}
            activeSector={sector}
            locations={locations}
          />
          {liveCategories.length > 0 ? (
            <nav aria-label="Opportunity categories" className="mt-5">
              <ul className="category-links">
                <li>
                  <Link
                    href={`${buildHref(null, sort, { q, city, region, deadline, geography, sector })}#opportunities`}
                    aria-current={category === null ? "page" : undefined}
                  >
                    All opportunities
                  </Link>
                </li>
                {liveCategories.map(({ slug, label }) => (
                  <li key={slug}>
                    <Link
                      href={`${buildHref(slug, sort, { q, city, region, deadline, geography, sector })}#opportunities`}
                      aria-current={category === slug ? "page" : undefined}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}

          {!isFiltered &&
          (snapshot.closingSoon.length > 0 ||
            snapshot.recentlyAdded.length > 0) ? (
            <details className="mt-5 border-y border-[var(--line)] py-1">
              <summary className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold">
                <UiIcon name="chevron" /> Closing soon &amp; recently added
              </summary>
              <div aria-label="Opportunity highlights" className="grid gap-5 py-3 sm:grid-cols-2">
              {snapshot.closingSoon.length > 0 ? (
                <div className="border-l-2 border-[var(--line)] pl-2">
                  <h2 className="flex items-center gap-2 px-3 text-base font-semibold">
                    <UiIcon name="clock" width="16" height="16" />
                    Closing soon
                  </h2>
                  <ul className="mt-2 divide-y divide-[var(--line)]">
                    {snapshot.closingSoon.map((item) => (
                      <li key={item.id}>
                        <SnapshotOpportunityLink
                          opportunity={item}
                          now={now}
                          returnHref="/#opportunities"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {snapshot.recentlyAdded.length > 0 ? (
                <div className="border-l-2 border-[var(--line)] pl-2">
                  <h2 className="flex items-center gap-2 px-3 text-base font-semibold">
                    <UiIcon name="arrow" width="16" height="16" />
                    Recently added
                  </h2>
                  <ul className="mt-2 divide-y divide-[var(--line)]">
                    {snapshot.recentlyAdded.map((item) => (
                      <li key={item.id}>
                        <SnapshotOpportunityLink
                          opportunity={item}
                          now={now}
                          returnHref="/#opportunities"
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              </div>
            </details>
          ) : null}

          <div className="mt-6 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] pb-5">
            <div>
              <h2
                id="opportunities-heading"
                className="text-2xl font-semibold tracking-tight"
              >
                {isFiltered ? "Search results" : "Explore opportunities"}
              </h2>
              <p
                role="status"
                aria-live="polite"
                className="mt-2 text-sm text-[var(--muted)]"
              >
                {resultLabel}
              </p>
            </div>
            <p className="text-xs text-[var(--muted)]">
              {sort === "relevance"
                ? "Best keyword matches first"
                : sort === "newest"
                  ? "Newest additions first"
                  : "Upcoming deadlines first"}
            </p>
          </div>
          <div className="mt-5">
            {opportunities.length === 0 ? (
              <EmptyState
                title={
                  isFiltered
                    ? "No matching opportunities"
                    : "No current opportunities to show"
                }
                message={
                  q !== null
                    ? `No published opportunities match “${q}”. Try different keywords or clear the search.`
                    : isFiltered
                      ? "Try a different category or location, or clear your filters to explore more opportunities."
                      : "New opportunities will appear here after review. Have one to share? Submit it for consideration."
                }
                actionHref={isFiltered ? "/#opportunities" : "/submit"}
                actionLabel={
                  isFiltered ? "Clear all filters" : "Submit an opportunity"
                }
                showBrowseAll={isFiltered}
              />
            ) : (
              <>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {visibleOpportunities.map((opportunity) => (
                    <li key={opportunity.id} className="min-w-0">
                      <OpportunityCard
                        opportunity={opportunity}
                        now={now}
                        returnHref={browseHref}
                        isSaved={savedIds.has(opportunity.id)}
                        isAuthenticated={user !== null}
                      />
                    </li>
                  ))}
                </ul>
                {hasMore ? (
                  <div className="mt-8 flex justify-center">
                    <Link href={showMoreHref} className="button-secondary">
                      Show more opportunities
                    </Link>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </section>
      <section
        aria-labelledby="trust-heading"
        className="mt-4 border-t border-[var(--line)] bg-[var(--surface)]"
      >
        <div className="page-shell grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr]">
          <div>
            <p className="eyebrow">Make an informed choice</p>
            <h2
              id="trust-heading"
              className="mt-3 text-xl font-semibold tracking-tight"
            >
              From discovery
              <br />
              to your next step.
            </h2>
          </div>
          <div>
            <h3 className="font-semibold">Check the evidence</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Publication requires human review. “Evidence verified” marks records
              that meet the fuller evidence checks. Other listings need careful
              source checks; review is not a guarantee of eligibility.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Make it your own</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Use For You to prioritize with an optional profile. Save a
              bookmark, then track Interested, Applying or Applied in Activity.
              These are your private notes; applications happen at the source.
            </p>
            <Link href="/for-you" className="nav-link mt-2 -ml-3 underline underline-offset-4">Open For You →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
