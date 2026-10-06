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
  TRIAGE_BUCKET_SHORT,
  TRIAGE_HEURISTIC_NOTE,
  firstSuggestedReview,
  isFurnitureQueueItem,
  triageBucketOf,
  type TriageBucket,
} from "@/lib/triage-bucket";
import {
  GEOGRAPHY_GROUPS,
  GEOGRAPHY_LABELS,
  SECTOR_LABELS,
  geographyOf,
  sectorOf,
  type Geography,
  type Sector,
} from "@/lib/taxonomy";
import { QueueBulkPanel } from "./queue-bulk-panel";
import { StaffNav } from "@/components/staff-nav";

export const metadata: Metadata = {
  title: "Moderation queue · TechOpportunity Tanzania",
  robots: { index: false, follow: false },
};

const PAGE_SIZE = 50;

function formatDiscoveryMethod(method: string | null | undefined): string | null {
  // Raw pipeline tokens (rss, json-ld, html, sitemap, manual) are provenance
  // metadata, not moderator-facing copy — render them as human-readable
  // format labels instead of leaking e.g. "· html" into the queue.
  if (!method) return null;
  const normalized = method.trim().toLowerCase();
  if (normalized === "html") return "Web page";
  if (normalized === "rss") return "Feed";
  if (normalized === "json-ld" || normalized === "jsonld") return "Structured data";
  if (normalized === "sitemap") return "Sitemap";
  if (normalized === "manual") return "Manual entry";
  if (normalized === "website") return "Web page";
  return method;
}

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
  "inline-flex h-9 items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]";

function filterChipClasses(active: boolean): string {
  const base =
    "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition-colors ";
  return active
    ? `${base} bg-[var(--primary)] text-white border-[var(--primary)]`
    : `${base} border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] hover:text-[var(--foreground)]`;
}

function triageBadgeClasses(bucket: TriageBucket | undefined): string {
  if (bucket === 2) return "triage-badge triage-high";
  if (bucket === 1) return "triage-badge triage-action";
  if (bucket === 7) return "triage-badge triage-ambiguous";
  if (bucket === 8) return "triage-badge triage-warn";
  return "triage-badge triage-ambiguous";
}

