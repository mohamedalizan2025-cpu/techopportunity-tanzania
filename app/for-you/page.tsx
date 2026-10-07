import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ForYouExplanation } from "@/components/for-you-explanation";
import { OpportunityCard } from "@/components/opportunity-card";
import { UiIcon } from "@/components/ui-icon";
import { getForYouData } from "@/lib/data/for-you";
import { listSavedOpportunityIds } from "@/lib/data/saved-opportunities";
import { getAuthenticatedUser } from "@/lib/data/supabase-auth";
import { opportunityHref } from "@/lib/opportunity-presentation";
import type { RankedOpportunity } from "@/lib/personalization";
import {
  hasVerifiedTanzanianAccess,
  isAiSearchableOpportunity,
} from "@/lib/opportunity-trust";
import {
  CAREER_LEVEL_LABELS,
  type MatchingInput,
} from "@/lib/personalization";
import { categoryLabel } from "@/lib/category-labels";
import { SECTOR_LABELS } from "@/lib/taxonomy";

export const metadata: Metadata = {
  title: "AI Match | Tech Opportunity",
  description:
    "Verified-eligible opportunities ordered for your profile, with AI explanations grounded in evidence. Unknown eligibility is never labeled eligible.",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 24;
const OTHER_RELEVANT_LIMIT = 6;

function buildMoreHref(nextPage: number): string {
  return `/for-you?page=${nextPage}`;
}

function missingProfileFields(input: MatchingInput): string[] {
  const missing: string[] = [];
  if (input.careerLevel === null) missing.push("your level");
  if (input.fieldDiscipline === null) missing.push("your field");
  if (input.sectors.length === 0) missing.push("sectors you follow");
  if (input.preferredTypes.length === 0) missing.push("opportunity types");
  return missing;
}

function MatchingProfileSummary({ input }: { input: MatchingInput }) {
  const signals: string[] = [];
  if (input.careerLevel !== null) signals.push(CAREER_LEVEL_LABELS[input.careerLevel]);
  if (input.fieldDiscipline !== null) signals.push(input.fieldDiscipline);
  for (const sector of input.sectors) signals.push(SECTOR_LABELS[sector]);
  for (const type of input.preferredTypes) signals.push(categoryLabel(type));
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--subtle)]">
        Your matching profile
      </span>
      {signals.map((signal) => (
        <span key={signal} className="rounded-md border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]">
          {signal}
        </span>
      ))}
      <Link
        href="/profile"
        className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent-strong)] underline-offset-2 hover:underline"
      >
        Edit matching profile →
      </Link>
    </div>
  );
}

