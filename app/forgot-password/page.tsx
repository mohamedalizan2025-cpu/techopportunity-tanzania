import type { Metadata } from "next";
import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password | Tech Opportunity",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-[var(--background)] px-5 font-sans sm:px-8">
      <main
        id="main-content"
        tabIndex={-1}
        className="flex w-full max-w-xl flex-1 flex-col justify-center py-8 sm:py-12"
      >
        <Link
          href="/login"
          className="inline-flex min-h-11 w-fit items-center rounded-sm text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          ← Back to sign in
        </Link>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          Account recovery
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">
          Reset your password.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Use the email address for your account. If an account exists for
          that email, we&rsquo;ll send password reset instructions.
        </p>

        <div className="mt-8 rounded-md border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-7">
          <ForgotPasswordForm />
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--subtle)]">
          Reset links expire. If yours no longer works, request a fresh one
          here anytime.
        </p>
      </main>
    </div>
  );
}
