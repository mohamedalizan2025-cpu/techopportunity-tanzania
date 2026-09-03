"use client";

import { useActionState } from "react";
import { changeSavedOpportunityAction } from "@/lib/data/saved-opportunity-actions";
import { initialSavedMutationState } from "@/lib/saved-opportunity-state";

export function SaveOpportunityControl({
  opportunityId,
  opportunityTitle,
  isSaved,
  isAuthenticated,
  returnTo,
  compact = false,
}: {
  opportunityId: string;
  opportunityTitle: string;
  isSaved: boolean;
  isAuthenticated: boolean;
  returnTo: string;
  compact?: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    changeSavedOpportunityAction,
    initialSavedMutationState
  );
  const saved = state.saved ?? isSaved;
  const actionLabel = saved ? "Remove from saved" : "Save opportunity";
  const accessibleLabel = saved
    ? `Remove ${opportunityTitle} from saved opportunities`
    : isAuthenticated
      ? `Save ${opportunityTitle}`
      : `Sign in to save ${opportunityTitle}`;

  return (
    <div className="relative z-10">
      <form action={formAction}>
        <input type="hidden" name="opportunityId" value={opportunityId} />
        <input type="hidden" name="intent" value={saved ? "remove" : "save"} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <button
          type="submit"
          disabled={isPending}
          aria-pressed={saved}
          aria-label={accessibleLabel}
          className={`inline-flex min-h-10 items-center justify-center rounded-full border font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60 ${
            saved
              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
              : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
          } ${compact ? "px-3 text-xs" : "px-5 text-sm"}`}
        >
          <span aria-hidden="true" className="mr-1.5">{saved ? "✓" : "+"}</span>
          {isPending ? "Working…" : actionLabel}
        </button>
      </form>
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`mt-2 max-w-xs text-xs leading-5 ${
            state.status === "error" ? "text-red-700 dark:text-red-300" : "text-[var(--muted)]"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
