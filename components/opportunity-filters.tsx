import Link from "next/link";
import {
  TANZANIA_MAINLAND_REGIONS,
  TANZANIA_ZANZIBAR_REGIONS,
  extraRegionValues,
} from "@/lib/tanzania-regions";
import type { OpportunityCategory } from "@/lib/types";
import type { DeadlineFilter, PublishedLocations } from "@/lib/data/opportunities";

interface OpportunityFiltersProps {
  activeCategory: OpportunityCategory | null;
  activeSort: "deadline" | "newest";
  activeQuery?: string | null;
  activeCity?: string | null;
  activeRegion?: string | null;
  activeDeadline?: DeadlineFilter | null;
  locations?: PublishedLocations;
}

export function buildHref(
  category: OpportunityCategory | null,
  sort: "deadline" | "newest",
  filters: {
    q?: string | null;
    city?: string | null;
    region?: string | null;
    deadline?: DeadlineFilter | null;
  }
): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (sort !== "deadline") params.set("sort", sort);
  if (filters.q) params.set("q", filters.q);
  if (filters.city) params.set("city", filters.city);
  if (filters.region) params.set("region", filters.region);
  if (filters.deadline) params.set("deadline", filters.deadline);
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
  const activeStyles =
    "border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]";
  const inactiveStyles =
    "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent-strong)]";

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] ${
        active ? activeStyles : inactiveStyles
      }`}
    >
      {children}
    </Link>
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
  return (
    <nav
      aria-label="Filter opportunities"
      className="flex w-full flex-col items-start gap-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm sm:p-5"
    >
      <form
        action="/"
        method="get"
        role="search"
        className="flex w-full flex-col gap-2 sm:flex-row"
      >
        {activeCategory ? (
          <input type="hidden" name="category" value={activeCategory} />
        ) : null}
        {activeSort !== "deadline" ? (
          <input type="hidden" name="sort" value={activeSort} />
        ) : null}
        {activeCity ? <input type="hidden" name="city" value={activeCity} /> : null}
        {activeRegion ? (
          <input type="hidden" name="region" value={activeRegion} />
        ) : null}
        {activeDeadline ? (
          <input type="hidden" name="deadline" value={activeDeadline} />
        ) : null}
        <input
          type="search"
          name="q"
          defaultValue={activeQuery ?? ""}
          maxLength={120}
          placeholder="Search by title, skill or place…"
          aria-label="Search opportunities"
          className="min-h-12 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--background)] px-4 text-base text-[var(--foreground)] outline-none transition placeholder:text-[var(--subtle)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        />
        <button
          type="submit"
          className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent)] px-7 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
        >
          Search
        </button>
      </form>

      <form
        action="/"
        method="get"
        aria-label="Structured filters"
        className="flex w-full flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:flex-wrap sm:items-center"
      >
        {activeQuery ? <input type="hidden" name="q" value={activeQuery} /> : null}
        {activeCategory ? (
          <input type="hidden" name="category" value={activeCategory} />
        ) : null}
        {activeSort !== "deadline" ? (
          <input type="hidden" name="sort" value={activeSort} />
        ) : null}

        <select
          name="deadline"
          defaultValue={activeDeadline ?? ""}
          aria-label="Filter by deadline"
          className={selectClasses}
        >
          <option value="">Any deadline</option>
          <option value="soon">Closing soon (14 days)</option>
          <option value="upcoming">Upcoming deadlines</option>
          <option value="rolling">No deadline listed</option>
        </select>

        {hasLocations ? (
          <select
            name="city"
            defaultValue={activeCity ?? ""}
            aria-label="Filter by city"
            className={selectClasses}
          >
            <option value="">Any city</option>
            {locations.cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        ) : null}

        <select
          name="region"
          defaultValue={activeRegion ?? ""}
          aria-label="Filter by region"
          className={selectClasses}
        >
          <option value="">Any region</option>
          <optgroup label="Mainland Tanzania">
            {TANZANIA_MAINLAND_REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </optgroup>
          <optgroup label="Zanzibar">
            {TANZANIA_ZANZIBAR_REGIONS.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </optgroup>
          {storedRegionExtras.length > 0 ? (
            <optgroup label="Other recorded regions">
              {storedRegionExtras.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>

        {activeDeadline || activeCity || activeRegion ? (
          <Link
            href={buildHref(activeCategory, activeSort, { q: activeQuery })}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            Clear
          </Link>
        ) : null}

        <button
          type="submit"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-[var(--muted-surface)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Apply
        </button>
      </form>

      <div className="flex w-full flex-col gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-[var(--subtle)]">Sort by</span>
      <ul className="flex flex-wrap gap-2">
        <li>
          <FilterLink
            href={buildHref(activeCategory, "deadline", { q: activeQuery, city: activeCity, region: activeRegion, deadline: activeDeadline })}
            active={activeSort === "deadline"}
          >
            Deadline
          </FilterLink>
        </li>
        <li>
          <FilterLink
            href={buildHref(activeCategory, "newest", { q: activeQuery, city: activeCity, region: activeRegion, deadline: activeDeadline })}
            active={activeSort === "newest"}
          >
            Newest
          </FilterLink>
        </li>
      </ul>
      </div>
    </nav>
  );
}
