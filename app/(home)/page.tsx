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

export const revalidate = 60;

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

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const category = parseOpportunityCategory(params.category);
  const q = sanitizeSearchQuery(params.q);
  const sort = parseOpportunitySort(params.sort, q !== null);
  const city = sanitizeFilterValue(params.city);
  const region = sanitizeFilterValue(params.region);
  const deadline = parseDeadlineFilter(params.deadline);

  const [browseData, liveCategories, user] = await Promise.all([
    getPublicBrowseData({ category, sort, q, city, region, deadline }),
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
    deadline !== null;
  const now = new Date();
  const snapshot = isFiltered
    ? { closingSoon: [], recentlyAdded: [] }
    : buildHomepageSnapshot(opportunities, now);
  const browseHref = `${buildHref(category, sort, { q, city, region, deadline })}#opportunities`;
  const resultLabel = formatResultCount(opportunities.length);

  return (
    <main id="main-content" tabIndex={-1} className="flex-1">
      <section className="border-b border-[var(--line)] bg-[var(--hero)]">
        <div
          className={`page-shell grid gap-8 ${isFiltered ? "py-8" : "py-9 sm:py-10 lg:grid-cols-[1.4fr_1fr] lg:items-center"}`}
        >
          <div>
            <p className="eyebrow flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
              />
              For Tanzania’s tech community
            </p>
            <h1
              className={
                isFiltered
                  ? "mt-3 text-3xl font-semibold tracking-tight"
                  : "hero-title mt-4"
              }
            >
              {isFiltered ? (
                "Find your next opportunity"
              ) : (
                <>
                  Find your next
                  <br />
                  <span className="text-[var(--accent)]">
                    opportunity in tech.
                  </span>
                </>
              )}
            </h1>
            {!isFiltered ? (
              <p className="mt-5 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                Explore scholarships, fellowships, internships and more. Find
                the details that matter, then take your next step.
              </p>
            ) : null}
          </div>
          {!isFiltered ? (
            <aside className="hidden border-l border-[var(--line-strong)] pl-8 lg:block">
              <p className="text-lg font-semibold tracking-tight">
                Know more before you apply.
              </p>
              <ul className="mt-5 space-y-4 text-sm text-[var(--muted)]">
                <li className="flex items-center gap-3">
                  <UiIcon name="source" />
                  Source links you can check yourself
                </li>
                <li className="flex items-center gap-3">
                  <UiIcon name="clock" />
                  Deadlines and missing dates, clearly marked
                </li>
                <li className="flex items-center gap-3">
                  <UiIcon name="info" />
                  Eligibility is never assumed from location
                </li>
              </ul>
            </aside>
          ) : null}
        </div>
      </section>

      <section
        id="opportunities"
        aria-labelledby="opportunities-heading"
        className="scroll-mt-20"
      >
        <div className="page-shell py-8 sm:py-10">
          <OpportunityFilters
            activeCategory={category}
            activeSort={sort}
            activeQuery={q}
            activeCity={city}
            activeRegion={region}
            activeDeadline={deadline}
            locations={locations}
          />
          {liveCategories.length > 0 ? (
            <nav aria-label="Opportunity categories" className="mt-5">
              <ul className="category-links">
                <li>
                  <Link
                    href={`${buildHref(null, sort, { q, city, region, deadline })}#opportunities`}
                    aria-current={category === null ? "page" : undefined}
                  >
                    All opportunities
                  </Link>
                </li>
                {liveCategories.map(({ slug, label }) => (
                  <li key={slug}>
                    <Link
                      href={`${buildHref(slug, sort, { q, city, region, deadline })}#opportunities`}
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
            <section
              aria-label="Opportunity highlights"
              className="mt-8 grid gap-5 sm:grid-cols-2"
            >
              {snapshot.closingSoon.length > 0 ? (
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
                  <h2 className="px-3 text-base font-semibold">Closing soon</h2>
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
                <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
                  <h2 className="px-3 text-base font-semibold">
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
            </section>
          ) : null}

          <div className="mt-9 flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] pb-5">
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
                    : "No published opportunities yet"
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
              />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {opportunities.map((opportunity) => (
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
              Opportunity discovery,
              <br />
              with context.
            </h2>
          </div>
          <div>
            <h3 className="font-semibold">Go back to the source</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Every listing includes a source link. Check the latest
              requirements and dates before applying.
            </p>
          </div>
          <div>
            <h3 className="font-semibold">Unknown means unknown</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              A location is not proof of eligibility. When details aren’t
              confirmed, we say so.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
