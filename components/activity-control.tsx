"use client";

import { useActionState } from "react";
import { changeTalentActivityAction } from "@/lib/data/talent-activity-actions";
import {
  ACTIVITY_STATUSES,
  ACTIVITY_STATUS_LABELS,
  initialActivityMutationState,
  type ActivityStatus,
} from "@/lib/talent-activity-state";

export function ActivityControl({
  opportunityId,
  opportunityTitle,
  currentStatus,
  isAuthenticated,
  returnTo,
}: {
  opportunityId: string;
  opportunityTitle: string;
  currentStatus: ActivityStatus | null;
  isAuthenticated: boolean;
  returnTo: string;
}) {
  const [state, formAction, isPending] = useActionState(
    changeTalentActivityAction,
    initialActivityMutationState
  );
  const status = state.activity ?? currentStatus;

  if (!isAuthenticated) {
    return (
      <a
        href={`/login?next=${encodeURIComponent(returnTo)}`}
        aria-label={`Sign in to track ${opportunityTitle}`}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        Sign in to track progress
      </a>
    );
  }

  return (
    <div className="relative z-10">
      <form action={formAction}>
        <input type="hidden" name="opportunityId" value={opportunityId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <label
          htmlFor={`activity-status-${opportunityId}`}
          className="text-xs font-semibold text-[var(--muted)]"
        >
          Application progress
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            id={`activity-status-${opportunityId}`}
            name="intent"
            defaultValue={status ?? ""}
            disabled={isPending}
            aria-label={`Track application progress for ${opportunityTitle}`}
            className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="" disabled>
              {status ? ACTIVITY_STATUS_LABELS[status] : "Not tracking"}
            </option>
            {ACTIVITY_STATUSES.map((option) => (
              <option key={option} value={option}>
                {ACTIVITY_STATUS_LABELS[option]}
              </option>
            ))}
            {status ? <option value="remove">Remove tracking</option> : null}
          </select>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Working…" : "Save progress"}
          </button>
        </div>
      </form>
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`mt-2 max-w-xs text-xs leading-5 ${
            state.status === "error"
              ? "text-red-700 dark:text-red-300"
              : "text-[var(--muted)]"
          }`}
        >
          {state.message}
        </p>
      ) : status ? (
        <p className="mt-2 max-w-xs text-xs leading-5 text-[var(--muted)]">
          Currently: {ACTIVITY_STATUS_LABELS[status]}. Your saved bookmark is
          separate.
        </p>
      ) : null}
    </div>
  );
}
