import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { OpportunityCard } from "@/components/opportunity-card";
import { SaveOpportunityControl } from "@/components/save-opportunity-control";
import { ActivityControl } from "@/components/activity-control";
import { listSavedOpportunityIds } from "@/lib/data/saved-opportunities";
import {
  listTalentActivities,
  type TalentActivityListResult,
} from "@/lib/data/talent-activities";
import { getAuthenticatedUser } from "@/lib/data/supabase-auth";
import {
  ACTIVITY_STATUSES,
  ACTIVITY_STATUS_DESCRIPTIONS,
  ACTIVITY_STATUS_LABELS,
  formatActivityDate,
  type ActivityStatus,
} from "@/lib/talent-activity-state";

export const metadata: Metadata = {
  title: "Your activity | Tech Opportunity",
  description:
    "Your private saved list and application progress in one place.",
  robots: { index: false, follow: false },
};

function entriesFor(
  result: TalentActivityListResult,
  status: ActivityStatus
) {
  return result.entries.filter((entry) => entry.activityStatus === status);
}

export default async function ActivityPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?next=%2Factivity");

  const [activity, savedIds] = await Promise.all([
    listTalentActivities(user),
    listSavedOpportunityIds(user),
  ]);
  const signedInAs = user.displayName ?? user.email ?? "your account";
  const trackedTotal = activity.entries.length;

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex-1 bg-[var(--background)]"
    >
      <section className="border-b border-[var(--line)] bg-[var(--hero)]">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            Your account
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-5xl">
            Your activity
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Saved bookmarks and application progress in one private place.
            Only you can see this list — Explore stays the complete trusted
            universe for everyone.
          </p>
          <p className="mt-3 break-words text-xs text-[var(--subtle)]">
            Signed in as {signedInAs}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/#opportunities"
              className="inline-flex min-h-11 w-fit items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Explore opportunities
            </Link>
            <Link
              href="/for-you"
              className="inline-flex min-h-11 w-fit items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              For You
            </Link>
            <Link
              href="/saved"
              className="inline-flex min-h-11 w-fit items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Saved list
            </Link>
          </div>
        </div>
      </section>

      {!activity.available ? (
        <section aria-labelledby="activity-unavailable-heading">
          <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
            <div
              role="alert"
              className="mt-2 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
            >
              Application tracking is temporarily unavailable. Your saved list
              is unaffected —{" "}
              <Link href="/saved" className="font-semibold underline underline-offset-2">
                open your saved list
              </Link>
              .
            </div>
          </div>
        </section>
      ) : trackedTotal === 0 ? (
        <section aria-labelledby="activity-empty-heading">
          <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="activity-empty-heading"
                  className="text-2xl font-semibold text-[var(--foreground)]"
                >
                  Application progress
                </h2>
                <p role="status" className="mt-2 text-sm text-[var(--muted)]">
                  0 tracked opportunities
                </p>
              </div>
            </div>
            <div className="mt-8">
              <EmptyState
                title="Nothing tracked yet"
                message="Open any opportunity and mark it Interested, Applying, or Applied. Your saved bookmarks stay separate so you can revisit anything later."
                actionHref="/#opportunities"
                actionLabel="Browse opportunities"
              />
            </div>
          </div>
        </section>
      ) : (
        <section aria-labelledby="activity-list-heading">
          <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
            <h2
              id="activity-list-heading"
              className="text-2xl font-semibold text-[var(--foreground)]"
            >
              Application progress
            </h2>
            <p role="status" className="mt-2 text-sm text-[var(--muted)]">
              {trackedTotal}{" "}
              {trackedTotal === 1 ? "tracked opportunity" : "tracked opportunities"}
            </p>
            {ACTIVITY_STATUSES.map((status) => {
              const entries = entriesFor(activity, status);
              if (entries.length === 0) return null;
              return (
                <div key={status} className="mt-8">
                  <h3 className="text-lg font-semibold text-[var(--foreground)]">
                    {ACTIVITY_STATUS_LABELS[status]} · {entries.length}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {ACTIVITY_STATUS_DESCRIPTIONS[status]}
                  </p>
                  <ul className="mt-4 grid gap-5 md:grid-cols-2">
                    {entries.map((entry) => (
                      <li key={entry.activityId}>
                        {entry.opportunity ? (
                          <div className="flex h-full flex-col">
                            <p className="mb-2 text-xs text-[var(--subtle)]">
                              {formatActivityDate(entry.updatedAt) ??
                                "Update date unavailable"}
                            </p>
                            <OpportunityCard
                              opportunity={entry.opportunity}
                              returnHref="/activity"
                              isSaved={savedIds.has(entry.opportunityId)}
                              isAuthenticated
                            />
                            <div className="mt-3 flex flex-wrap gap-3">
                              <ActivityControl
                                opportunityId={entry.opportunityId}
                                opportunityTitle={entry.opportunity.title}
                                currentStatus={entry.activityStatus}
                                isAuthenticated
                                returnTo="/activity"
                              />
                              <SaveOpportunityControl
                                opportunityId={entry.opportunityId}
                                opportunityTitle={entry.opportunity.title}
                                isSaved={savedIds.has(entry.opportunityId)}
                                isAuthenticated
                                returnTo="/activity"
                              />
                            </div>
                          </div>
                        ) : (
                          <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--subtle)]">
                              Unavailable
                            </p>
                            <h4 className="mt-3 text-lg font-semibold text-[var(--foreground)]">
                              This tracked opportunity is no longer publicly
                              available
                            </h4>
                            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                              Its private or removed details are not shown. You
                              can safely remove this tracking reference.
                            </p>
                            <p className="mt-3 text-xs text-[var(--subtle)]">
                              {formatActivityDate(entry.updatedAt) ??
                                "Update date unavailable"}
                            </p>
                            <div className="mt-5">
                              <ActivityControl
                                opportunityId={entry.opportunityId}
                                opportunityTitle="unavailable opportunity"
                                currentStatus={entry.activityStatus}
                                isAuthenticated
                                returnTo="/activity"
                              />
                            </div>
                          </article>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
