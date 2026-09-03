import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { AlertPreferenceControl } from "@/components/alert-preference-control";
import { OpportunityCard } from "@/components/opportunity-card";
import { SaveOpportunityControl } from "@/components/save-opportunity-control";
import { deadlineAlertEventLabel } from "@/lib/alert-preference-state";
import {
  getDeadlineAlertPreference,
  listDeadlineAlertEvents,
} from "@/lib/data/deadline-alerts";
import { listSavedOpportunities } from "@/lib/data/saved-opportunities";
import { getAuthenticatedUser } from "@/lib/data/supabase-auth";
import { formatDeadlinePresentation } from "@/lib/opportunity-presentation";
import { formatSavedDate } from "@/lib/saved-opportunity-state";

export const metadata: Metadata = {
  title: "Saved opportunities | TechOpportunity Tanzania",
  description: "Your private list of saved opportunities.",
  robots: { index: false, follow: false },
};

export default async function SavedOpportunitiesPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect("/login?next=%2Fsaved");

  const [result, alertPreference, alertHistory] = await Promise.all([
    listSavedOpportunities(user),
    getDeadlineAlertPreference(user),
    listDeadlineAlertEvents(user),
  ]);
  const signedInAs = user.displayName ?? user.email ?? "your account";

  return (
    <main id="main-content" tabIndex={-1} className="flex-1 bg-[var(--background)]">
      <section className="border-b border-[var(--line)] bg-[var(--hero)]">
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            Your account
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-5xl">
            Saved opportunities
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Revisit opportunities you saved while browsing. Only you can see this list.
          </p>
          <p className="mt-3 break-words text-xs text-[var(--subtle)]">
            Signed in as {signedInAs}
          </p>
        </div>
      </section>

      <section aria-labelledby="deadline-alerts-heading" className="border-b border-[var(--line)]">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--accent)]">
              Deadline intelligence
            </p>
            <h2 id="deadline-alerts-heading" className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
              Alerts for saved opportunities
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
              Get a private in-app alert when a saved, published opportunity is within 14 days of its known deadline, or when its deadline changes. Unknown and closed deadlines do not generate approaching alerts.
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--subtle)]">
              Email delivery is not part of this milestone. An alert shown here means generated, not emailed or sent.
            </p>
            <div className="mt-5">
              {alertPreference.available ? (
                <AlertPreferenceControl enabled={alertPreference.enabled} />
              ) : (
                <p role="alert" className="text-sm text-amber-800 dark:text-amber-200">
                  Deadline alert settings are temporarily unavailable.
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-[var(--foreground)]">Recent generated alerts</h3>
            {!alertHistory.available ? (
              <p className="mt-3 text-sm text-[var(--muted)]">Alert history is temporarily unavailable.</p>
            ) : alertHistory.events.length === 0 ? (
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                No deadline alerts have been generated for your account yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {alertHistory.events.map((event) => {
                  const deadline = formatDeadlinePresentation(event.deadline);
                  return (
                    <li key={event.id} className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4">
                      <Link href={`/opportunities/${encodeURIComponent(event.opportunity.slug)}?from=%2Fsaved`} className="font-semibold text-[var(--foreground)] hover:text-[var(--accent-strong)]">
                        {event.opportunity.title}
                      </Link>
                      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                        {deadlineAlertEventLabel(event.eventType)}
                      </p>
                      {event.deadline ? (
                        <p className="mt-1 text-xs text-[var(--subtle)]">
                          {deadline.dateLabel ? `${deadline.label}: ${deadline.dateLabel}` : deadline.label}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="saved-list-heading">
        <div className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="saved-list-heading" className="text-2xl font-semibold text-[var(--foreground)]">
                Your saved list
              </h2>
              {result.available ? (
                <p role="status" className="mt-2 text-sm text-[var(--muted)]">
                  {result.entries.length} {result.entries.length === 1 ? "saved opportunity" : "saved opportunities"}
                </p>
              ) : null}
            </div>
            <Link
              href="/#opportunities"
              className="inline-flex min-h-11 w-fit items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Browse opportunities
            </Link>
          </div>

          {!result.available ? (
            <div role="alert" className="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              Saved opportunities are temporarily unavailable. Your public browsing experience is unaffected.
            </div>
          ) : result.entries.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title="You haven't saved any opportunities yet"
                message="Browse opportunities and save the ones you want to revisit."
                actionHref="/#opportunities"
                actionLabel="Browse opportunities"
              />
            </div>
          ) : (
            <ul className="mt-8 grid gap-5 md:grid-cols-2">
              {result.entries.map((entry) => (
                <li key={entry.savedId}>
                  {entry.opportunity ? (
                    <div className="h-full">
                      <p className="mb-2 text-xs text-[var(--subtle)]">
                        {formatSavedDate(entry.savedAt) ?? "Saved date unavailable"}
                      </p>
                      <OpportunityCard
                        opportunity={entry.opportunity}
                        returnHref="/saved"
                        isSaved
                        isAuthenticated
                      />
                    </div>
                  ) : (
                    <article className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--subtle)]">
                        Unavailable
                      </p>
                      <h3 className="mt-3 text-lg font-semibold text-[var(--foreground)]">
                        This saved opportunity is no longer publicly available
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        Its private or removed details are not shown. You can safely remove this saved reference.
                      </p>
                      <p className="mt-3 text-xs text-[var(--subtle)]">
                        {formatSavedDate(entry.savedAt) ?? "Saved date unavailable"}
                      </p>
                      <div className="mt-5">
                        <SaveOpportunityControl
                          opportunityId={entry.opportunityId}
                          opportunityTitle="unavailable opportunity"
                          isSaved
                          isAuthenticated
                          returnTo="/saved"
                        />
                      </div>
                    </article>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
