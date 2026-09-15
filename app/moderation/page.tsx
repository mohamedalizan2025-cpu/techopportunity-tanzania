import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logOutAction } from "@/lib/data/auth-actions";
import { categoryLabel } from "@/lib/category-labels";
import {
  filterPendingQueue,
  getModerationAccess,
  isQueueFilterEmpty,
  listPendingOpportunities,
  parseQueueFilter,
  queueFilterQuery,
} from "@/lib/data/moderation";
import {
  TRIAGE_BUCKET_PRIORITY,
  TRIAGE_BUCKET_SHORT,
  TRIAGE_HEURISTIC_NOTE,
  firstSuggestedReview,
  isAmbiguousQueueItem,
  triageBucketOf,
  type TriageBucket,
} from "@/lib/triage-bucket";
import { QueueBulkPanel } from "./queue-bulk-panel";

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

/**
 * Display-only expiry hint from the already-loaded stored deadline.
 * A passed calendar date reads "expired"; today or future stays unmarked and
 * a missing deadline stays unknown. This never decides anything — the
 * moderator still opens the record and verifies before acting.
 */
function isExpiredDeadline(iso: string | null, now: number = Date.now()): boolean {
  if (!iso) return false;
  return iso.slice(0, 10) < new Date(now).toISOString().slice(0, 10);
}

const badgeClasses =
  "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium";
const bucketBadgeClasses = `${badgeClasses} border-black/[.08] bg-zinc-50 text-zinc-600 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-400`;
const flaggedBadgeClasses = `${badgeClasses} border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200`;
const expiredBadgeClasses = `${badgeClasses} border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300`;
const sectionLabelClasses =
  "text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400";

const signOutButtonClasses =
  "inline-flex h-9 items-center rounded-full border border-black/[.10] bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50";

