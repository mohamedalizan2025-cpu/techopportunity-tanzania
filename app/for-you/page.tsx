import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { OpportunityCard } from "@/components/opportunity-card";
import { UiIcon } from "@/components/ui-icon";
import { getForYouData } from "@/lib/data/for-you";
import { listSavedOpportunityIds } from "@/lib/data/saved-opportunities";
import { getAuthenticatedUser } from "@/lib/data/supabase-auth";

export const metadata: Metadata = {
  title: "For You | Tech Opportunity",
  description:
    "Personalized opportunities from the same trusted corpus as Explore, with clear reasons for every suggestion.",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 24;

function buildMoreHref(nextPage: number): string {
  return `/for-you?page=${nextPage}`;
}

export default async function ForYouPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?next=%2Ffor-you");

  const [forYou, savedIds] = await Promise.all([
    getForYouData(user),
    listSavedOpportunityIds(user),
  ]);
  const now = new Date();

  const visible = forYou.entries.slice(0, page * PAGE_SIZE);
  const hasMore = forYou.entries.length > visible.length;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex-1 bg-[var(--background)]"
    >
      <section className="border-b border-[var(--line)] bg-[var(--hero)]">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            Personalized
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-5xl">
            For You
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Opportunities from the same trusted corpus as Explore, ordered by
            your profile with a clear reason for each. For You never hides
            anything —{" "}
            <Link
              href="/#opportunities"
              className="font-semibold text-[var(--accent-strong)] underline-offset-2 hover:underline"
            >
              Explore the full list
            </Link>{" "}
            anytime.
          </p>
        </div>
      </section>

      <section aria-labelledby="for-you-heading">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="for-you-heading"
                className="text-2xl font-semibold text-[var(--foreground)]"
              >
                Your recommendations
              </h2>
              {forYou.hasProfile ? (
                <p role="status" className="mt-2 text-sm text-[var(--muted)]">
                  {forYou.entries.length}{" "}
                  {forYou.entries.length === 1 ? "match" : "matches"} from your
                  profile
                </p>
              ) : null}
            </div>
            <Link
              href="/profile"
              className="inline-flex min-h-11 w-fit items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
            >
              {forYou.hasProfile ? "Edit profile" : "Build your profile"}
            </Link>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link
              href="/activity"
              className="font-medium text-[var(--accent-strong)] underline-offset-2 hover:underline"
            >
              Track progress in your activity →
            </Link>
            <Link
              href="/saved"
              className="font-medium text-[var(--muted)] underline-offset-2 hover:underline"
            >
              Your saved list →
            </Link>
          </div>

          {!forYou.available ? (
            <div
              role="alert"
              className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
            >
              Personalized recommendations are temporarily unavailable. Explore
              still shows the complete trusted list.
            </div>
          ) : !forYou.hasProfile ? (
            <div className="mt-8">
              <EmptyState
                title="Set up your profile to see For You"
                message="Add a few optional details — your level, field, sectors, and the types you follow — and we'll order opportunities for you with clear reasons. You can skip this and keep using Explore."
                actionHref="/profile"
                actionLabel="Build your profile"
                showBrowseAll
              />
            </div>
          ) : forYou.entries.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title="No matches yet"
                message="Nothing in the current trusted corpus matches your profile. Broaden your interests, or explore the full list — new opportunities are added continuously."
                actionHref="/profile"
                actionLabel="Edit your profile"
                showBrowseAll
              />
            </div>
          ) : (
            <>
              <ul className="mt-8 grid gap-4 sm:grid-cols-2">
                {visible.map(({ opportunity, reasons }) => (
                  <li key={opportunity.id} className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--accent-strong)]">
                        <UiIcon name="check" width="14" height="14" />
                        Why this fits you
                      </span>
                      {reasons.map((reason) => (
                        <span
                          key={reason}
                          className="trust-badge trust-badge-verified"
                        >
                          {reason}
                        </span>
                      ))}
                    </div>
                    <OpportunityCard
                      opportunity={opportunity}
                      now={now}
                      returnHref="/for-you"
                      isSaved={savedIds.has(opportunity.id)}
                      isAuthenticated
                    />
                  </li>
                ))}
              </ul>
              {hasMore ? (
                <div className="mt-8 flex justify-center">
                  <Link href={buildMoreHref(page + 1)} className="button-secondary">
                    Show more matches
                  </Link>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
