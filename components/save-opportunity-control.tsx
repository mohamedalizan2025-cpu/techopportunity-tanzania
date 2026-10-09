"use client";

import { useActionState, useEffect, useState } from "react";
import { changeSavedOpportunityAction } from "@/lib/data/saved-opportunity-actions";
import { initialSavedMutationState } from "@/lib/saved-opportunity-state";
import { OFFLINE_OWNER_KEY } from "@/lib/offline-cache";
import { queueOfflineMutation } from "@/components/offline-queue-sync";
import { UiIcon } from "./ui-icon";

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
    initialSavedMutationState,
  );
  const [isOffline, setIsOffline] = useState(false);
  const [queuedNote, setQueuedNote] = useState<string | null>(null);

  useEffect(() => {
    const update = () =>
      setIsOffline(
        typeof navigator !== "undefined" ? !navigator.onLine : false
      );
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  const saved = state.saved ?? isSaved;
  const actionLabel = saved ? "Saved" : compact ? "Save" : "Save opportunity";
  const accessibleLabel = saved
    ? `Remove ${opportunityTitle} from saved opportunities`
    : isAuthenticated
      ? `Save ${opportunityTitle}`
      : `Sign in to save ${opportunityTitle}`;

  return (
    <div className="relative z-10">
      <form
        action={formAction}
        onSubmit={(event) => {
          if (!isOffline || !isAuthenticated) return;
          event.preventDefault();
          let owner: string | null = null;
          try {
            owner = window.localStorage.getItem(OFFLINE_OWNER_KEY);
          } catch {
            owner = null;
          }
          if (!owner) {
            setQueuedNote("You're offline — reconnect to save this opportunity.");
            return;
          }
          queueOfflineMutation(owner, {
            type: saved ? "unsave" : "save",
            opportunityId,
          });
          setQueuedNote(
            saved
              ? "Queued removal — will sync when reconnected."
              : "Saved offline — will sync when reconnected."
          );
        }}
      >
        <input type="hidden" name="opportunityId" value={opportunityId} />
        <input type="hidden" name="intent" value={saved ? "remove" : "save"} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <button
          type="submit"
          disabled={isPending}
          aria-pressed={saved}
          aria-label={accessibleLabel}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60 ${
            saved
              ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
              : "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
          } ${compact ? "px-3 text-xs" : "px-5 text-sm"}`}
        >
          <UiIcon
            name="bookmark"
            width="17"
            height="17"
            fill={saved ? "currentColor" : "none"}
          />
          {isPending ? "Working…" : actionLabel}
        </button>
      </form>
      {queuedNote ? (
        <p role="status" className="mt-2 max-w-xs text-xs leading-5 text-[var(--muted)]">
          {queuedNote} Cached saves are marked stale until the server confirms them.
        </p>
      ) : state.message ? (
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
      ) : null}
    </div>
  );
}
