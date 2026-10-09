"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { OfflineExplore } from "@/components/offline-explore";
import { OpportunityRun } from "@/components/opportunity-run";
import {
  OFFLINE_OWNER_KEY,
  OFFLINE_PUBLIC_KEY,
  OFFLINE_RECENT_KEY,
  activityKeyFor,
  formatLastSync,
  parsePublicSnapshot,
  parseRecentList,
  type ActivitySnapshotEntry,
  type SavedSnapshotEntry,
} from "@/lib/offline-cache";
import { opportunityHref } from "@/lib/opportunity-presentation";

interface OfflineSnapshot {
  fetchedAt: string | null;
  recent: ReturnType<typeof parseRecentList>;
  savedCount: number | null;
  savedPreview: SavedSnapshotEntry[];
  activityPreview: ActivitySnapshotEntry[];
}

function readSnapshot(): OfflineSnapshot {
  const empty: OfflineSnapshot = {
    fetchedAt: null,
    recent: [],
    savedCount: null,
    savedPreview: [],
    activityPreview: [],
  };
  try {
    const snapshot = parsePublicSnapshot(
      window.localStorage.getItem(OFFLINE_PUBLIC_KEY)
    );
    empty.fetchedAt = snapshot?.fetchedAt ?? null;
    const recents = parseRecentList(
      window.localStorage.getItem(OFFLINE_RECENT_KEY)
    );
    empty.recent = recents.slice(0, 5);
    const owner = window.localStorage.getItem(OFFLINE_OWNER_KEY);
    if (owner) {
      try {
        const savedRaw = window.localStorage.getItem(
          `techopportunity:offline:saved:v1:${owner}`
        );
        const activityRaw = window.localStorage.getItem(activityKeyFor(owner));
        const saved = savedRaw
          ? (JSON.parse(savedRaw) as SavedSnapshotEntry[])
          : [];
        const activity = activityRaw
          ? (JSON.parse(activityRaw) as ActivitySnapshotEntry[])
          : [];
        empty.savedCount = Array.isArray(saved) ? saved.length : null;
        empty.savedPreview = Array.isArray(saved) ? saved.slice(0, 5) : [];
        empty.activityPreview = Array.isArray(activity)
          ? activity.slice(0, 5)
          : [];
      } catch {
        empty.savedCount = null;
      }
    }
    return empty;
  } catch {
    return empty;
  }
}

/**
 * Useful offline page (client): clear offline state, stale honesty, last
 * sync, cached browse, recently viewed, cached saved, reconnect status.
 * Civic Hybrid, mobile-first (360–430px safe, no horizontal overflow).
 */
