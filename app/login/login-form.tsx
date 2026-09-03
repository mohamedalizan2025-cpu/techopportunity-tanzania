"use client";

import { useActionState } from "react";
import { authenticateAction } from "@/lib/data/auth-actions";
import { initialLoginState } from "@/lib/staff-form-state";

const inputBase =
  "mt-1.5 min-h-11 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]";

export function LoginForm({ nextPath }: { nextPath: string | null }) {
  const [state, formAction, isPending] = useActionState(
    authenticateAction,
    initialLoginState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.status === "error" && state.message !== null ? (
        <p
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.message}
        </p>
      ) : null}
      {state.status === "success" && state.message !== null ? (
        <p
          role="status"
          className="rounded-xl border border-[var(--line-strong)] bg-[var(--accent-soft)] p-3 text-sm text-[var(--accent-strong)]"
        >
          {state.message}
        </p>
      ) : null}

      <input type="hidden" name="next" value={nextPath ?? ""} />

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-[var(--foreground)]">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={320}
          className={inputBase}
          placeholder="you@example.org"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold text-[var(--foreground)]">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
          className={inputBase}
          aria-describedby="password-help"
        />
        <p id="password-help" className="mt-1.5 text-xs leading-5 text-[var(--subtle)]">
          New accounts need at least 8 characters.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="submit"
          name="mode"
          value="sign-in"
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          {isPending ? "Please wait…" : "Sign in"}
        </button>
        <button
          type="submit"
          name="mode"
          value="sign-up"
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--foreground)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Create account
        </button>
      </div>
    </form>
  );
}
