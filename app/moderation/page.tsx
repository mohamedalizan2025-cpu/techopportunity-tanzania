import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logOutAction } from "@/lib/data/auth-actions";
import { categoryLabel } from "@/lib/category-labels";
import { getModerationAccess, listPendingOpportunities } from "@/lib/data/moderation";
import {
  TRIAGE_BUCKET_SHORT,
  TRIAGE_HEURISTIC_NOTE,
  firstSuggestedReview,
  triageBucketOf,
} from "@/lib/triage-bucket";

export const metadata: Metadata = {
  title: "Moderation queue · TechOpportunity Tanzania",
  robots: { index: false, follow: false },
};

function formatSubmitted(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function formatQueueDeadline(iso: string | null): string {
  // Missing deadline = unknown; moderators must see the truth, not a guess.
  if (!iso) return "No deadline";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

const signOutButtonClasses =
  "inline-flex h-9 items-center rounded-full border border-black/[.10] bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50";

export default async function ModerationPage() {
  const access = await getModerationAccess();

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      redirect("/login?next=%2Fmoderation");
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-50 px-6 py-24 text-center font-sans dark:bg-black">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Access restricted
        </h1>
        <p className="max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          Your account does not have moderation permissions.
        </p>
        <form action={logOutAction}>
          <button type="submit" className={signOutButtonClasses}>
            Sign out
          </button>
        </form>
      </div>
    );
  }

  const { displayName, email } = access.staff;
  const pending = await listPendingOpportunities();
  const signedInAs = displayName ?? email ?? "staff";

  // Triage hints are prioritization signals only (title + category
  // heuristics); the queue order itself stays deterministic.
  const triageItems = pending.map((opportunity) => ({
    id: opportunity.id,
    bucket: triageBucketOf(opportunity.category, opportunity.title),
  }));
  const bucketById = new Map(triageItems.map((item) => [item.id, item.bucket]));
  const suggested = firstSuggestedReview(triageItems);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:py-16">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
              Moderation queue
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Signed in as {signedInAs} ·{" "}
              {pending.length === 0
                ? "queue is empty"
                : `${pending.length} awaiting review`}
            </p>
          </div>
          <form action={logOutAction}>
            <button type="submit" className={signOutButtonClasses}>
              Sign out
            </button>
          </form>
        </div>

        {pending.length === 0 ? (
          <p className="mt-10 rounded-lg border border-dashed border-black/[.15] p-8 text-center text-sm text-zinc-500 dark:border-white/[.2] dark:text-zinc-400">
            No submissions are waiting for review right now.
          </p>
        ) : (
          <>
            {suggested ? (
              <Link
                href={`/moderation/${suggested.id}`}
                className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
              >
                Start with a suggested high-value record →
              </Link>
            ) : null}
            <ul className="mt-6 flex flex-col gap-3">
              {pending.map((opportunity) => {
                const bucket = bucketById.get(opportunity.id);
                return (
                  <li key={opportunity.id}>
                    <Link
                      href={`/moderation/${opportunity.id}`}
                      className="block rounded-lg border border-black/[.08] bg-white p-4 transition-colors hover:border-black/30 dark:border-white/[.145] dark:bg-zinc-950 dark:hover:border-white/40"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="min-w-0 flex-1 break-words font-medium text-black dark:text-zinc-50">
                          {opportunity.title}
                        </p>
                        {bucket ? (
                          <span className="shrink-0 rounded-full border border-black/[.08] bg-zinc-50 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-400">
                            {TRIAGE_BUCKET_SHORT[bucket]}
                          </span>
                        ) : null}
                      </div>
                      {(() => {
                        const segments = [
                          opportunity.organization,
                          categoryLabel(opportunity.category),
                          opportunity.location?.city ?? null,
                        ].filter((segment): segment is string => segment !== null && segment !== "");
                        return segments.length > 0 ? (
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {segments.join(" · ")}
                          </p>
                        ) : null;
                      })()}
                      {opportunity.sourceName ? (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                          Auto-discovered · {opportunity.sourceName}
                          {opportunity.discoveryMethod ? ` · ${opportunity.discoveryMethod}` : ""}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                        Submitted {formatSubmitted(opportunity.createdAt)} · Deadline{" "}
                        {formatQueueDeadline(opportunity.deadline)}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
              {TRIAGE_HEURISTIC_NOTE}
            </p>
          </>
        )}
      </main>
    </div>
  );
}