export function OfflinePageClient() {
  // Lazy initial read: mount-time evaluation never cascades renders.
  const [snapshot] = useState(readSnapshot);
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onStorage = () => setTick((t) => t + 1);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Re-read on cross-tab updates without setting state inside the effect body.
  const current = tick === 0 ? snapshot : readSnapshot();
  const { fetchedAt, recent, savedCount, savedPreview, activityPreview } =
    current;
  const recentCount = recent.length;
  const lastSync = formatLastSync(fetchedAt);

  return (
    <div className="min-w-0 space-y-5">
      <section
        aria-labelledby="offline-state-heading"
        className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--warning)]">
          {online ? "Back online" : "You’re offline"}
        </p>
        <h2 id="offline-state-heading" className="mt-2 text-xl font-semibold">
          {online
            ? "Connection restored — refresh for fresh information."
            : "Cached information may be older."}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          Opportunity deadlines, eligibility and sources may have changed
          since the last sync. Cached listings are never presented as
          current — reconnect and reopen any opportunity before acting on
          it. Unknown stays unknown.
        </p>
        <p role="status" className="mt-3 text-sm font-semibold">
          {lastSync
            ? `Last successful update: ${lastSync} (Africa/Dar_es_Salaam).`
            : "No cached update yet — visit Explore while online first."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/#opportunities" className="button-primary">
            {online ? "Refresh Explore" : "Try Explore again"}
          </Link>
          <Link href="/saved" className="button-secondary">
            Saved list
          </Link>
        </div>
        <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
          Status: {online ? "online" : "offline"}
          {recentCount > 0 ? ` · ${recentCount} recently viewed cached` : ""}
          {savedCount !== null ? ` · ${savedCount} cached saved` : ""}.
        </p>
      </section>

      <OfflineExplore />

      {savedCount !== null || activityPreview.length > 0 ? (
        <section
          aria-labelledby="offline-private-heading"
          className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
        >
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--warning)]">
            Cached · private to this account · may be outdated
          </p>
          <h2 id="offline-private-heading" className="mt-2 text-xl font-semibold">
            Your cached Saved &amp; Activity
          </h2>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            Read-only offline preview. Queued changes sync on reconnect;
            server truth wins. Switching accounts never shows another
            user’s items.
          </p>
          {savedPreview.length > 0 ? (
            <div className="mt-3">
              <h3 className="text-sm font-semibold">Saved (cached)</h3>
              <ul className="mt-2 space-y-2">
                {savedPreview.map((entry) => (
                  <li
                    key={entry.opportunityId}
                    className="rounded-md border border-[var(--line)] px-4 py-2 text-sm"
                  >
                    <span className="font-semibold">
                      {entry.opportunity?.title ?? "Saved opportunity"}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">
                      Cached · not rechecked offline
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {activityPreview.length > 0 ? (
            <div className="mt-3">
              <h3 className="text-sm font-semibold">Activity (cached)</h3>
              <ul className="mt-2 space-y-2">
                {activityPreview.map((entry) => (
                  <li
                    key={entry.opportunityId}
                    className="rounded-md border border-[var(--line)] px-4 py-2 text-sm"
                  >
                    <span className="font-semibold">
                      {entry.opportunity?.title ?? "Tracked opportunity"}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--muted)]">
                      {entry.status} · cached · never a submitted application
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {savedPreview.length === 0 && activityPreview.length === 0 ? (
            <p role="status" className="mt-3 text-sm text-[var(--muted)]">
              No cached Saved or Activity for this account yet. Visit Saved
              and Activity while online first.
            </p>
          ) : null}
        </section>
      ) : null}

      <section
        aria-labelledby="offline-recent-heading"
        className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
      >
        <h2 id="offline-recent-heading" className="text-xl font-semibold">
          Recently viewed (cached)
        </h2>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
          Open a cached detail from your recent visits. Details show their
          cached state and last-refresh time — reverify on reconnect.
        </p>
        {recent.length === 0 ? (
          <p role="status" className="mt-3 text-sm text-[var(--muted)]">
            Nothing viewed yet. Open opportunities while online and they’ll
            appear here.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recent.map((entry) => (
              <li
                key={entry.opportunity.slug}
                className="rounded-md border border-[var(--line)] px-4 py-3"
              >
                <details>
                  <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-semibold">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">
                        {entry.opportunity.title}
                      </span>
                      <span className="mt-0.5 block text-xs font-medium text-[var(--muted)]">
                        Cached · not rechecked offline — tap to open cached detail
                      </span>
                    </span>
                    <span aria-hidden="true" className="shrink-0 text-[var(--muted)]">+</span>
                  </summary>
                  <div className="mt-3 border-t border-[var(--line)] pt-3 text-sm leading-6">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--warning)]">
                      Cached detail · may be outdated
                    </p>
                    <p className="mt-2 text-[var(--muted)]">
                      {entry.opportunity.organization?.trim() || "Organizer unknown"}
                    </p>
                    <p className="mt-2 line-clamp-6 whitespace-pre-line text-[var(--muted)]">
                      {entry.opportunity.description.slice(0, 600)}
                    </p>
                    <p className="mt-2 text-xs text-[var(--muted)]">
                      Deadline, eligibility and source need reverification on
                      reconnect. Unknown stays unknown.
                    </p>
                    <Link
                      href={opportunityHref(entry.opportunity.slug, "/offline")}
                      className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent-strong)] underline-offset-2 hover:underline"
                    >
                      Try live detail on reconnect →
                    </Link>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>

      <OpportunityRun />
    </div>
  );
}
