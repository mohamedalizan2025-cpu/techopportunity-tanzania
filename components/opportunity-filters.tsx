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
  "h-10 rounded-full border border-black/[.10] bg-white px-4 text-sm text-zinc-700 outline-none transition-colors focus:border-black/40 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-300 dark:focus:border-white/40";

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
    "border-transparent bg-foreground text-background hover:bg-[#383838] dark:hover:bg-[#ccc]";
  const inactiveStyles =
    "border-black/[.08] bg-white text-zinc-600 hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50";

  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
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
      className="flex w-full flex-col items-center gap-3"
    >
      <form
        action="/"
        method="get"
        role="search"
        className="flex w-full max-w-xl flex-col gap-2 sm:flex-row"
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
          placeholder="Search title, description, city…"
          aria-label="Search opportunities"
          className="h-10 w-full rounded-full border border-black/[.10] bg-white px-4 text-sm text-black outline-none transition-colors focus:border-black/40 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-white/40"
        />
        <button
          type="submit"
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Search
        </button>
      </form>

      <form
        action="/"
        method="get"
        aria-label="Structured filters"
        className="flex w-full max-w-xl flex-wrap items-center justify-center gap-2"
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
            className="inline-flex h-10 items-center rounded-full border border-black/[.10] bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Clear
          </Link>
        ) : null}

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-full border border-black/[.10] bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          Apply
        </button>
      </form>

      <ul className="flex flex-wrap justify-center gap-2">
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
    </nav>
  );
}
