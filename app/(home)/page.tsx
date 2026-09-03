import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import {
  OpportunityCard,
  SnapshotOpportunityLink,
} from "@/components/opportunity-card";
import { OpportunityFilters, buildHref } from "@/components/opportunity-filters";
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
import { buildHomepageSnapshot, formatResultCount } from "@/lib/opportunity-presentation";

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

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-3 text-base leading-7 text-[var(--muted)]">{description}</p>
      ) : null}
    </div>
  );
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
  const savedIds = user ? await listSavedOpportunityIds(user) : new Set<string>();

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
    <main id="main-content" tabIndex={-1} className="flex-1 overflow-hidden">
      <section className="relative border-b border-[var(--line)] bg-[var(--hero)]">
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[var(--accent-soft)] blur-3xl sm:h-96 sm:w-96"
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.15fr_.85fr] lg:items-end lg:py-28">
          <div>
            <p className="inline-flex rounded-full border border-[var(--line-strong)] bg-[var(--surface)]/80 px-3 py-1.5 text-xs font-semibold text-[var(--accent-strong)] shadow-sm">
              Opportunities for Tanzania&apos;s tech community
            </p>
            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.04] tracking-[-0.055em] text-[var(--foreground)] sm:text-6xl lg:text-7xl">
              Find your next move in technology.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)] sm:text-xl">
              Explore scholarships, grants, internships, fellowships, events,
              competitions and more—curated for people building their future in tech.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="#opportunities"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(13,107,78,0.22)] transition hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-4"
              >
                Browse opportunities
              </a>
              <Link
                href="/?deadline=soon#opportunities"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-6 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                See what&apos;s closing soon
              </Link>
            </div>
          </div>

          <aside className="rounded-3xl border border-[var(--line)] bg-[var(--surface)]/90 p-5 shadow-[0_24px_70px_rgba(18,48,34,0.11)] backdrop-blur sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
              Know before you click
            </p>
            <ul className="mt-5 grid gap-4 text-sm leading-6 text-[var(--muted)]">
              <li className="flex gap-3"><span aria-hidden="true" className="mt-1 text-[var(--accent)]">✓</span><span>Deadlines are shown exactly when a date is available.</span></li>
              <li className="flex gap-3"><span aria-hidden="true" className="mt-1 text-[var(--accent)]">✓</span><span>Location and applicant eligibility stay separate.</span></li>
              <li className="flex gap-3"><span aria-hidden="true" className="mt-1 text-[var(--accent)]">✓</span><span>Every listing opens the source page for your own review.</span></li>
            </ul>
          </aside>
        </div>
      </section>

      {!isFiltered ? (
        <section aria-labelledby="snapshot-heading" className="border-b border-[var(--line)]">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div id="snapshot-heading">
                <SectionHeading
                  eyebrow="Live opportunity snapshot"
                  title="Start with what matters now"
                  description="A quick view of published opportunities from the live collection—never demo listings or invented counts."
                />
              </div>
              <a href="#opportunities" className="w-fit text-sm font-semibold text-[var(--accent-strong)] underline decoration-[var(--line-strong)] underline-offset-4 hover:decoration-[var(--accent)]">
                Browse the full list
              </a>
            </div>

            <div className="mt-9 grid gap-5 lg:grid-cols-2">
              <article className="rounded-2xl border border-[var(--line)] bg-[var(--muted-surface)] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 px-3">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Closing in the next 14 days</h3>
                  <span aria-hidden="true" className="text-xl">↘</span>
                </div>
                {snapshot.closingSoon.length > 0 ? (
                  <ul className="mt-3 divide-y divide-[var(--line)]">
                    {snapshot.closingSoon.map((opportunity) => (
                      <li key={opportunity.id}><SnapshotOpportunityLink opportunity={opportunity} now={now} returnHref="/#opportunities" /></li>
                    ))}
                  </ul>
                ) : (
                  <p className="mx-3 mt-4 rounded-xl border border-dashed border-[var(--line-strong)] p-5 text-sm leading-6 text-[var(--muted)]">
                    No published opportunities with a confirmed deadline in the next 14 days right now.
                  </p>
                )}
              </article>

              <article className="rounded-2xl border border-[var(--line)] bg-[var(--muted-surface)] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 px-3">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">Recently added</h3>
                  <span aria-hidden="true" className="text-xl">↗</span>
                </div>
                {snapshot.recentlyAdded.length > 0 ? (
                  <ul className="mt-3 divide-y divide-[var(--line)]">
                    {snapshot.recentlyAdded.map((opportunity) => (
                      <li key={opportunity.id}><SnapshotOpportunityLink opportunity={opportunity} now={now} returnHref="/#opportunities" /></li>
                    ))}
                  </ul>
                ) : (
                  <p className="mx-3 mt-4 rounded-xl border border-dashed border-[var(--line-strong)] p-5 text-sm leading-6 text-[var(--muted)]">
                    No current published opportunities are available yet. New approved listings will appear here.
                  </p>
                )}
              </article>
            </div>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="categories-heading" className="bg-[var(--surface)]">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div id="categories-heading">
            <SectionHeading eyebrow="Explore by type" title="Choose the path that fits" description="Browse the platform’s live opportunity categories." />
          </div>
          {liveCategories.length > 0 ? (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <li>
                <Link
                  href={`${buildHref(null, sort, { q, city, region, deadline })}#opportunities`}
                  className={`group flex min-h-24 items-center justify-between rounded-2xl border p-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${category === null ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--background)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"}`}
                >
                  <span><span className="block text-xs font-bold text-[var(--subtle)]">ALL</span><span className="mt-1 block text-base font-semibold text-[var(--foreground)]">All opportunities</span></span>
                  <span aria-hidden="true" className="text-xl text-[var(--accent-strong)] transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </li>
              {liveCategories.map(({ slug, label }, index) => (
                <li key={slug}>
                  <Link
                    href={`${buildHref(slug, sort, { q, city, region, deadline })}#opportunities`}
                    className={`group flex min-h-24 items-center justify-between rounded-2xl border p-5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${category === slug ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] bg-[var(--background)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]"}`}
                  >
                    <span><span className="block text-xs font-bold text-[var(--subtle)]">{String(index + 1).padStart(2, "0")}</span><span className="mt-1 block text-base font-semibold text-[var(--foreground)]">{label}</span></span>
                    <span aria-hidden="true" className="text-xl text-[var(--accent-strong)] transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-8"><EmptyState title="Categories are not available yet" message="Published opportunity categories will appear here when the live catalogue is available." /></div>
          )}
        </div>
      </section>

      <section id="opportunities" aria-labelledby="opportunities-heading" className="scroll-mt-20 border-y border-[var(--line)] bg-[var(--background)]">
        <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-col gap-8">
            <div id="opportunities-heading">
              <SectionHeading
                eyebrow={isFiltered ? "Your results" : "Published opportunities"}
                title={isFiltered ? "Opportunities matching your search" : "Find what moves you forward"}
                description="Search and filter published listings. Unknown details stay clearly marked so you can make an informed choice."
              />
            </div>
            <OpportunityFilters activeCategory={category} activeSort={sort} activeQuery={q} activeCity={city} activeRegion={region} activeDeadline={deadline} locations={locations} />

            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p role="status" aria-live="polite" className="text-sm font-semibold text-[var(--foreground)]">
                {resultLabel}
              </p>
              <p className="text-xs text-[var(--subtle)]">
                {sort === "relevance"
                  ? "Ordered by deterministic word match"
                  : sort === "newest"
                    ? "Newest additions first"
                    : "Upcoming deadlines first; unknown dates follow"}
              </p>
            </div>

            {opportunities.length === 0 ? (
              <EmptyState
                title={isFiltered ? "No matching opportunities" : "No published opportunities yet"}
                message={q !== null ? `No published opportunities match “${q}”. Try different keywords or clear the search.` : isFiltered ? "No published opportunities match these filters. Clear a filter or broaden your search." : "Approved opportunities will appear here as soon as they are published."}
                actionHref={isFiltered ? "/#opportunities" : "/submit"}
                actionLabel={isFiltered ? "Clear all filters" : "Submit an opportunity"}
              />
            ) : (
              <ul className="grid gap-5 md:grid-cols-2">
                {opportunities.map((opportunity) => (
                  <li key={opportunity.id}>
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

      <section aria-labelledby="trust-heading" className="bg-[var(--surface)]">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
          <div id="trust-heading"><SectionHeading eyebrow="Built for informed decisions" title="Useful information, honestly presented" description="We keep the path from discovery to publication deliberate, and we link you back to the source." /></div>
          <ol className="grid gap-3 sm:grid-cols-2">
            {[
              ["Discover", "Find potential opportunities from selected sources."],
              ["Verify", "Inspect the source and retain supporting evidence."],
              ["Qualify", "Check relevance without guessing missing facts."],
              ["Moderate & publish", "A human reviews records before they become public."],
            ].map(([title, text], index) => (
              <li key={title} className="rounded-2xl border border-[var(--line)] bg-[var(--background)] p-5">
                <span className="text-xs font-bold text-[var(--accent)]">0{index + 1}</span>
                <h3 className="mt-3 font-semibold text-[var(--foreground)]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
