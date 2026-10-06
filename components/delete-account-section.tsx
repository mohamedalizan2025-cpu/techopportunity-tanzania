"use client";

import { useActionState, useState } from "react";
import { deleteOwnAccountAction } from "@/lib/data/account-deletion-actions";
import {
  ACCOUNT_DELETION_CONFIRMATION,
  initialAccountDeletionState,
} from "@/lib/account-deletion-state";

export function DeleteAccountSection() {
  const [state, formAction, isPending] = useActionState(
    deleteOwnAccountAction,
    initialAccountDeletionState
  );
  const [confirmation, setConfirmation] = useState("");
  const confirmed =
    confirmation.trim() === ACCOUNT_DELETION_CONFIRMATION;

  return (
    <section
      aria-labelledby="delete-account-heading"
      className="mt-10 rounded-md border border-red-300 bg-[var(--surface)] p-5 sm:p-6 dark:border-red-900"
    >
      <h2
        id="delete-account-heading"
        className="text-lg font-semibold text-[var(--foreground)]"
      >
        Delete account
      </h2>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Permanently deletes your account and private data: your profile,
        saved opportunities, application activity, and reminder
        preferences. Listing reports you sent stay for moderation with
        your identity removed. This cannot be undone, and you will be
        signed out immediately.
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Prefer help instead? Message us on WhatsApp from the{" "}
        <a
          href="/contact"
          className="font-semibold text-[var(--accent-strong)] underline-offset-2 hover:underline"
        >
          Contact page
        </a>
        .
      </p>
      <form action={formAction} className="mt-4 flex flex-col gap-3">
        <div>
          <label
            htmlFor="delete-confirmation"
            className="block text-sm font-semibold text-[var(--foreground)]"
          >
            Type DELETE to confirm
          </label>
          <input
            id="delete-confirmation"
            name="confirmation"
            type="text"
            autoComplete="off"
            maxLength={16}
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="DELETE"
            className="auth-input"
            aria-describedby="delete-confirmation-help"
          />
          <p
            id="delete-confirmation-help"
            className="mt-1.5 text-xs leading-5 text-[var(--subtle)]"
          >
            Deletion is permanent and cannot be undone.
          </p>
        </div>
        {state.status === "error" && state.message ? (
          <p role="alert" className="text-sm text-red-700 dark:text-red-300">
            {state.message}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isPending || !confirmed}
          className="inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-red-300 bg-[var(--surface)] px-5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
        >
          {isPending ? "Deleting…" : "Delete my account"}
        </button>
      </form>
    </section>
  );
}
