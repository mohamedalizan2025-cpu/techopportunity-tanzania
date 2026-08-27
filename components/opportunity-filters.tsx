import Link from "next/link";
import { categoryLabel } from "@/lib/category-labels";
import { OPPORTUNITY_CATEGORIES, type OpportunityCategory } from "@/lib/types";

interface OpportunityFiltersProps {
  activeCategory: OpportunityCategory | null;
  activeSort: "deadline" | "newest";
  activeQuery?: string | null;
}

function buildHref(
  category: OpportunityCategory | null,
  sort: "deadline" | "newest",
  q?: string | null
): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (sort !== "deadline") params.set("sort", sort);
  if (q) params.set("q", q);
  const queryString = params.toString();
  return queryString ? `/?${queryString}` : "/";
}

function FilterLink({
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
}: OpportunityFiltersProps) {
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

      <ul className="flex flex-wrap justify-center gap-2">
        <li>
          <FilterLink href={buildHref(null, activeSort, activeQuery)} active={activeCategory === null}>
            All
          </FilterLink>
        </li>
        {OPPORTUNITY_CATEGORIES.map((category) => (
          <li key={category}>
            <FilterLink
              href={buildHref(category, activeSort, activeQuery)}
              active={activeCategory === category}
            >
              {categoryLabel(category)}
            </FilterLink>
          </li>
        ))}
      </ul>

      <ul className="flex flex-wrap justify-center gap-2">
        <li>
          <FilterLink
            href={buildHref(activeCategory, "deadline", activeQuery)}
            active={activeSort === "deadline"}
          >
            Deadline
          </FilterLink>
        </li>
        <li>
          <FilterLink
            href={buildHref(activeCategory, "newest", activeQuery)}
            active={activeSort === "newest"}
          >
            Newest
          </FilterLink>
        </li>
      </ul>
    </nav>
  );
}
