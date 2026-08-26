import Link from "next/link";
import { categoryLabel } from "@/lib/category-labels";
import { OPPORTUNITY_CATEGORIES, type OpportunityCategory } from "@/lib/types";

interface OpportunityFiltersProps {
  activeCategory: OpportunityCategory | null;
  activeSort: "deadline" | "newest";
}

function buildHref(
  category: OpportunityCategory | null,
  sort: "deadline" | "newest"
): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (sort !== "deadline") params.set("sort", sort);
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
}: OpportunityFiltersProps) {
  return (
    <nav
      aria-label="Filter opportunities"
      className="flex w-full flex-col items-center gap-3"
    >
      <ul className="flex flex-wrap justify-center gap-2">
        <li>
          <FilterLink href={buildHref(null, activeSort)} active={activeCategory === null}>
            All
          </FilterLink>
        </li>
        {OPPORTUNITY_CATEGORIES.map((category) => (
          <li key={category}>
            <FilterLink
              href={buildHref(category, activeSort)}
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
            href={buildHref(activeCategory, "deadline")}
            active={activeSort === "deadline"}
          >
            Deadline
          </FilterLink>
        </li>
        <li>
          <FilterLink
            href={buildHref(activeCategory, "newest")}
            active={activeSort === "newest"}
          >
            Newest
          </FilterLink>
        </li>
      </ul>
    </nav>
  );
}
