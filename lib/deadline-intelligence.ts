/**
 * One deterministic deadline model for public presentation and private alerts.
 *
 * Fourteen days preserves the product's existing "closing soon" behavior while
 * keeping the policy explicit and easy to revise in one place. No publication
 * date, cohort label, or other weak signal is ever used as a substitute.
 */
export const CLOSING_SOON_DAYS = 14;
export const CLOSING_SOON_MS = CLOSING_SOON_DAYS * 24 * 60 * 60 * 1000;

export type DeadlinePrecision =
  | "unknown"
  | "date"
  | "date_time"
  | "rolling"
  | "unspecified";

export type DeadlineStatus =
  | "unknown"
  | "invalid"
  | "rolling"
  | "upcoming"
  | "closing_soon"
  | "closed";

export interface DeadlineInput {
  deadline: string | null;
  precision?: DeadlinePrecision;
  timezone?: string | null;
}

export interface DeadlineEvaluation {
  status: DeadlineStatus;
  /** Comparison boundary only. It is never written back as invented evidence. */
  effectiveAt: string | null;
  remainingDays: number | null;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
const ZONED_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/i;

function validUtcDate(year: number, month: number, day: number): boolean {
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

/**
 * A date-only fact closes at the end of that UTC calendar date, matching the
 * repository's established UTC normalization without pretending the source
 * supplied a clock time. Zoned instants retain their own explicit offset.
 * Unzoned date-times are invalid rather than silently assigned EAT or UTC.
 */
export function deadlineEffectiveTimestamp(input: DeadlineInput): number | null {
  const precision = input.precision ?? "unspecified";
  if (precision === "rolling" || precision === "unknown" || input.deadline === null) {
    return null;
  }

  const dateOnly = DATE_ONLY.exec(input.deadline);
  if (dateOnly) {
    const [, yearText, monthText, dayText] = dateOnly;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);
    if (!validUtcDate(year, month, day)) return null;
    return Date.UTC(year, month - 1, day + 1);
  }

  if (precision === "date") {
    const datePrefix = input.deadline.slice(0, 10);
    const match = DATE_ONLY.exec(datePrefix);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!validUtcDate(year, month, day)) return null;
    return Date.UTC(year, month - 1, day + 1);
  }

  if (!ZONED_DATE_TIME.test(input.deadline)) return null;
  const timestamp = Date.parse(input.deadline);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function evaluateDeadline(
  input: DeadlineInput,
  now: Date = new Date()
): DeadlineEvaluation {
  const precision = input.precision ?? "unspecified";
  if (precision === "rolling") {
    return input.deadline === null
      ? { status: "rolling", effectiveAt: null, remainingDays: null }
      : { status: "invalid", effectiveAt: null, remainingDays: null };
  }
  if (input.deadline === null) {
    return { status: "unknown", effectiveAt: null, remainingDays: null };
  }
  if (precision === "unknown") {
    return { status: "invalid", effectiveAt: null, remainingDays: null };
  }

  const effectiveTimestamp = deadlineEffectiveTimestamp(input);
  if (effectiveTimestamp === null || !Number.isFinite(now.getTime())) {
    return { status: "invalid", effectiveAt: null, remainingDays: null };
  }
  if (effectiveTimestamp <= now.getTime()) {
    return {
      status: "closed",
      effectiveAt: new Date(effectiveTimestamp).toISOString(),
      remainingDays: 0,
    };
  }

  const remaining = effectiveTimestamp - now.getTime();
  return {
    status: remaining <= CLOSING_SOON_MS ? "closing_soon" : "upcoming",
    effectiveAt: new Date(effectiveTimestamp).toISOString(),
    remainingDays: Math.max(1, Math.ceil(remaining / (24 * 60 * 60 * 1000))),
  };
}

export type DeadlineTransition =
  | "unchanged"
  | "became_known"
  | "became_unknown"
  | "became_rolling"
  | "extended"
  | "shortened"
  | "changed";

function canonicalDeadline(input: DeadlineInput): string {
  const precision = input.precision ?? "unspecified";
  return [precision, input.deadline ?? "", input.timezone ?? ""].join("|");
}

function isDated(status: DeadlineStatus): boolean {
  return status === "upcoming" || status === "closing_soon" || status === "closed";
}

export function classifyDeadlineTransition(
  previous: DeadlineInput,
  next: DeadlineInput
): DeadlineTransition {
  if (canonicalDeadline(previous) === canonicalDeadline(next)) return "unchanged";

  const before = evaluateDeadline(previous, new Date(0));
  const after = evaluateDeadline(next, new Date(0));
  const beforeDated = isDated(before.status);
  const afterDated = isDated(after.status);

  if (!beforeDated && afterDated) return "became_known";
  if (beforeDated && after.status === "rolling") return "became_rolling";
  if (beforeDated && !afterDated) return "became_unknown";
  if (!beforeDated || !afterDated) return "changed";

  const beforeTime = deadlineEffectiveTimestamp(previous);
  const afterTime = deadlineEffectiveTimestamp(next);
  if (beforeTime === null || afterTime === null) return "changed";
  if (afterTime > beforeTime) return "extended";
  if (afterTime < beforeTime) return "shortened";
  return "changed";
}
