"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  OFFLINE_PUBLIC_KEY,
  filterCachedOpportunities,
  formatLastSync,
  parsePublicSnapshot,
} from "@/lib/offline-cache";
import type { Opportunity } from "@/lib/types";
import { opportunityHref } from "@/lib/opportunity-presentation";

function readCachedCorpus(): { list: Opportunity[]; fetchedAt: string | null } {
  try {
    const snapshot = parsePublicSnapshot(
      window.localStorage.getItem(OFFLINE_PUBLIC_KEY)
    );
    return {
      list: snapshot?.opportunities ?? [],
      fetchedAt: snapshot?.fetchedAt ?? null,
    };
  } catch {
    return { list: [], fetchedAt: null };
  }
}

/**
 * Offline Explore: local search/filter over the bounded cached corpus.
 * Every render carries a visible cached-state warning — cached cards never
 * pretend to be freshly verified.
 */
export function OfflineExplore() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  // Lazy initial read: mount-time evaluation never cascades renders.
  const [corpus] = useState(readCachedCorpus);
  const [storageTick, setStorageTick] = useState(0);

  useEffect(() => {
    const onStorage = () => setStorageTick((t) => t + 1);
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const { list, fetchedAt } = useMemo(() => {
    // Re-read on cross-tab storage updates; otherwise use the mount snapshot.
    void storageTick;
    return typeof window === "undefined" ? corpus : readCachedCorpus();
  }, [corpus, storageTick]);

  const results = useMemo(
    () => filterCachedOpportunities(list, { q, category: category || null }),
    [list, q, category]
  );

  const lastSync = formatLastSync(fetchedAt);
  const total = list.length;
  const categories = ["hackathon", "competition", "scholarship", "conference", "workshop", "internship", "fellowship", "grant", "tech-event", "jobs", "accelerator", "research-call", "public-challenge", "admissions", "other"];

  return (
    <section
      aria-labelledby="offline-explore-heading"
      className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
    >
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--warning)]">
        Cached · may be outdated
      </p>
      <h2 id="offline-explore-heading" className="mt-2 text-xl font-semibold">
        Browse cached opportunities
      </h2>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
        {total > 0
          ? `${results.length} of ${total} cached ${total === 1 ? "opportunity" : "opportunities"}${lastSync ? ` · last updated ${lastSync}` : ""}. Deadlines, eligibility and sources may have changed — reconnect to reverify.`
          : "No cached opportunities yet. Visit Explore while online to save a recent set for offline use."}
      </p>

      {total > 0 ? (
        <form
          role="search"
          aria-label="Search cached opportunities"
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => e.preventDefault()}
        >
          <label htmlFor="offline-q" className="sr-only">
            Search cached opportunities
          </label>
          <input
            id="offline-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            maxLength={120}
            placeholder="Search cached titles…"
            className="auth-input mt-0 min-h-11 flex-1"
          />
          <label htmlFor="offline-category" className="sr-only">
            Filter cached by category
          </label>
          <select
            id="offline-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="auth-input mt-0 min-h-11 sm:max-w-56"
          >
            <option value="">All types</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </form>
      ) : null}

      {total > 0 && results.length === 0 ? (
        <p role="status" className="mt-4 text-sm text-[var(--muted)]">
          No cached opportunities match. Clear the search or reconnect for the
          full list.
        </p>
      ) : null}

      <ul className="mt-4 space-y-3">
        {results.slice(0, 30).map((o) => (
          <li
            key={o.id}
            className="rounded-md border border-[var(--line)] p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
              {o.category} · cached
            </p>
            <Link
              href={opportunityHref(o.slug, "/offline")}
              className="mt-1 block min-h-11 text-sm font-semibold leading-6 text-[var(--foreground)] underline-offset-2 hover:text-[var(--accent-strong)] hover:underline"
            >
              {o.title}
            </Link>
            <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
              {o.organization?.trim() || "Organization unknown"} · deadline
              and eligibility not rechecked offline
            </p>
          </li>
        ))}
      </ul>
      {results.length > 30 ? (
        <p className="mt-3 text-xs text-[var(--muted)]">
          Showing 30 of {results.length} cached matches.
        </p>
      ) : null}
    </section>
  );
}
