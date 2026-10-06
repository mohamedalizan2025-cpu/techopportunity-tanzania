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
    deleted?: string | string[];
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = sanitizeNextPath(rawNext);
  const authError = Array.isArray(params.authError)
    ? params.authError[0]
    : params.authError;
  const rawDeleted = Array.isArray(params.deleted) ? params.deleted[0] : params.deleted;
  const justDeleted = rawDeleted === "1";
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
        className="flex w-full max-w-3xl flex-1 flex-col justify-center py-8 sm:py-12"
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
          Save opportunities, see suggestions based on your profile, and track
          your application progress. Browsing, searching and opening source pages
          always remain public.
        </p>

        <div className="mt-8 overflow-hidden rounded-md border border-[var(--line)] bg-[var(--surface)] sm:grid sm:grid-cols-[1fr_1.25fr]">
          <div className="relative hidden min-h-[430px] flex-col justify-between gap-6 overflow-hidden rounded-md bg-[var(--brand-deep)] p-7 text-[#F5EFE0] sm:flex">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--gold)]">
              Tech Opportunity
            </p>
            <div>
              <p className="text-xl font-semibold leading-7">
                Local talent, global opportunity.
              </p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-[#F5EFE0]/85">
                <li>Human-reviewed listings with marked evidence.</li>
                <li>Deadline and access details before you apply.</li>
                <li>Private Saved list and application progress.</li>
              </ul>
            </div>
            <p className="text-xs text-[#F5EFE0]/80">
              Free for talent. Applications happen at the source.
            </p>
          </div>
          <div className="p-5 sm:p-7">
          {authError === "confirmation" ? (
            <div
              role="alert"
              className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
            >
              <p>
                That confirmation link is invalid or expired. Request a fresh
                link instead of creating the account again.
              </p>
              <Link
                href={
                  nextPath
                    ? `/resend-confirmation?next=${encodeURIComponent(nextPath)}`
                    : "/resend-confirmation"
                }
                className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-2"
              >
                Resend confirmation email
              </Link>
            </div>
          ) : null}
          {justDeleted ? (
            <div
              role="status"
              className="mb-4 rounded-md border border-[var(--line-strong)] bg-[var(--accent-soft)] p-3 text-sm text-[var(--accent-strong)]"
            >
              <p>
                Your account has been deleted. Your profile, saved items,
                and activity are gone; reports you sent stay for moderation
                with your identity removed.
              </p>
            </div>
          ) : null}
          <LoginForm nextPath={nextPath} />
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--subtle)]">
          Your saved opportunities are private to your account.
        </p>
      </main>
    </div>
  );
}
