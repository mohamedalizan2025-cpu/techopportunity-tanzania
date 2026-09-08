import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/data/supabase-auth";
import { postLoginDestination, sanitizeNextPath } from "@/lib/staff-form-state";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in | Tech Opportunity",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{
    next?: string | string[];
    authError?: string | string[];
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = sanitizeNextPath(rawNext);
  const authError = Array.isArray(params.authError)
    ? params.authError[0]
    : params.authError;
  const user = await getAuthenticatedUser();
  if (user) {
    redirect(
      postLoginDestination(
        nextPath,
        user.role === "moderator" || user.role === "admin",
      ),
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-[var(--background)] px-5 font-sans sm:px-8">
      <main
        id="main-content"
        tabIndex={-1}
        className="flex w-full max-w-md flex-1 flex-col justify-center py-8 sm:py-12"
      >
        <Link
          href="/"
          className="inline-flex min-h-11 w-fit items-center rounded-sm text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          ← All opportunities
        </Link>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          Your opportunities
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">
          Keep your next step in sight.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Keep a private list of opportunities you want to revisit. Browsing,
          searching and opening source pages always remain public.
        </p>

        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_8px_30px_#102a2106] sm:p-7">
          {authError === "confirmation" ? (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            >
              That confirmation link is invalid or expired. Request a fresh
              email by creating the account again.
            </p>
          ) : null}
          <LoginForm nextPath={nextPath} />
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--subtle)]">
          Your saved opportunities are private to your account.
        </p>
      </main>
    </div>
  );
}
