import type { Opportunity } from "./types";

/**
 * Offline cache contract (durable, privacy-first).
 *
 * - Public opportunity cache is bounded (latest/relevant 50–100) and
 *   visibly stale-aware. Cached information must never pretend to be
 *   freshly verified.
 * - Private Saved/Activity snapshots and the mutation queue are
 *   account-scoped (`:<userId>` suffix). Public cache has no user id.
 * - Raw Ask AI chat is never persisted here or anywhere else.
 * - The service worker stays static-only (see public/sw.js); this module
 *   is the localStorage client cache, not an HTTP cache.
 */

export const OFFLINE_MAX_OPPORTUNITIES = 100;
export const OFFLINE_MAX_RECENT = 20;
export const OFFLINE_MAX_QUEUE = 100;

export const OFFLINE_PUBLIC_KEY = "techopportunity:offline:opportunities:v1";
export const OFFLINE_RECENT_KEY = "techopportunity:offline:recent:v1";
export const OFFLINE_OWNER_KEY = "techopportunity:offline:owner:v1";

const SAVED_PREFIX = "techopportunity:offline:saved:v1:";
const ACTIVITY_PREFIX = "techopportunity:offline:activity:v1:";
const QUEUE_PREFIX = "techopportunity:offline:queue:v1:";

export interface CachedPublicSnapshot {
  opportunities: Opportunity[];
  fetchedAt: string;
}

export interface RecentEntry {
  opportunity: Opportunity;
  viewedAt: string;
}

export type OfflineMutationType =
  | "save"
  | "unsave"
  | "interested"
  | "applying"
  | "applied"
  | "remove-activity";

export interface OfflineMutation {
  id: string;
  type: OfflineMutationType;
  opportunityId: string;
  queuedAt: string;
}

export interface SavedSnapshotEntry {
  opportunityId: string;
  savedAt: string;
  opportunity: Opportunity | null;
}

export interface ActivitySnapshotEntry {
  opportunityId: string;
  status: "interested" | "applying" | "applied";
  updatedAt: string;
  opportunity: Opportunity | null;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isOfflineOpportunityId(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function savedKeyFor(userId: string): string {
  return `${SAVED_PREFIX}${userId}`;
}

export function activityKeyFor(userId: string): string {
  return `${ACTIVITY_PREFIX}${userId}`;
}

export function queueKeyFor(userId: string): string {
  return `${QUEUE_PREFIX}${userId}`;
}

export function isPrivateOfflineKey(key: string): boolean {
  return (
    key.startsWith(SAVED_PREFIX) ||
    key.startsWith(ACTIVITY_PREFIX) ||
    key.startsWith(QUEUE_PREFIX)
  );
}

/** Bounded public cache: keep the first N (callers pass already-ordered lists). */
export function boundOpportunities(
  list: Opportunity[],
  limit: number = OFFLINE_MAX_OPPORTUNITIES
): Opportunity[] {
  const safe = Math.max(1, Math.min(limit, OFFLINE_MAX_OPPORTUNITIES));
  return list.slice(0, safe);
}

export function boundRecent(list: RecentEntry[]): RecentEntry[] {
  return list.slice(0, OFFLINE_MAX_RECENT);
}

export function parsePublicSnapshot(raw: string | null): CachedPublicSnapshot | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CachedPublicSnapshot>;
    if (!Array.isArray(parsed.opportunities)) return null;
    if (typeof parsed.fetchedAt !== "string") return null;
    if (!Number.isFinite(Date.parse(parsed.fetchedAt))) return null;
    const opportunities = (parsed.opportunities as Opportunity[])
      .filter((o) => o && typeof o.slug === "string" && typeof o.title === "string")
      .slice(0, OFFLINE_MAX_OPPORTUNITIES);
    return { opportunities, fetchedAt: parsed.fetchedAt };
  } catch {
    return null;
  }
}

export function parseRecentList(raw: string | null): RecentEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as RecentEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (e) =>
          e &&
          e.opportunity &&
          typeof e.opportunity.slug === "string" &&
          typeof e.viewedAt === "string" &&
          Number.isFinite(Date.parse(e.viewedAt))
      )
      .slice(0, OFFLINE_MAX_RECENT);
  } catch {
    return [];
  }
}

