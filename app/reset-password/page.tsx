import type { Metadata } from "next";
import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/data/supabase-auth";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset password | Tech Opportunity",
  robots: { index: false, follow: false },
};

export default async function ResetPasswordPage() {
  const user = await getAuthenticatedUser();

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

        <div className="mt-8 rounded-md border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-7">
          {!user ? (
            <div className="flex flex-col gap-4">
              <p
                role="alert"
                className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              >
                This password reset link is invalid or expired. Request a
                fresh link and try again.
              </p>
              <Link href="/forgot-password" className="button-primary w-full">
                Request a fresh link
              </Link>
            </div>
          ) : (
            <ResetPasswordForm />
          )}
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--subtle)]">
          After updating, sign in again with your new password.
        </p>
      </main>
    </div>
  );
}
