import { EmptyState } from "@/components/empty-state";
import { listPublishedOpportunities } from "@/lib/data/opportunities";

export const revalidate = 60;

export default async function HomePage() {
  const opportunities = await listPublishedOpportunities();

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
        {opportunities.length === 0 ? (
          <EmptyState
            title="No opportunities yet"
            message="The database layer is scaffolded but not connected yet. Approved opportunities will appear here once Supabase is wired up."
          />
        ) : (
          <ul className="flex w-full flex-col gap-3 text-left">
            {opportunities.map((opportunity) => (
              <li
                key={opportunity.id}
                className="rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950"
              >
                <p className="font-medium text-black dark:text-zinc-50">
                  {opportunity.title}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {opportunity.organization} · {opportunity.category}
                  {opportunity.location?.city
                    ? ` · ${opportunity.location.city}`
                    : " · Remote"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