export function parseMutationQueue(raw: string | null): OfflineMutation[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as OfflineMutation[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (m) =>
          m &&
          typeof m.id === "string" &&
          (m.type === "save" ||
            m.type === "unsave" ||
            m.type === "interested" ||
            m.type === "applying" ||
            m.type === "applied" ||
            m.type === "remove-activity") &&
          isOfflineOpportunityId(m.opportunityId) &&
          typeof m.queuedAt === "string"
      )
      .slice(0, OFFLINE_MAX_QUEUE);
  } catch {
    return [];
  }
}

/**
 * Queue a mutation exactly once: an existing queued op for the same
 * opportunity + effective intent is replaced, never duplicated.
 * Save/unsave collapse to the latest intent; activity collapses to the
 * latest funnel intent (including remove-activity).
 */
export function queueMutationOnce(
  queue: OfflineMutation[],
  mutation: Omit<OfflineMutation, "id" | "queuedAt"> & {
    id?: string;
    queuedAt?: string;
  }
): OfflineMutation[] {
  const now = mutation.queuedAt ?? new Date().toISOString();
  const id =
    mutation.id ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.floor(Math.random() * 1e9)}`);
  const entry: OfflineMutation = {
    id,
    type: mutation.type,
    opportunityId: mutation.opportunityId,
    queuedAt: now,
  };
  const collapses = (existing: OfflineMutation): boolean => {
    if (existing.opportunityId !== entry.opportunityId) return false;
    const existingIsSave = existing.type === "save" || existing.type === "unsave";
    const nextIsSave = entry.type === "save" || entry.type === "unsave";
    if (existingIsSave && nextIsSave) return true;
    const existingIsActivity =
      existing.type === "interested" ||
      existing.type === "applying" ||
      existing.type === "applied" ||
      existing.type === "remove-activity";
    const nextIsActivity =
      entry.type === "interested" ||
      entry.type === "applying" ||
      entry.type === "applied" ||
      entry.type === "remove-activity";
    return existingIsActivity && nextIsActivity;
  };
  const deduped = queue.filter((m) => !collapses(m));
  return [...deduped, entry].slice(-OFFLINE_MAX_QUEUE);
}

export function removeQueuedMutations(
  queue: OfflineMutation[],
  ids: string[]
): OfflineMutation[] {
  if (ids.length === 0) return queue;
  const gone = new Set(ids);
  return queue.filter((m) => !gone.has(m.id));
}

export interface CachedFilter {
  q?: string | null;
  category?: string | null;
}

/**
 * Local search/filter over the bounded cached corpus. Deliberately simple:
 * title + description + organization substring match (case-insensitive),
 * exact category match. Never claims server-side ranking.
 */
export function filterCachedOpportunities(
  corpus: Opportunity[],
  filter: CachedFilter = {}
): Opportunity[] {
  const q = (filter.q ?? "").trim().toLowerCase();
  const category = (filter.category ?? "").trim();
  return corpus.filter((o) => {
    if (category && o.category !== category) return false;
    if (!q) return true;
    const hay = `${o.title} ${o.description} ${o.organization ?? ""}`
      .toLowerCase();
    return q.split(/\s+/).every((term) => hay.includes(term));
  });
}

export function formatLastSync(fetchedAt: string | null): string | null {
  if (!fetchedAt) return null;
  const time = Date.parse(fetchedAt);
  if (!Number.isFinite(time)) return null;
  try {
    return new Intl.DateTimeFormat("en-TZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "Africa/Dar_es_Salaam",
    }).format(new Date(time));
  } catch {
    return null;
  }
}

/**
 * Keys that belong to a different account than the current one. Used by the
 * account-scope sweeper so switching accounts never exposes the previous
 * user's Saved/Activity/queue. Public + recent keys are shared-device safe
 * (public corpus only) and are never swept here.
 */
export function foreignPrivateKeys(
  allKeys: string[],
  currentUserId: string | null
): string[] {
  return allKeys.filter((key) => {
    if (!isPrivateOfflineKey(key)) return false;
    if (!currentUserId) return true;
    return (
      key !== savedKeyFor(currentUserId) &&
      key !== activityKeyFor(currentUserId) &&
      key !== queueKeyFor(currentUserId)
    );
  });
}
