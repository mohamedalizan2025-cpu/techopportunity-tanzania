"use client";

import { useEffect } from "react";
import type { Opportunity } from "@/lib/types";
import {
  OFFLINE_MAX_OPPORTUNITIES,
  OFFLINE_OWNER_KEY,
  OFFLINE_PUBLIC_KEY,
  OFFLINE_RECENT_KEY,
  activityKeyFor,
  boundRecent,
  foreignPrivateKeys,
  isPrivateOfflineKey,
  parseRecentList,
  queueKeyFor,
  savedKeyFor,
  type ActivitySnapshotEntry,
  type RecentEntry,
  type SavedSnapshotEntry,
} from "@/lib/offline-cache";

function safeSet(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Private mode / quota: offline cache is best-effort only.
  }
}

/** After a successful online visit, seed the bounded public cache (≤100). */
export function OfflineCacheSeed({
  opportunities,
  fetchedAt,
}: {
  opportunities: Opportunity[];
  fetchedAt: string;
}) {
  useEffect(() => {
    try {
      const bounded = opportunities.slice(0, OFFLINE_MAX_OPPORTUNITIES);
      safeSet(
        OFFLINE_PUBLIC_KEY,
        JSON.stringify({ opportunities: bounded, fetchedAt })
      );
    } catch {
      // Never break the online render for an offline-cache write.
    }
  }, [opportunities, fetchedAt]);
  return null;
}

/** Record a recently viewed opportunity detail (bounded, public-only). */
export function OfflineRecentRecorder({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(OFFLINE_RECENT_KEY);
      const existing = parseRecentList(raw);
      const viewedAt = new Date().toISOString();
      const next: RecentEntry[] = boundRecent([
        { opportunity, viewedAt },
        ...existing.filter((e) => e.opportunity.slug !== opportunity.slug),
      ]);
      safeSet(OFFLINE_RECENT_KEY, JSON.stringify(next));
    } catch {
      // Best-effort only.
    }
  }, [opportunity]);
  return null;
}

/** Snapshot the signed-in user's Saved list for offline reading (per-user). */
export function OfflineSavedSeed({
  userId,
  entries,
}: {
  userId: string;
  entries: SavedSnapshotEntry[];
}) {
  useEffect(() => {
    safeSet(savedKeyFor(userId), JSON.stringify(entries.slice(0, 200)));
    safeSet(OFFLINE_OWNER_KEY, userId);
  }, [userId, entries]);
  return null;
}

/** Snapshot the signed-in user's Activity list for offline reading (per-user). */
export function OfflineActivitySeed({
  userId,
  entries,
}: {
  userId: string;
  entries: ActivitySnapshotEntry[];
}) {
  useEffect(() => {
    safeSet(activityKeyFor(userId), JSON.stringify(entries.slice(0, 200)));
    safeSet(OFFLINE_OWNER_KEY, userId);
  }, [userId, entries]);
  return null;
}

/**
 * Account isolation: on authenticated pages, drop any private offline keys
 * that belong to a different account so switching accounts never exposes
 * the previous user's Saved/Activity/queue. Public cache is untouched.
 */
export function OfflineAccountScope({ userId }: { userId: string }) {
  useEffect(() => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i += 1) {
        const key = window.localStorage.key(i);
        if (key && isPrivateOfflineKey(key)) keys.push(key);
      }
      for (const foreign of foreignPrivateKeys(keys, userId)) {
        window.localStorage.removeItem(foreign);
      }
      safeSet(OFFLINE_OWNER_KEY, userId);
    } catch {
      // Best-effort only.
    }
  }, [userId]);
  return null;
}

/** Clear this account's private offline data (used by the sign-out button). */
export function clearPrivateOfflineCacheFor(userId: string): void {
  try {
    window.localStorage.removeItem(savedKeyFor(userId));
    window.localStorage.removeItem(activityKeyFor(userId));
    window.localStorage.removeItem(queueKeyFor(userId));
  } catch {
    // Best-effort only.
  }
}

/** Clear every account-scoped offline key on this device (logout safety). */
export function clearAllPrivateOfflineCache(): void {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key && (isPrivateOfflineKey(key) || key === OFFLINE_OWNER_KEY)) {
        doomed.push(key);
      }
    }
    for (const key of doomed) window.localStorage.removeItem(key);
  } catch {
    // Best-effort only.
  }
}
