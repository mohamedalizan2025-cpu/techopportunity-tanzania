"use client";

import { useActionState, useState } from "react";
import { unpublishOpportunityAction } from "@/lib/data/moderation-actions";
import {
  UNPUBLISH_CONFIRM_TOKEN,
  UNPUBLISH_REASON_MAX_LENGTH,
  UNPUBLISH_REASON_MIN_LENGTH,
  initialUnpublishState,
} from "@/lib/staff-form-state";

const ghostButtonClasses =
  "inline-flex h-9 items-center rounded-md border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-60";
const dangerButtonClasses =
  "inline-flex h-9 items-center rounded-md border border-red-300 bg-[var(--surface)] px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40";

/**
 * Per-record unpublish control (Milestone 14). Deliberately single-row: no
 * selection, no bulk action. The confirmation step is required by the server
 * action too (token check), so this UI is a guard rail, not the guarantee.
 */
export function UnpublishControl({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [state, formAction, isPending] = useActionState(
    unpublishOpportunityAction,
    initialUnpublishState
  );
  const [confirming, setConfirming] = useState(false);

  if (state.status === "success" && state.unpublishedId === id) {
    return (
      <p role="status" className="text-sm text-[var(--muted)]">
        {state.message}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {state.status === "error" && state.message !== null ? (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.message}
        </p>
      ) : null}

      {confirming ? (
        <form action={formAction} className="flex max-w-xl flex-col items-end gap-2">
          <input type="hidden" name="opportunityId" value={id} />
          <span className="text-xs text-[var(--muted)]">
            Hide “{title}” from the public site? The record is kept, not
            deleted.
          </span>
          <label className="w-full text-xs font-medium text-[var(--muted)]">
            Reason (recorded in the moderation audit)
            <textarea
              name="reason"
              required
              minLength={UNPUBLISH_REASON_MIN_LENGTH}
              maxLength={UNPUBLISH_REASON_MAX_LENGTH}
              rows={2}
              disabled={isPending}
              className="mt-1 w-full rounded-md border border-[var(--line-strong)] bg-[var(--surface)] px-3 py-2 text-sm font-normal text-[var(--foreground)]"
            />
          </label>
          <button
            type="submit"
            name="confirm"
            value={UNPUBLISH_CONFIRM_TOKEN}
            disabled={isPending}
            className={dangerButtonClasses}
          >
            {isPending ? "Working…" : "Confirm unpublish"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            disabled={isPending}
            className={ghostButtonClasses}
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          disabled={isPending}
          className={ghostButtonClasses}
        >
          Unpublish
        </button>
      )}
    </div>
  );
}
