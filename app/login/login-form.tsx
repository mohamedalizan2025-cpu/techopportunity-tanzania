"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { authenticateAction } from "@/lib/data/auth-actions";
import { initialLoginState } from "@/lib/staff-form-state";

export function LoginForm({ nextPath }: { nextPath: string | null }) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [showPassword, setShowPassword] = useState(false);
  const feedback = useRef<HTMLParagraphElement>(null);
  const [state, formAction, isPending] = useActionState(
    authenticateAction,
    initialLoginState,
  );

  useEffect(() => {
    if (state.message) feedback.current?.focus();
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div
        className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--muted-surface)] p-1"
        role="group"
        aria-label="Account action"
      >
        <button
          type="button"
          aria-pressed={mode === "sign-in"}
          disabled={isPending}
          onClick={() => setMode("sign-in")}
          className={`min-h-11 rounded-lg text-sm font-semibold ${mode === "sign-in" ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]"}`}
        >
          Sign in
        </button>
        <button
          type="button"
          aria-pressed={mode === "sign-up"}
          disabled={isPending}
          onClick={() => setMode("sign-up")}
          className={`min-h-11 rounded-lg text-sm font-semibold ${mode === "sign-up" ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]"}`}
        >
          Create account
        </button>
      </div>
      <h2 className="text-xl font-semibold">
        {mode === "sign-in" ? "Welcome back" : "Create your free account"}
      </h2>
      <input type="hidden" name="mode" value={mode} />
      {state.status === "error" && state.message !== null ? (
        <p
          role="alert"
          ref={feedback}
          tabIndex={-1}
          className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.message}
        </p>
      ) : null}
      {state.status === "success" && state.message !== null ? (
        <p
          role="status"
          ref={feedback}
          tabIndex={-1}
          className="rounded-xl border border-[var(--line-strong)] bg-[var(--accent-soft)] p-3 text-sm text-[var(--accent-strong)]"
        >
          {state.message}
        </p>
      ) : null}

      <input type="hidden" name="next" value={nextPath ?? ""} />

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

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-[var(--foreground)]"
        >
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={
              mode === "sign-up" ? "new-password" : "current-password"
            }
            required
            maxLength={128}
            className="auth-input"
            style={{ paddingRight: 72 }}
            aria-describedby="password-help"
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
          id="password-help"
          className="mt-1.5 text-xs leading-5 text-[var(--subtle)]"
        >
          {mode === "sign-up"
            ? "Use at least 8 characters. We’ll email you a confirmation link."
            : "Enter the password for your account."}
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="button-primary w-full disabled:opacity-60"
      >
        {isPending
          ? "Please wait…"
          : mode === "sign-in"
            ? "Sign in"
            : "Create account"}
      </button>
    </form>
  );
}
