import { EmptyState } from "@/components/empty-state";
import { OpportunityFilters } from "@/components/opportunity-filters";
import { categoryLabel } from "@/lib/category-labels";
import { listPublishedOpportunities } from "@/lib/data/opportunities";
import {
  OPPORTUNITY_CATEGORIES,
  type Opportunity,
  type OpportunityCategory,
} from "@/lib/types";
import Link from "next/link";

interface HomePageProps {
  searchParams: Promise<{ category?: string; sort?: string }>;
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
  if (!iso) return "Rolling";
  return `Deadline ${new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso))}`;
}

function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <li>
      <Link
        href={`/opportunities/${opportunity.slug}`}
        className="block rounded-lg border border-black/[.08] bg-white p-4 text-left transition-colors hover:border-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 dark:border-white/[.145] dark:bg-zinc-950 dark:hover:border-white/40 dark:focus-visible:ring-white/60"
      >
        <p className="font-medium text-black dark:text-zinc-50">
          {opportunity.title}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {opportunity.organization} · {categoryLabel(opportunity.category)}
          {opportunity.location?.city ? ` · ${opportunity.location.city}` : " · Remote"}
        </p>
        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
          {formatCardDeadline(opportunity.deadline)}
        </p>
      </Link>
    </li>
  );
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const category = parseCategory(params.category);
  const sort = parseSort(params.sort);
  const opportunities = await listPublishedOpportunities({ category, sort });
  const isFiltered = category !== null;

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center gap-10 py-24 text-center">
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl dark:text-zinc-50">
            TechOpportunity Tanzania
          </h1>
          <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Discover hackathons, scholarships, competitions, internships,
            fellowships, grants and tech events for Tanzanian students and
            young innovators.
          </p>
        </div>

        <OpportunityFilters activeCategory={category} activeSort={sort} />

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
            title={isFiltered ? "Nothing here yet" : "No opportunities yet"}
            message={
              isFiltered
                ? `No published opportunities match this filter. Try another category or select All.`
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