function triageBadgeLabel(bucket: TriageBucket | undefined): string {
  if (bucket === 2) return "High value";
  if (bucket === 1) return "Actionable";
  if (bucket === 7) return "Ambiguous";
  if (bucket === 8) return "Needs check";
  return TRIAGE_BUCKET_SHORT[bucket ?? 7];
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
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[var(--background)] px-6 py-24 text-center font-sans">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Access restricted
        </h1>
        <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
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
  const params = await searchParams;
  const filter = parseQueueFilter(params);
  const filtered = !isQueueFilterEmpty(filter);
  const query = queueFilterQuery(filter);
  const visible = filterPendingQueue(pending, filter);
  // The suggested entry point only makes sense in the unfiltered view —
  // a filtered list already starts at the record type being batched.
  const suggested = filtered ? null : firstSuggestedReview(triageItems);

  // Pagination: show up to `page * PAGE_SIZE` items with a "Load more" link.
  const rawPage = Array.isArray(params.page) ? params.page[0] : params.page;
  const page = Math.max(1, parseInt(rawPage ?? "1", 10) || 1);
  const displayLimit = page * PAGE_SIZE;
  const paginatedVisible = visible.slice(0, displayLimit);
  const hasMore = visible.length > displayLimit;

  const bucketCounts = new Map<TriageBucket, number>();
  for (const item of triageItems) {
    bucketCounts.set(item.bucket, (bucketCounts.get(item.bucket) ?? 0) + 1);
  }
  const missingDeadlineCount = pending.filter(
    (opportunity) => !opportunity.deadline
  ).length;
  // Frozen site-furniture REVIEW FLAG: exact reviewed titles only (hint, not
  // a verdict). Counted over the full pending list so the chip shows the
  // whole batch even inside another filtered view.
  const furnitureCount = pending.filter((opportunity) =>
    isFurnitureQueueItem(opportunity.title)
  ).length;
  const sourceCounts = new Map<string, number>();
  for (const opportunity of pending) {
    if (opportunity.sourceName) {
      sourceCounts.set(opportunity.sourceName, (sourceCounts.get(opportunity.sourceName) ?? 0) + 1);
    }
  }
  const sourceOptions = [...sourceCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );
  // Derived taxonomy counts (National/International group + sector) over the
  // full pending list, so each chip shows the whole batch even inside another
  // filtered view. Unknown dimensions are simply absent — never fabricated.
  const geographyCounts = new Map<Geography, number>();
  const sectorCounts = new Map<Sector, number>();
  for (const opportunity of pending) {
    const group = geographyOf(opportunity);
    if (group !== null) geographyCounts.set(group, (geographyCounts.get(group) ?? 0) + 1);
    const sector = sectorOf(opportunity);
    if (sector !== null) sectorCounts.set(sector, (sectorCounts.get(sector) ?? 0) + 1);
  }
  const sectorOptions = [...sectorCounts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)] font-sans">
      <StaffNav />
      <div className="staff-hero border-b border-black/20">
        <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow-gold">Staff review</p>
            <h1 className="font-display mt-2 text-3xl font-semibold text-[#f7f2e8] sm:text-4xl">
              Moderation queue
            </h1>
            <p className="mt-2 text-sm hero-muted">
              Signed in as {signedInAs} ·{" "}
              {pending.length === 0
                ? "queue is empty"
                : `${pending.length} awaiting review`}
            </p>
            <p className="mt-2 text-sm">
              <Link
                href="/published-management"
                className="font-medium text-[#c9d4cb] underline underline-offset-2 hover:text-[var(--gold)]"
              >
                Published records →
              </Link>
              {" · "}
              <Link
                href="/campaigns"
                className="font-medium text-[#c9d4cb] underline underline-offset-2 hover:text-[var(--gold)]"
              >
                Campaign pilot →
              </Link>
            </p>
          </div>
          <form action={logOutAction}>
            <button type="submit" className="inline-flex h-9 items-center rounded-md border border-white/25 bg-white/5 px-4 text-sm font-medium text-[#f7f2e8] transition-colors hover:border-[var(--gold)]">
              Sign out
            </button>
          </form>
        </div>
        </div>
      </div>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 sm:py-10">

        {pending.length === 0 ? (
          <p className="mt-10 rounded-lg border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">
            No submissions are waiting for review right now.
          </p>
        ) : (
          <>
            {/* Operational summary — counts only, from the same pending list. */}
            <dl
              aria-label="Queue summary"
              className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5"
            >
              {(
                [
                  ["Pending", pending.length, "Awaiting a decision."],
                  ["High value", bucketCounts.get(2) ?? 0, "Scholarships, fellowships, grants, internships."],
                  ["Actionable", (bucketCounts.get(1) ?? 0), "Title reads like an open call — verify."],
                  ["Ambiguous", bucketCounts.get(7) ?? 0, "Needs closer reading."],
                  ["No deadline", missingDeadlineCount, "No date found in evidence."],
                ] as const
              ).map(([label, count, hint]) => (
                <div
                  key={label}
                  className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-3"
                >
                  <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--subtle)]">
                    {label}
                  </dt>
                  <dd className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
                    {count}
                  </dd>
                  <dd className="mt-0.5 text-[11px] leading-4 text-[var(--muted)]">
                    {hint}
                  </dd>
                </div>
              ))}
            </dl>
            <QueueBulkPanel
              items={paginatedVisible.map((opportunity) => ({
                id: opportunity.id,
                title: opportunity.title,
                flagged: false,
              }))}
            />
            {/* View filters — narrow the list, never change what is pending. */}
            <div className="mt-8 flex flex-col gap-2">
              <form method="get" action="/moderation" role="search" className="flex gap-2">
                {filter.bucket !== null ? (
                  <input type="hidden" name="bucket" value={filter.bucket} />
                ) : null}
                {filter.sourceName !== null ? (
                  <input type="hidden" name="source" value={filter.sourceName} />
                ) : null}
                {filter.flag !== null ? (
                  <input type="hidden" name="flag" value={filter.flag} />
                ) : null}
                {filter.geography ? (
                  <input type="hidden" name="geography" value={filter.geography} />
                ) : null}
                {filter.sector ? (
                  <input type="hidden" name="sector" value={filter.sector} />
                ) : null}
                <input
                  type="search"
                  name="q"
                  defaultValue={filter.q ?? ""}
                  maxLength={120}
                  placeholder="Search pending titles…"
                  aria-label="Search pending titles"
                  className="h-9 min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]"
                />
                <button
                  type="submit"
                  className="inline-flex h-9 shrink-0 items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                >
                  Search
                </button>
              </form>
              <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Triage review lanes">
                <Link
                  href="/moderation"
                  role="tab"
                  aria-selected={!filter.bucket}
                  className={filterChipClasses(!filtered)}
                >
                  All · {pending.length}
                </Link>
                {(
                  [
                    [2, "High value"],
                    [1, "Actionable"],
                    [7, "Ambiguous"],
                  ] as const
                ).map(([bucket, label]) => (
                  <Link
                    key={bucket}
                    role="tab"
                    aria-selected={filter.bucket === bucket}
                    href={`/moderation${queueFilterQuery({ ...filter, bucket })}`}
                    className={filterChipClasses(filter.bucket === bucket)}
                  >
                    {label} · {bucketCounts.get(bucket) ?? 0}
                  </Link>
                ))}
                {furnitureCount > 0 ? (
                  <Link
                    href={`/moderation${queueFilterQuery({ ...filter, flag: "furniture" })}`}
                    className={filterChipClasses(filter.flag === "furniture")}
                  >
                    Furniture · {furnitureCount}
                  </Link>
                ) : null}
              </div>
              <details className="text-sm text-[var(--muted)]">
                <summary className="cursor-pointer select-none text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
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
              <details className="text-sm text-[var(--muted)]">
                <summary className="cursor-pointer select-none text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
                  Filter by group &amp; sector
                </summary>
                <div className="mt-2 flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-[var(--muted)]">
                      Group:
                    </span>
                    {filter.geography ? (
                      <Link
                        href={`/moderation${queueFilterQuery({ ...filter, geography: null })}`}
                        className={filterChipClasses(false)}
                      >
                        Any group
                      </Link>
                    ) : null}
                    {GEOGRAPHY_GROUPS.map((group) => {
                      const count = geographyCounts.get(group) ?? 0;
                      if (count === 0) return null;
                      return (
                        <Link
                          key={group}
                          href={`/moderation${queueFilterQuery({ ...filter, geography: group })}`}
                          className={filterChipClasses(filter.geography === group)}
                        >
                          {GEOGRAPHY_LABELS[group]} · {count}
                        </Link>
                      );
                    })}
                  </div>
                  {sectorOptions.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-[var(--muted)]">
                        Sector:
                      </span>
                      {filter.sector ? (
                        <Link
                          href={`/moderation${queueFilterQuery({ ...filter, sector: null })}`}
                          className={filterChipClasses(false)}
                        >
                          Any sector
                        </Link>
                      ) : null}
                      {sectorOptions.map(([sector, count]) => (
                        <Link
                          key={sector}
                          href={`/moderation${queueFilterQuery({ ...filter, sector })}`}
                          className={filterChipClasses(filter.sector === sector)}
                        >
                          {SECTOR_LABELS[sector]} · {count}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </details>
              {filtered ? (
                <p className="text-xs text-[var(--muted)]">
                  Filtered view — showing {visible.length} of {pending.length} pending ·{" "}
                  <Link href="/moderation" className="font-medium underline underline-offset-2 hover:text-[var(--foreground)]">
                    Clear filter
                  </Link>
                </p>
              ) : null}
            </div>
            {visible.length === 0 ? (
              <p className="mt-6 rounded-lg border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">
                No pending records match this filter — clear it to see the full queue.
              </p>
            ) : (
              <>
            {suggested ? (
              <Link
                href={`/moderation/${suggested.id}`}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-[var(--primary)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-deep)]"
              >
                Start with a suggested high-value record →
              </Link>
            ) : null}
            <p className="mt-4 text-xs text-[var(--muted)]" role="status">
              Showing {paginatedVisible.length} of {visible.length}{" "}
              {pending.length !== visible.length ? `(${pending.length} pending total)` : "pending"}
              {filtered ? " · filtered view" : ""} · queue order: oldest submitted first
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {paginatedVisible.map((opportunity) => {
                const bucket = bucketById.get(opportunity.id);
                return (
                  <li key={opportunity.id}>
                    <Link
                      href={`/moderation/${opportunity.id}${query}`}
                      className="grid gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] p-3 transition-colors hover:border-[var(--line-strong)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4 sm:p-4"
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className={triageBadgeClasses(bucket)}>
                            {triageBadgeLabel(bucket)}
                          </span>
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--subtle)]">
                            {categoryLabel(opportunity.category)}
                          </span>
                        </span>
                        <span className="mt-1.5 block break-words text-[15px] font-semibold leading-6 text-[var(--foreground)]">
                          {opportunity.title}
                        </span>
                        <span className="mt-1.5 grid gap-x-6 gap-y-1 text-xs leading-5 text-[var(--muted)] sm:grid-cols-3">
                          <span>
                            <span className="font-semibold text-[var(--subtle)]">Source </span>
                            {opportunity.sourceName ?? "Unlinked submission"}
                          </span>
                          <span>
                            <span className="font-semibold text-[var(--subtle)]">Submitted </span>
                            {formatSubmitted(opportunity.createdAt)}
                          </span>
                          <span>
                            <span className="font-semibold text-[var(--subtle)]">Deadline </span>
                            {opportunity.deadline ? formatQueueDeadline(opportunity.deadline) : "Not found"}
                          </span>
                          {(() => {
                            const format = formatDiscoveryMethod(opportunity.discoveryMethod);
                            return format ? (
                              <span>
                                <span className="font-semibold text-[var(--subtle)]">Format </span>
                                {format}
                              </span>
                            ) : null;
                          })()}
                        </span>
                      </span>
                      <span className="inline-flex min-h-11 items-center justify-center rounded-md bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--primary-deep)] sm:w-auto">
                        Review →
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {hasMore ? (
              <Link
                href={`/moderation${query}${query ? "&" : "?"}page=${page + 1}`}
                className="mt-4 inline-flex h-9 items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
              >
                Load {Math.min(PAGE_SIZE, visible.length - displayLimit)} more ({visible.length - displayLimit} remaining)
              </Link>
            ) : null}
              </>
            )}
            <p className="mt-4 text-xs text-[var(--muted)]">
              {TRIAGE_HEURISTIC_NOTE} Furniture lists only exact reviewed
              site-furniture titles.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
