"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/lib/data/auth-actions";
import { initialLoginState } from "@/lib/staff-form-state";

export function ForgotPasswordForm() {
  const feedback = useRef<HTMLParagraphElement>(null);
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    initialLoginState,
  );

  useEffect(() => {
    if (state.message) feedback.current?.focus();
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <h2 className="text-xl font-semibold">Forgot your password?</h2>
      <p className="text-sm leading-6 text-[var(--muted)]">
        Enter the email address for your account and we&rsquo;ll send password
        reset instructions.
      </p>
      {state.status === "error" && state.message !== null ? (
        <p
          role="alert"
          ref={feedback}
          tabIndex={-1}
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.message}
        </p>
      ) : null}
      {state.status === "success" && state.message !== null ? (
        <p
          role="status"
          ref={feedback}
          tabIndex={-1}
          className="rounded-md border border-[var(--line-strong)] bg-[var(--accent-soft)] p-3 text-sm text-[var(--accent-strong)]"
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-[var(--foreground)]"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={320}
          className="auth-input"
          placeholder="you@example.org"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="button-primary w-full disabled:opacity-60"
      >
        {isPending ? "Please wait…" : "Send reset instructions"}
      </button>

      <p className="text-sm leading-6 text-[var(--muted)]">
        Waiting on a confirmation email instead?{" "}
        <Link
          href="/resend-confirmation"
          className="inline-flex min-h-11 items-center font-semibold text-[var(--accent-strong)] underline-offset-2 hover:underline"
        >
          Resend confirmation email
        </Link>
      </p>
    </form>
  );
}