function filterChipClasses(active: boolean): string {
  const base =
    "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors ";
  return active
    ? `${base} border-black bg-black text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-black`
    : `${base} border-black/[.10] bg-white text-zinc-600 hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50`;
}

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
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

  // Server-side VIEW filters (Milestone 11): triage bucket + source. They
  // only narrow what this page renders — pending status, ordering and
  // decision logic are untouched, and the filter is always clearable.
  const filter = parseQueueFilter(await searchParams);
  const filtered = !isQueueFilterEmpty(filter);
  const query = queueFilterQuery(filter);
  const visible = filterPendingQueue(pending, filter);
  // The suggested entry point only makes sense in the unfiltered view —
  // a filtered list already starts at the record type being batched.
  const suggested = filtered ? null : firstSuggestedReview(triageItems);

  const bucketCounts = new Map<TriageBucket, number>();
  for (const item of triageItems) {
    bucketCounts.set(item.bucket, (bucketCounts.get(item.bucket) ?? 0) + 1);
  }
  // Ambiguous / weak-evidence REVIEW FLAG: bucket 7 (ambiguous) or 8
  // (news-like heuristic) — the same labeled hints as the badges, now
  // filterable. Hint only; the moderator still decides every record.
  const flaggedById = new Map(
    pending.map((opportunity) => [
      opportunity.id,
      isAmbiguousQueueItem(opportunity.category, opportunity.title),
    ])
  );
  // Expired-date hint per visible row, derived from the already-loaded stored
  // deadline (display only; same-day deadlines stay unmarked).
  const expiredById = new Map(
    pending.map((opportunity) => [
      opportunity.id,
      isExpiredDeadline(opportunity.deadline),
    ])
  );
  const flaggedCount = [...flaggedById.values()].filter(Boolean).length;
  const sourceCounts = new Map<string, number>();
  for (const opportunity of pending) {
    if (opportunity.sourceName) {
      sourceCounts.set(opportunity.sourceName, (sourceCounts.get(opportunity.sourceName) ?? 0) + 1);
    }
  }
  const sourceOptions = [...sourceCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );

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
            <p className="mt-1 text-sm">
              <Link
                href="/published-management"
                className="font-medium text-zinc-600 underline underline-offset-2 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Published records →
              </Link>
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
            {/* Find records — search and view filters in one card. They
                only narrow what this page renders; pending status, ordering
                and decision logic are untouched, and filters stay clearable. */}
            <section
              aria-label="Find records"
              className="mt-8 rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950"
            >
              <h2 className={sectionLabelClasses}>Find records</h2>
              <form method="get" action="/moderation" role="search" className="mt-3 flex flex-wrap gap-2">
                {filter.bucket !== null ? (
                  <input type="hidden" name="bucket" value={filter.bucket} />
                ) : null}
                {filter.sourceName !== null ? (
                  <input type="hidden" name="source" value={filter.sourceName} />
                ) : null}
                {filter.flag !== null ? (
                  <input type="hidden" name="flag" value={filter.flag} />
                ) : null}
                <input
                  type="search"
                  name="q"
                  defaultValue={filter.q ?? ""}
                  maxLength={120}
                  placeholder="Search pending titles…"
                  aria-label="Search pending titles"
                  className="h-9 min-w-0 flex-1 rounded-full border border-black/[.10] bg-white px-4 text-sm text-black outline-none transition-colors focus:border-black/40 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-white/40"
                />
                <button
                  type="submit"
                  className="inline-flex h-9 shrink-0 items-center rounded-full border border-black/[.10] bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Search
                </button>
              </form>
              <div className="flex flex-wrap items-center gap-2" aria-label="Filter queue by triage hint">
                <Link href="/moderation" className={filterChipClasses(!filtered)}>
                  All · {pending.length}
                </Link>
                {TRIAGE_BUCKET_PRIORITY.filter((bucket) => bucketCounts.has(bucket)).map((bucket) => (
                  <Link
                    key={bucket}
                    href={`/moderation${queueFilterQuery({ ...filter, bucket })}`}
                    className={filterChipClasses(filter.bucket === bucket)}
                  >
                    {TRIAGE_BUCKET_SHORT[bucket]} · {bucketCounts.get(bucket)}
                  </Link>
                ))}
                {flaggedCount > 0 ? (
                  <Link
                    href={`/moderation${queueFilterQuery({ ...filter, flag: "ambiguous" })}`}
                    className={filterChipClasses(filter.flag === "ambiguous")}
                  >
                    Flagged · {flaggedCount}
                  </Link>
                ) : null}
              </div>
              <details className="text-sm text-zinc-600 dark:text-zinc-400">
                <summary className="cursor-pointer select-none text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  Filter by source ({sourceOptions.length})
                </summary>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {filter.sourceName ? (
                    <Link
                      href={`/moderation${queueFilterQuery({ ...filter, sourceName: null })}`}
                      className={filterChipClasses(false)}
                    >
                      Any source
                    </Link>
                  ) : null}
                  {sourceOptions.map(([name, count]) => (
                    <Link
                      key={name}
                      href={`/moderation${queueFilterQuery({ ...filter, sourceName: name })}`}
                      className={filterChipClasses(filter.sourceName === name)}
                    >
                      {name} · {count}
                    </Link>
                  ))}
                </div>
              </details>
              {filtered ? (
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                  Filtered view — showing {visible.length} of {pending.length} pending ·{" "}
                  <Link href="/moderation" className="font-medium underline underline-offset-2 hover:text-black dark:hover:text-zinc-50">
                    Clear filter
                  </Link>
                </p>
              ) : (
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                  Showing all {pending.length} pending records.
                </p>
              )}
            </section>
            {visible.length === 0 ? (
              <div className="mt-6 rounded-lg border border-dashed border-black/[.15] p-8 text-center dark:border-white/[.2]">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No pending records match this filter.
                </p>
                <Link
                  href="/moderation"
                  className="mt-3 inline-flex h-9 items-center rounded-full border border-black/[.10] bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  Clear filter
                </Link>
              </div>
            ) : (
              <>
              <div className="mt-8 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className={sectionLabelClasses}>
                  Review list · {visible.length} of {pending.length}
                </h2>
                {visible.length > 1 ? (
                  <a
                    href="#bulk-actions"
                    className="text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    Select several below ↓
                  </a>
                ) : null}
              </div>
            {suggested ? (
              <Link
                href={`/moderation/${suggested.id}`}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
              >
                Start with a suggested high-value record →
              </Link>
            ) : null}
            <ul className="mt-4 flex flex-col gap-3">
              {visible.map((opportunity, index) => {
                const bucket = bucketById.get(opportunity.id);
                const flagged = flaggedById.get(opportunity.id) ?? false;
                const expired = expiredById.get(opportunity.id) ?? false;
                return (
                  <li key={opportunity.id}>
                    <Link
                      href={`/moderation/${opportunity.id}${query}`}
                      className="block rounded-lg border border-black/[.08] bg-white p-4 transition-colors hover:border-black/30 sm:p-5 dark:border-white/[.145] dark:bg-zinc-950 dark:hover:border-white/40"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="mt-0.5 w-7 shrink-0 text-right text-xs font-semibold tabular-nums text-zinc-400 dark:text-zinc-500"
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="min-w-0 flex-1 break-words font-medium text-black dark:text-zinc-50">
                              {opportunity.title}
                            </p>
                            {bucket ? (
                              <span className={bucketBadgeClasses}>
                                {TRIAGE_BUCKET_SHORT[bucket]}
                              </span>
                            ) : null}
                            {flagged ? (
                              <span className={flaggedBadgeClasses}>
                                flagged — verify
                              </span>
                            ) : null}
                            {expired ? (
                              <span className={expiredBadgeClasses}>
                                expired
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
                              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                                {segments.join(" · ")}
                              </p>
                            ) : null;
                          })()}
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                            Submitted {formatSubmitted(opportunity.createdAt)} · Deadline{" "}
                            {formatQueueDeadline(opportunity.deadline)}
                            {opportunity.sourceName ? ` · Source ${opportunity.sourceName}` : ""}
                          </p>
                        </div>
                        <span
                          aria-hidden="true"
                          className="mt-1 shrink-0 text-sm text-zinc-400 transition-transform dark:text-zinc-500"
                        >
                          →
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <QueueBulkPanel
              items={visible.map((opportunity) => ({
                id: opportunity.id,
                title: opportunity.title,
                flagged: flaggedById.get(opportunity.id) ?? false,
              }))}
            />
              </>
            )}
            <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">
              {TRIAGE_HEURISTIC_NOTE} Flagged means triage bucket 7
              (ambiguous) or 8 (news-like) — the same hints, filterable.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
