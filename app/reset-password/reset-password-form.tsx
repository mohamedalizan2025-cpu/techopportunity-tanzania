"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { updatePasswordAction } from "@/lib/data/auth-actions";
import { initialLoginState } from "@/lib/staff-form-state";

export function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const feedback = useRef<HTMLParagraphElement>(null);
  const [state, formAction, isPending] = useActionState(
    updatePasswordAction,
    initialLoginState,
  );

  useEffect(() => {
    if (state.message) feedback.current?.focus();
  }, [state]);

  if (state.status === "success" && state.message !== null) {
    return (
      <div className="flex flex-col gap-4">
        <p
          role="status"
          ref={feedback}
          tabIndex={-1}
          className="rounded-md border border-[var(--line-strong)] bg-[var(--accent-soft)] p-3 text-sm text-[var(--accent-strong)]"
        >
          {state.message}
        </p>
        <Link
          href="/login"
          className="button-primary w-full"
        >
          Sign in with your new password
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <h2 className="text-xl font-semibold">Choose a new password</h2>
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

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-[var(--foreground)]"
        >
          New password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            maxLength={128}
            className="auth-input"
            style={{ paddingRight: 72 }}
            aria-describedby="new-password-help"
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute bottom-1 right-1 min-h-11 rounded-md px-3 text-xs font-semibold text-[var(--muted)]"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <p
          id="new-password-help"
          className="mt-1.5 text-xs leading-5 text-[var(--subtle)]"
        >
          Use at least 8 characters.
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-semibold text-[var(--foreground)]"
        >
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          maxLength={128}
          className="auth-input"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="button-primary w-full disabled:opacity-60"
      >
        {isPending ? "Please wait…" : "Update password"}
      </button>
    </form>
  );
}
