"use client";

import { useCallback, useEffect, useState } from "react";
import {
  parseMutationQueue,
  queueKeyFor,
  queueMutationOnce,
  removeQueuedMutations,
  type OfflineMutation,
} from "@/lib/offline-cache";

/**
 * Reconnect sync for the offline mutation queue. Idempotent: the server
 * route applies save (insert-if-missing), unsave (delete-if-present) and
 * activity upsert/delete, so replaying a queue cannot duplicate rows.
 * Server truth wins; failures stay queued for the next reconnect.
 */
export function OfflineQueueSync({ userId }: { userId: string | null }) {
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const readQueue = useCallback((): OfflineMutation[] => {
    if (!userId) return [];
    try {
      return parseMutationQueue(
        window.localStorage.getItem(queueKeyFor(userId))
      );
    } catch {
      return [];
    }
  }, [userId]);

  const sync = useCallback(async () => {
    if (!userId || syncing) return;
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    const queue = readQueue();
    if (queue.length === 0) {
      setPending(0);
      return;
    }
    setSyncing(true);
    setNotice(null);
    try {
      const response = await fetch("/api/offline-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ops: queue }),
      });
      const payload = (await response.json().catch(() => null)) as {
        applied?: string[];
        error?: string;
      } | null;
      if (!response.ok || !payload || !Array.isArray(payload.applied)) {
        setNotice("Sync paused — your queued changes are kept for the next reconnect.");
        setPending(queue.length);
        return;
      }
      const remaining = removeQueuedMutations(queue, payload.applied);
      try {
        window.localStorage.setItem(
          queueKeyFor(userId),
          JSON.stringify(remaining)
        );
      } catch {
        // Keep going: server already applied the ops.
      }
      setPending(remaining.length);
      setNotice(
        remaining.length === 0
          ? "Queued changes synced."
          : `${payload.applied.length} synced, ${remaining.length} still queued.`
      );
    } catch {
      setNotice("Sync paused — your queued changes are kept for the next reconnect.");
      setPending(readQueue().length);
    } finally {
      setSyncing(false);
    }
  }, [userId, syncing, readQueue]);

  useEffect(() => {
    // Deferred (not synchronous) so mount-time evaluation never cascades renders.
    const timer = setTimeout(() => {
      setPending(readQueue().length);
    }, 0);
    const onOnline = () => {
      void sync();
    };
    const onStorage = () => setPending(readQueue().length);
    window.addEventListener("online", onOnline);
    window.addEventListener("storage", onStorage);
    // Opportunistic first attempt when mounted online — deferred so the
    // effect body itself never triggers a synchronous render cascade.
    const boot =
      typeof navigator === "undefined" || navigator.onLine
        ? setTimeout(() => {
            void sync();
          }, 0)
        : null;
    return () => {
      clearTimeout(timer);
      if (boot) clearTimeout(boot);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!userId || (pending === 0 && !notice)) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto w-full max-w-6xl px-5 sm:px-8"
    >
      <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-xs leading-5">
        <span className="font-semibold">
          {syncing
            ? "Syncing queued changes…"
            : pending > 0
              ? `${pending} offline ${pending === 1 ? "change" : "changes"} waiting to sync`
              : notice ?? "Queued changes synced."}
        </span>
        {!syncing && notice && pending !== 0 ? (
          <span className="text-[var(--muted)]">{notice}</span>
        ) : null}
        {!syncing && notice && pending === 0 ? (
          <span className="text-[var(--verified)]">{notice}</span>
        ) : null}
        {!syncing && pending > 0 ? (
          <button
            type="button"
            onClick={() => void sync()}
            className="inline-flex min-h-11 items-center rounded-md border border-[var(--line-strong)] px-3 font-semibold hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
          >
            Sync now
          </button>
        ) : null}
      </div>
    </div>
  );
}

/** Queue one offline mutation for the signed-in user (deduped, bounded). */
export function queueOfflineMutation(
  userId: string,
  mutation: { type: OfflineMutation["type"]; opportunityId: string }
): number {
  try {
    const key = queueKeyFor(userId);
    const current = parseMutationQueue(window.localStorage.getItem(key));
    const next = queueMutationOnce(current, mutation);
    window.localStorage.setItem(key, JSON.stringify(next));
    return next.length;
  } catch {
    return 0;
  }
}
