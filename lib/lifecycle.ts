/**
 * Opportunity lifecycle — DERIVED state, never stored, never fabricated.
 *
 * The database stores evidence (discovered_at, deadline, status); freshness
 * is a function of evidence + the current instant, so it is derived here
 * instead of being persisted. A stored flag can drift out of sync with the
 * deadline it describes; a derivation cannot.
 *
 * Semantics — four DISTINCT states. The critical rule: absence of evidence
 * is not evidence. A missing or invalid deadline proves nothing about
 * whether the opportunity is rolling, so it derives "unknown" — never
 * "rolling". "Rolling" is reserved for opportunities EXPLICITLY known to
 * accept applications continuously; until a schema field records that
 * explicit fact (designed in migrations 0007+), nothing in the current
 * data can legitimately derive "rolling", and this function will never
 * claim it on the record's behalf.
 *
 * - deadline explicit future  → "active"   actionable right now
 * - deadline explicit past    → "expired"  closing date passed; the record
 *                                          is NOT deleted or unpublished —
 *                                          display/sweep policy is an
 *                                          owner-gated decision
 * - explicitly rolling        → "rolling"  only from explicit evidence
 *                                          (future schema field); never
 *                                          inferred from null/malformed
 * - deadline missing/invalid  → "unknown"  honest absence of knowledge
 *
 * Status (pending/published/rejected/expired enum) remains the moderation
 * dimension; lifecycle answers "is the deadline evidence still open?".
 * The two are composed, never conflated.
 */

export type OpportunityLifecycle = "active" | "expired" | "rolling" | "unknown";

export function deriveLifecycleState(
  deadline: string | null,
  now: Date = new Date()
): OpportunityLifecycle {
  if (deadline === null) return "unknown";
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return "unknown";
  return parsed.getTime() > now.getTime() ? "active" : "expired";
}

/**
 * True when public discovery should keep prioritizing this record.
 * Unknown deadlines stay visible: absence of a deadline is not proof the
 * opportunity closed, so it must not be hidden as if it had expired.
 */
export function isActionableNow(
  deadline: string | null,
  now: Date = new Date()
): boolean {
  return deriveLifecycleState(deadline, now) !== "expired";
}
