import Link from "next/link";
import { UiIcon } from "@/components/ui-icon";
import { EmptyState } from "@/components/empty-state";
import {
  OpportunityCard,
  SnapshotOpportunityLink,
} from "@/components/opportunity-card";
import { InstallPrompt } from "@/components/install-prompt";
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
  featuredOpportunities,
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
  const featured = isFiltered ? [] : featuredOpportunities(opportunities, now, 3);
  const browseHref = `${buildHref(category, sort, { q, city, region, deadline, geography, sector })}#opportunities`;
  const visibleOpportunities = opportunities.slice(0, page * PAGE_SIZE);
  const hasMore = opportunities.length > visibleOpportunities.length;
  const showMoreHref = buildPageHref(browseHref, page + 1);
  const resultLabel = hasMore
    ? `Showing ${visibleOpportunities.length} of ${opportunities.length} opportunities`
    : formatResultCount(opportunities.length);

  return (
    <main id="main-content" tabIndex={-1} className="flex-1">
      <section className={`border-b border-[var(--line)] ${isFiltered ? "bg-[var(--hero)]" : "hero-dark"}`}>
        <div className={`page-shell ${isFiltered ? "py-5" : "py-8 sm:py-12"}`}>
          <p className={isFiltered ? "eyebrow" : "eyebrow-gold"}>For Tanzania’s emerging talent</p>
          <h1 className={isFiltered ? "mt-2 text-3xl font-semibold tracking-tight" : "hero-title font-display mt-4 max-w-3xl text-[#f7f2e8]"}>
            {isFiltered ? "Find your next opportunity" : "Find opportunities worth acting on."}
          </h1>
          {!isFiltered ? (
            <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
              <div className="min-w-0">
                <p className="max-w-2xl text-base leading-7 hero-muted">
                  Human-reviewed opportunities with eligibility evidence,
                  deadlines and tools that help you move from discovery to
                  application.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/#opportunities"
                    className="inline-flex min-h-12 items-center justify-center rounded-md bg-[var(--gold)] px-6 text-sm font-bold text-[#082f2b] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#082f2b]"
                  >
                    Explore opportunities
                  </Link>
                  <Link
                    href="/for-you"
                    className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/25 px-6 text-sm font-semibold text-[#f7f2e8] transition hover:border-[var(--gold)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
                  >
                    Get recommendations
                  </Link>
                </div>
                <form
                  action="/#opportunities"
                  method="get"
                  role="search"
                  aria-label="Search opportunities"
                  className="mt-5 flex w-full max-w-xl gap-2"
                >
                  <label htmlFor="hero-search" className="sr-only">
                    Search opportunities
                  </label>
                  <input
                    id="hero-search"
                    type="search"
                    name="q"
                    defaultValue={q ?? ""}
                    maxLength={120}
                    placeholder="Try “fellowship”, “internship”, “grant”…"
                    className="min-h-12 w-full min-w-0 rounded-md border border-white/25 bg-white/10 px-4 text-base text-[#f7f2e8] outline-none transition placeholder:text-[#c9d4cb]/70 focus:border-[var(--gold)] focus:ring-2 focus:ring-[var(--gold)]/40"
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-md border border-white/25 px-5 text-sm font-semibold text-[#f7f2e8] transition hover:border-[var(--gold)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#082f2b]"
                  >
                    Search
                  </button>
                </form>
                {liveCategories.length > 0 ? (
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label="Popular categories">
                    {liveCategories.slice(0, 5).map(({ slug, label }) => (
                      <li key={slug}>
                        <Link
                          href={`${buildHref(slug, sort, { q, city, region, deadline, geography, sector })}#opportunities`}
                          className="inline-flex min-h-11 items-center rounded-md border border-white/25 bg-white/5 px-4 text-sm font-semibold text-[#f7f2e8] transition hover:border-[var(--gold)] hover:text-[var(--gold)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]"
                        >
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-xs font-semibold hero-muted">
                  <li className="inline-flex items-center gap-1.5"><UiIcon name="shield" width="14" height="14" /> Human-reviewed</li>
                  <li className="inline-flex items-center gap-1.5"><UiIcon name="source" width="14" height="14" /> Source-linked</li>
                  <li className="inline-flex items-center gap-1.5"><UiIcon name="clock" width="14" height="14" /> Deadline-tracked</li>
                </ul>
              </div>
              <div
                className="rounded-md border border-white/15 bg-white/5 p-6 sm:p-7"
                aria-label="What every listing carries"
              >
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--gold)]">Every listing carries</p>
                <ul className="mt-4 space-y-4">
                  {[
                    { icon: "source", title: "Source evidence", body: "The authoritative source stays attached to every record." },
                    { icon: "clock", title: "Structured deadlines", body: "Closing dates tracked; unknowns stated as unknown." },
                    { icon: "globe", title: "Tanzania access checked", body: "Eligibility evidence where it exists — never inferred." },
                    { icon: "shield", title: "Human publication", body: "Nothing goes public without human review. AI never decides eligibility." },
                  ].map((row) => (
                    <li key={row.title} className="flex items-start gap-3">
                      <span aria-hidden="true" className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-white/10 text-[var(--gold)]">
                        <UiIcon name={row.icon as "source" | "clock" | "globe" | "shield"} width="18" height="18" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#f7f2e8]">{row.title}</span>
                        <span className="mt-0.5 block text-sm leading-6 hero-muted">{row.body}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <a href="#trust-heading" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--gold)] underline underline-offset-4">
                  How evidence works →
                </a>
              </div>
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

      {!isFiltered && featured.length > 0 ? (
        <section aria-labelledby="featured-heading" className="border-b border-[var(--line)] bg-[var(--surface)]">
          <div className="page-shell py-8 sm:py-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Closing soon across types</p>
                <h2 id="featured-heading" className="font-display mt-2 text-2xl font-semibold sm:text-3xl">
                  Featured now
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  Chosen by soonest deadline across opportunity types — never
                  sponsored, never paid placement.
                </p>
              </div>
              <Link
                href="/#opportunities"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline"
              >
                Explore all opportunities →
              </Link>
            </div>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {featured.map((opportunity) => (
                <li key={opportunity.id} className="min-w-0">
                  <OpportunityCard
                    opportunity={opportunity}
                    now={now}
                    returnHref="/#opportunities"
                    isSaved={savedIds.has(opportunity.id)}
                    isAuthenticated={user !== null}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section
        id="opportunities"
        aria-labelledby="opportunities-heading"
        className="scroll-mt-20"
      >
        <div className="page-shell py-5 sm:py-7">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--line)] pb-5">
            <div>
              <h2
                id="opportunities-heading"
                className="font-display text-2xl font-semibold sm:text-3xl"
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
                <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
        aria-labelledby="how-heading"
        className="border-t border-[var(--line)] bg-[var(--surface)]"
      >
        <div className="page-shell py-10 sm:py-14">
          <p className="eyebrow">How Tech Opportunity works</p>
          <h2 id="how-heading" className="font-display mt-3 max-w-2xl text-2xl font-semibold sm:text-3xl">
            More than a feed — a path from discovery to application.
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { n: "01", title: "Discover", body: "Find opportunities from Tanzania, Africa and globally in one place." },
              { n: "02", title: "Verify", body: "Check the source, deadline and access evidence — and what is still unknown." },
              { n: "03", title: "Prioritize", body: "Order the shelf with your profile and plain reasons per suggestion." },
              { n: "04", title: "Track", body: "Save, then mark Interested, Applying or Applied as you progress." },
              { n: "05", title: "Apply", body: "Submit at the authoritative source. The platform never applies for you." },
            ].map((step) => (
              <li key={step.n} className="border-t-2 border-[var(--gold)] pt-4">
                <p className="font-display text-3xl font-semibold text-[var(--accent-strong)]">{step.n}</p>
                <h3 className="mt-2 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <section
        aria-labelledby="platform-heading"
        className="hero-dark border-t border-black/20"
      >
        <div className="page-shell py-10 sm:py-14">
          <p className="eyebrow-gold">Built for the opportunity ecosystem</p>
          <h2 id="platform-heading" className="font-display mt-3 max-w-2xl text-2xl font-semibold text-[#f7f2e8] sm:text-3xl">
            One trusted platform, three sides.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-md border border-white/15 bg-white/5 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--gold)]">Talent · Live</p>
              <h3 className="mt-2 text-lg font-semibold text-[#f7f2e8]">Find opportunities worth acting on.</h3>
              <p className="mt-2 text-sm leading-6 hero-muted">
                Discover trusted calls, understand access, prioritize
                relevance and keep track of your application journey.
              </p>
              <Link href="/#opportunities" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--gold)] underline-offset-4 hover:underline">
                Explore opportunities →
              </Link>
            </div>
            <div className="rounded-md border border-white/15 bg-white/5 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--gold)]">Providers · Managed pilot</p>
              <h3 className="mt-2 text-lg font-semibold text-[#f7f2e8]">Reach relevant Tanzanian talent.</h3>
              <p className="mt-2 text-sm leading-6 hero-muted">
                We review a legitimate open call, distribute it through an
                agreed audience and report privacy-safe aggregate engagement.
                Provider self-service is not yet available.
              </p>
              <Link href="/organizations" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--gold)] underline-offset-4 hover:underline">
                How the pilot works →
              </Link>
            </div>
            <div className="rounded-md border border-white/15 bg-white/5 p-6">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--gold)]">Institutions · Early pilot</p>
              <h3 className="mt-2 text-lg font-semibold text-[#f7f2e8]">Make opportunity access easier for your community.</h3>
              <p className="mt-2 text-sm leading-6 hero-muted">
                Curated opportunity distribution with future privacy-safe
                engagement insight for students and emerging talent. No
                institution dashboards exist yet.
              </p>
              <Link href="/organizations" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--gold)] underline-offset-4 hover:underline">
                Learn about institutional use →
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section
        aria-labelledby="trust-heading"
        className="border-t border-[var(--line)] bg-[var(--surface)]"
      >
        <div className="page-shell py-10 sm:py-14">
          <p className="eyebrow">Why trust this platform</p>
          <h2
            id="trust-heading"
            className="font-display mt-3 max-w-2xl text-2xl font-semibold sm:text-3xl"
          >
            More than another opportunity feed.
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h3 className="flex items-center gap-2 font-semibold"><UiIcon name="source" width="18" height="18" /> Source evidence</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                We keep the authoritative source visible. Publication
                requires human review, and “Evidence verified” marks only
                records that meet the fuller evidence checks.
              </p>
            </div>
            <div>
              <h3 className="flex items-center gap-2 font-semibold"><UiIcon name="globe" width="18" height="18" /> Tanzanian access</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Where access is evidenced, we say so. Where it is unknown,
                we say that too — a location is never treated as proof of
                eligibility.
              </p>
            </div>
            <div>
              <h3 className="flex items-center gap-2 font-semibold"><UiIcon name="bookmark" width="18" height="18" /> Action workflow</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Save, prioritize and track progress instead of losing
                another link. Use For You to prioritize with an optional
                profile — these are your private notes.
              </p>
              <Link href="/for-you" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand)] underline underline-offset-4">Open For You →</Link>
            </div>
            <div>
              <h3 className="flex items-center gap-2 font-semibold"><UiIcon name="shield" width="18" height="18" /> Assistance, not authority</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Explanations help you read verified facts faster. AI never
                decides eligibility, deadlines or trust — the evidence does.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section aria-labelledby="cta-heading" className="border-t border-[var(--line)]">
        <div className="page-shell grid gap-6 py-10 sm:py-14 lg:grid-cols-2">
          <div className="rounded-md bg-[var(--brand-deep)] p-6 sm:p-8">
            <h2 id="cta-heading" className="font-display text-2xl font-semibold text-[#f7f2e8]">
              Ready when an opportunity is.
            </h2>
            <p className="mt-2 text-sm leading-6 hero-muted">
              Build a lightweight profile and let For You order the shelf
              with clear reasons — or keep exploring freely, no account needed.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/for-you" className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--gold)] px-5 text-sm font-bold text-[#082f2b] transition hover:brightness-110">
                Open For You
              </Link>
              <Link href="/#opportunities" className="inline-flex min-h-11 items-center justify-center rounded-md border border-white/25 px-5 text-sm font-semibold text-[#f7f2e8] hover:border-[var(--gold)] hover:text-[var(--gold)]">
                Keep exploring
              </Link>
            </div>
          </div>
          <div className="rounded-md border border-[var(--line-strong)] bg-[var(--surface)] p-6 sm:p-8">
            <p className="eyebrow">For organizations</p>
            <h2 className="mt-2 text-xl font-semibold">Share an opportunity with Tanzanian talent.</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              Providers, universities, hubs and NGOs: submit a legitimate
              open call for human review, or learn how the managed pilot
              and early institutional model work.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/submit" className="button-primary">
                Submit an opportunity
              </Link>
              <Link href="/organizations" className="button-secondary">
                For organizations
              </Link>
            </div>
          </div>
        </div>
      </section>
      <div className="page-shell pb-10">
        <InstallPrompt />
      </div>
    </main>
  );
}
