"use client";

import { useActionState } from "react";
import { initialAlertPreferenceMutationState } from "@/lib/alert-preference-state";
import { changeDeadlineAlertPreferenceAction } from "@/lib/data/deadline-alert-actions";

export function AlertPreferenceControl({ enabled }: { enabled: boolean }) {
  const [state, action, isPending] = useActionState(
    changeDeadlineAlertPreferenceAction,
    initialAlertPreferenceMutationState
  );
  const current = state.enabled ?? enabled;

  return (
    <div>
      <form action={action}>
        <input type="hidden" name="intent" value={current ? "disable" : "enable"} />
        <button
          type="submit"
          disabled={isPending}
          aria-pressed={current}
          className={`inline-flex min-h-11 items-center justify-center rounded-full border px-5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60 ${
            current
              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
              : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--accent)]"
          }`}
        >
          {isPending ? "Saving…" : current ? "Deadline alerts enabled" : "Enable deadline alerts"}
        </button>
      </form>
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`mt-2 text-xs leading-5 ${
            state.status === "error" ? "text-red-700 dark:text-red-300" : "text-[var(--muted)]"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
