/**
 * Publishing Engine V2 — staff-only review workspace composition.
 *
 * Server-only composition layer (imported only by staff routes): it loads
 * the already-bounded staff reads (all pending + published), classifies each
 * active pending candidate with the deterministic readiness engine against
 * the FULL corpus (pending + published, so duplicates of live records are
 * surfaced with their WHY), and orders the queue by readiness priority.
 *
 * No new query shapes, no RLS change, no service-role, no status mutation —
 * the same authorization boundary (`getModerationAccess`) as the existing
 * queue. Reuses existing data only: pending rows, published rows, and the
 * pure classifiers in lib/review-readiness.ts. No speculative analytics.
 */

import type { Opportunity } from "../types";
import {
  countReviewQueue,
  orderReviewQueue,
  reviewReadinessOf,
  type ReviewReadiness,
  type ReviewReadinessCounts,
  type ReviewReadinessState,
} from "../review-readiness";
import {
  EMPTY_QUEUE_FILTER,
  filterPendingQueue,
  getModerationAccess,
  isActivePendingOpportunity,
  isValidOpportunityId,
  listAllPendingForReview,
  queueNavigationFromIds,
  type QueueFilter,
  type QueueNavigation,
} from "./moderation";
import {
  listManagedPublishedOpportunities,
  partitionPublishedByLifecycle,
} from "./published-management";

export interface ClassifiedQueueItem {
  opportunity: Opportunity;
  readiness: ReviewReadiness;
  state: ReviewReadinessState;
}

export interface ReviewWorkspaceQueue {
  /** Active pending candidates, classified + priority-ordered. */
  ordered: ClassifiedQueueItem[];
  /** Readiness lookup for filter predicates. */
  readinessById: Map<string, ReviewReadinessState>;
  counts: ReviewReadinessCounts;
  /** Active pending (oldest-first) — for consumers that keep queue order. */
  active: Opportunity[];
  /** Expired pending rows: stored, countable, excluded from review work. */
  expiredPending: Opportunity[];
  /** Published lifecycle split for staff-visible operational counts. */
  publishedActive: number;
  publishedExpired: number;
}

const EMPTY_COUNTS: ReviewReadinessCounts = {
  total: 0,
  ready: 0,
  needsEvidence: 0,
  possibleDuplicate: 0,
  sourceProblem: 0,
  deadlineUnclear: 0,
};

/**
 * One composed read for the moderation queue page: all pending (partitioned
 * into active review work vs expired) + the published set (lifecycle split
 * for counts) + deterministic classification of every active candidate
 * against the full corpus for duplicate signals. Staff-only.
 */
export async function getReviewWorkspaceQueue(
  now: Date = new Date()
): Promise<ReviewWorkspaceQueue> {
  const access = await getModerationAccess();
  if (!access.ok) {
    return {
      ordered: [],
      readinessById: new Map(),
      counts: EMPTY_COUNTS,
      active: [],
      expiredPending: [],
      publishedActive: 0,
      publishedExpired: 0,
    };
  }

  const [allPending, published] = await Promise.all([
    listAllPendingForReview(),
    listManagedPublishedOpportunities(),
  ]);

  const active = allPending.filter((opportunity) =>
    isActivePendingOpportunity(opportunity, now)
  );
  const expiredPending = allPending.filter(
    (opportunity) => !isActivePendingOpportunity(opportunity, now)
  );

  const corpus = [...allPending, ...published];
  const classified: ClassifiedQueueItem[] = active.map((opportunity) => {
    const readiness = reviewReadinessOf(opportunity, corpus, now);
    return { opportunity, readiness, state: readiness.state };
  });
  const ordered = orderReviewQueue(classified);
  const readinessById = new Map(ordered.map((item) => [item.opportunity.id, item.state]));
  const counts = countReviewQueue(ordered);

  const publishedSplit = partitionPublishedByLifecycle(published, now);

  return {
    ordered,
    readinessById,
    counts,
    active,
    expiredPending,
    publishedActive: publishedSplit.active.length,
    publishedExpired: publishedSplit.expired.length,
  };
}

/**
 * Next-in-queue navigation over the SAME priority-ordered, filter-aware list
 * the queue renders, so "review next" never leaves the moderator's batch.
 * Read-only, staff-only; a non-pending or unknown id yields position null.
 */
export async function getReviewQueueNavigation(
  currentId: string,
  filter: QueueFilter = EMPTY_QUEUE_FILTER,
  now: Date = new Date()
): Promise<QueueNavigation> {
  if (!isValidOpportunityId(currentId)) {
    return { position: null, total: 0, nextId: null };
  }
  const workspace = await getReviewWorkspaceQueue(now);
  const visible = filterPendingQueue(
    workspace.ordered.map((item) => item.opportunity),
    filter,
    workspace.readinessById
  );
  return queueNavigationFromIds(
    visible.map((o) => o.id),
    currentId
  );
}

export interface ReviewWorkspaceItem {
  opportunity: Opportunity;
  readiness: ReviewReadiness;
  /** Correlation id of the duplicate match, when the gate fails. */
  duplicate: ReviewReadiness["duplicate"];
  /** How many corpus rows were compared for duplicate signals. */
  corpusSize: number;
}

/**
 * One candidate + its readiness workspace for the review detail page:
 * duplicate signals computed against all other pending + published rows.
 * Returns null for unknown ids and non-pending rows (same scoping as the
 * existing pending fetch — expired rows stay reachable directly).
 */
export async function getReviewWorkspaceItem(
  id: string,
  now: Date = new Date()
): Promise<ReviewWorkspaceItem | null> {
  if (!isValidOpportunityId(id)) return null;
  const access = await getModerationAccess();
  if (!access.ok) return null;

  const [allPending, published] = await Promise.all([
    listAllPendingForReview(),
    listManagedPublishedOpportunities(),
  ]);
  const opportunity = allPending.find((row) => row.id === id) ?? null;
  if (!opportunity) return null;

  const corpus = [...allPending, ...published];
  const readiness = reviewReadinessOf(opportunity, corpus, now);
  return { opportunity, readiness, duplicate: readiness.duplicate, corpusSize: corpus.length - 1 };
}