function MatchList({
  entries,
  savedIds,
  now,
  returnHref,
}: {
  entries: RankedOpportunity[];
  savedIds: Set<string>;
  now: Date;
  returnHref: string;
}) {
  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-2">
      {entries.map(({ opportunity, reasons }) => (
        <li key={opportunity.id} className="min-w-0">
          <OpportunityCard
            opportunity={opportunity}
            now={now}
            returnHref={returnHref}
            isSaved={savedIds.has(opportunity.id)}
            isAuthenticated
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
              <UiIcon name="user" width="14" height="14" />
              Why this fits you
            </span>
            {reasons.map((reason) => (
              <span
                key={reason}
                className="rounded-md bg-[var(--muted-surface)] px-2.5 py-1 text-xs font-medium text-[var(--muted)]"
              >
                {reason}
              </span>
            ))}
          </div>
          {isAiSearchableOpportunity(opportunity) ? (
            <ForYouExplanation slug={opportunity.slug} title={opportunity.title} />
          ) : null}
          {isAiSearchableOpportunity(opportunity) ? (
            <Link
              href={`${opportunityHref(opportunity.slug, returnHref)}#ai-opportunity-insight`}
              className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent-strong)] underline-offset-2 hover:underline"
            >
              Fit &amp; next steps →
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
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

  const eligible = forYou.entries.filter(({ opportunity }) =>
    hasVerifiedTanzanianAccess(opportunity)
  );
  const otherRelevant = forYou.entries
    .filter(({ opportunity }) => !hasVerifiedTanzanianAccess(opportunity))
    .slice(0, OTHER_RELEVANT_LIMIT);
  const visibleEligible = eligible.slice(0, page * PAGE_SIZE);
  const hasMore = eligible.length > visibleEligible.length;
  const missing = forYou.input ? missingProfileFields(forYou.input) : [];

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex-1 bg-[var(--background)]"
    >
      <section className="border-b border-[var(--line)] bg-[var(--hero)]">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            Your opportunity workspace
          </p>
          <h1 className="font-display mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
            AI Match
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Tell us what you&rsquo;re looking for. Tech Opportunity checks
            verified eligibility first, then AI helps explain which
            opportunities fit your profile.{" "}
            <Link
              href="/#opportunities"
              className="font-semibold text-[var(--accent-strong)] underline-offset-2 hover:underline"
            >
              Explore the full list
            </Link>{" "}
            anytime.
          </p>
          {forYou.hasProfile && forYou.input ? (
            <MatchingProfileSummary input={forYou.input} />
          ) : null}
        </div>
      </section>

      <section aria-labelledby="ai-match-heading">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="ai-match-heading"
                className="text-2xl font-semibold text-[var(--foreground)]"
              >
                Your eligible matches
              </h2>
              {forYou.hasProfile ? (
                <p role="status" className="mt-2 text-sm text-[var(--muted)]">
                  {eligible.length}{" "}
                  {eligible.length === 1 ? "match" : "matches"} with verified
                  Tanzanian access, ordered by your profile
                </p>
              ) : null}
            </div>
            <Link
              href="/profile"
              className="inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-[var(--line-strong)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
            >
              {forYou.hasProfile ? "Edit matching profile" : "Build your profile"}
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
              href="/ask"
              className="font-medium text-[var(--accent-strong)] underline-offset-2 hover:underline"
            >
              Ask Tech Opportunity →
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
              className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
            >
              Personalized recommendations are temporarily unavailable. Explore
              still shows the full published list.
            </div>
          ) : !forYou.hasProfile ? (
            <div className="mt-8">
              <EmptyState
                icon="user"
                title="Improve your matches"
                message={`Add a few optional details — ${missing.length > 0 ? missing.join(", ") : "your level, field, sectors, and the types you follow"} — and we'll order verified-eligible opportunities for you with clear reasons. This only sharpens ordering; it never affects acceptance. You can skip this and keep using Explore.`}
                actionHref="/profile"
                actionLabel="Complete matching profile"
                showBrowseAll
              />
            </div>
          ) : eligible.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title="No verified-eligible matches yet"
                message="Nothing in the current published list both matches your profile and carries verified Tanzanian access. Broaden your interests, or explore the relevant opportunities below — check back as new opportunities are reviewed."
                actionHref="/profile"
                actionLabel="Edit matching profile"
                showBrowseAll
              />
            </div>
          ) : (
            <>
              <MatchList
                entries={visibleEligible}
                savedIds={savedIds}
                now={now}
                returnHref="/for-you"
              />
              {hasMore ? (
                <div className="mt-8 flex justify-center">
                  <Link href={buildMoreHref(page + 1)} className="button-secondary">
                    Show more matches
                  </Link>
                </div>
              ) : null}
            </>
          )}

          {forYou.hasProfile && otherRelevant.length > 0 ? (
            <div className="mt-12 border-t-2 border-[var(--warning)] pt-6">
              <p className="mb-2 text-sm font-semibold text-[var(--warning)]">Eligibility not verified</p>
              <h2 className="text-2xl font-semibold text-[var(--foreground)]">
                Explore other relevant opportunities
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                These match your profile but their{" "}
                <span className="font-semibold text-[var(--foreground)]">
                  eligibility is not yet verified
                </span>{" "}
                — they are never counted as eligible matches. Check each
                source before acting.
              </p>
              <MatchList
                entries={otherRelevant}
                savedIds={savedIds}
                now={now}
                returnHref="/for-you"
              />
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
