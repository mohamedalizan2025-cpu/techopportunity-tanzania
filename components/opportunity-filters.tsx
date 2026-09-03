import Link from "next/link";
import { categoryLabel } from "@/lib/category-labels";
import {
  TANZANIA_MAINLAND_REGIONS,
  TANZANIA_ZANZIBAR_REGIONS,
  extraRegionValues,
} from "@/lib/tanzania-regions";
import type { OpportunityCategory } from "@/lib/types";
import type {
  DeadlineFilter,
  OpportunitySort,
  PublishedLocations,
} from "@/lib/data/opportunities";

interface OpportunityFiltersProps {
  activeCategory: OpportunityCategory | null;
  activeSort: OpportunitySort;
  activeQuery?: string | null;
  activeCity?: string | null;
  activeRegion?: string | null;
  activeDeadline?: DeadlineFilter | null;
  locations?: PublishedLocations;
}

interface FilterValues {
  q?: string | null;
  city?: string | null;
  region?: string | null;
  deadline?: DeadlineFilter | null;
}

export function buildHref(
  category: OpportunityCategory | null,
  sort: OpportunitySort,
  filters: FilterValues
): string {
  const params = new URLSearchParams();
  const q = filters.q?.trim() || null;
  const effectiveSort = sort === "relevance" && !q ? "deadline" : sort;
  const defaultSort: OpportunitySort = q ? "relevance" : "deadline";
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (filters.deadline) params.set("deadline", filters.deadline);
  if (filters.city) params.set("city", filters.city);
  if (filters.region) params.set("region", filters.region);
  if (effectiveSort !== defaultSort) params.set("sort", effectiveSort);
  const queryString = params.toString();
  return queryString ? `/?${queryString}` : "/";
}

const selectClasses =
  "min-h-11 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)] sm:w-auto";

export function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
        active
          ? "border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]"
          : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
      }`}
    >
      {children}
    </Link>
  );
}

function HiddenState({
  category,
  sort,
  q,
}: {
  category: OpportunityCategory | null;
  sort: OpportunitySort;
  q: string | null;
}) {
  const defaultSort: OpportunitySort = q ? "relevance" : "deadline";
  return (
    <>
      {category ? <input type="hidden" name="category" value={category} /> : null}
      {sort !== defaultSort ? <input type="hidden" name="sort" value={sort} /> : null}
    </>
  );
}

export function OpportunityFilters({
  activeCategory,
  activeSort,
  activeQuery = null,
  activeCity = null,
  activeRegion = null,
  activeDeadline = null,
  locations = { cities: [], regions: [] },
}: OpportunityFiltersProps) {
  const hasLocations = locations.cities.length > 0 || locations.regions.length > 0;
  const storedRegionExtras = extraRegionValues(locations.regions);
  const withoutQuerySort = activeSort === "relevance" ? "deadline" : activeSort;
  const shared = {
    q: activeQuery,
    city: activeCity,
    region: activeRegion,
    deadline: activeDeadline,
  };
  const activeChips = [
    activeQuery
      ? {
          key: "query",
          label: `Search: “${activeQuery}”`,
          href: buildHref(activeCategory, withoutQuerySort, { ...shared, q: null }),
        }
      : null,
    activeCategory
      ? {
          key: "category",
          label: `Type: ${categoryLabel(activeCategory)}`,
          href: buildHref(null, activeSort, shared),
        }
      : null,
    activeDeadline
      ? {
          key: "deadline",
          label:
            activeDeadline === "soon"
              ? "Deadline: next 14 days"
              : activeDeadline === "upcoming"
                ? "Deadline: upcoming"
                : "Deadline: not listed",
          href: buildHref(activeCategory, activeSort, { ...shared, deadline: null }),
        }
      : null,
    activeCity
      ? {
          key: "city",
          label: `City: ${activeCity}`,
          href: buildHref(activeCategory, activeSort, { ...shared, city: null }),
        }
      : null,
    activeRegion
      ? {
          key: "region",
          label: `Region: ${activeRegion}`,
          href: buildHref(activeCategory, activeSort, { ...shared, region: null }),
        }
      : null,
  ].filter((chip): chip is { key: string; label: string; href: string } => chip !== null);

  return (
    <nav
      aria-label="Search and filter opportunities"
      className="flex w-full flex-col items-start gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-5"
    >
      <form action="/" method="get" role="search" className="w-full">
        <HiddenState category={activeCategory} sort={activeSort} q={activeQuery} />
        {activeCity ? <input type="hidden" name="city" value={activeCity} /> : null}
        {activeRegion ? <input type="hidden" name="region" value={activeRegion} /> : null}
        {activeDeadline ? <input type="hidden" name="deadline" value={activeDeadline} /> : null}
        <label htmlFor="opportunity-search" className="mb-2 block text-sm font-semibold text-[var(--foreground)]">
          Search published opportunities
        </label>
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <input
            id="opportunity-search"
            type="search"
            name="q"
            defaultValue={activeQuery ?? ""}
            maxLength={120}
            placeholder="Try AI, fellowship, developer or an organization…"
            className="min-h-12 w-full min-w-0 rounded-xl border border-[var(--line-strong)] bg-[var(--background)] px-4 text-base text-[var(--foreground)] outline-none transition placeholder:text-[var(--subtle)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
          <button
            type="submit"
            className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] px-7 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            Search
          </button>
        </div>
        <p className="mt-2 text-xs leading-5 text-[var(--subtle)]">
          Matches words across titles, descriptions, opportunity types, organizations, sources and recorded places.
        </p>
      </form>

      <form
        action="/"
        method="get"
        aria-label="Opportunity filters"
        className="flex w-full flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <HiddenState category={activeCategory} sort={activeSort} q={activeQuery} />
        {activeQuery ? <input type="hidden" name="q" value={activeQuery} /> : null}

        <label className="grid gap-1 text-xs font-semibold text-[var(--muted)]">
          Deadline
          <select name="deadline" defaultValue={activeDeadline ?? ""} className={selectClasses}>
            <option value="">Any deadline</option>
            <option value="soon">Closing in 14 days</option>
            <option value="upcoming">Any upcoming date</option>
            <option value="rolling">Deadline not listed</option>
          </select>
        </label>

        {hasLocations ? (
          <label className="grid gap-1 text-xs font-semibold text-[var(--muted)]">
            City
            <select name="city" defaultValue={activeCity ?? ""} className={selectClasses}>
              <option value="">Any city</option>
              {locations.cities.map((city) => <option key={city} value={city}>{city}</option>)}
            </select>
          </label>
        ) : null}

        <label className="grid gap-1 text-xs font-semibold text-[var(--muted)]">
          Region
          <select name="region" defaultValue={activeRegion ?? ""} className={selectClasses}>
            <option value="">Any region</option>
            <optgroup label="Mainland Tanzania">
              {TANZANIA_MAINLAND_REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
            </optgroup>
            <optgroup label="Zanzibar">
              {TANZANIA_ZANZIBAR_REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
            </optgroup>
            {storedRegionExtras.length > 0 ? (
              <optgroup label="Other recorded regions">
                {storedRegionExtras.map((region) => <option key={region} value={region}>{region}</option>)}
              </optgroup>
            ) : null}
          </select>
        </label>

        <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-[var(--muted-surface)] px-5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
          Apply filters
        </button>
      </form>

      {activeChips.length > 0 ? (
        <div className="w-full border-t border-[var(--line)] pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-bold uppercase tracking-[0.15em] text-[var(--subtle)]">Active</span>
            {activeChips.map((chip) => (
              <Link key={chip.key} href={`${chip.href}#opportunities`} aria-label={`Remove ${chip.label}`} className="inline-flex min-h-9 items-center rounded-full border border-[var(--line-strong)] bg-[var(--accent-soft)] px-3 text-xs font-semibold text-[var(--accent-strong)] hover:border-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
                {chip.label}<span aria-hidden="true" className="ml-2">×</span>
              </Link>
            ))}
            <Link href="/#opportunities" className="inline-flex min-h-9 items-center px-2 text-xs font-semibold text-[var(--muted)] underline underline-offset-4 hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
              Clear all
            </Link>
          </div>
        </div>
      ) : null}

      <div className="flex w-full flex-col gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--subtle)]">Sort by</span>
        <ul className="flex flex-wrap gap-2" aria-label="Sort results">
          {activeQuery ? (
            <li><FilterLink href={`${buildHref(activeCategory, "relevance", shared)}#opportunities`} active={activeSort === "relevance"}>Best match</FilterLink></li>
          ) : null}
          <li><FilterLink href={`${buildHref(activeCategory, "deadline", shared)}#opportunities`} active={activeSort === "deadline"}>Deadline soonest</FilterLink></li>
          <li><FilterLink href={`${buildHref(activeCategory, "newest", shared)}#opportunities`} active={activeSort === "newest"}>Newest</FilterLink></li>
        </ul>
      </div>
    </nav>
  );
}
