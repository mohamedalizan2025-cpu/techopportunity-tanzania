import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/data/supabase-auth";
import { postLoginDestination, sanitizeNextPath } from "@/lib/staff-form-state";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in | TechOpportunity Tanzania",
  robots: { index: false, follow: false },
};

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = sanitizeNextPath(rawNext);
  const user = await getAuthenticatedUser();
  if (user) {
    redirect(
      postLoginDestination(
        nextPath,
        user.role === "moderator" || user.role === "admin"
      )
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-[var(--background)] px-5 font-sans sm:px-8">
      <main id="main-content" tabIndex={-1} className="flex w-full max-w-md flex-1 flex-col justify-center py-16 sm:py-24">
        <Link
          href="/"
          className="w-fit rounded-sm text-sm font-semibold text-[var(--muted)] transition-colors hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          ← All opportunities
        </Link>

        <p className="mt-8 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
          Your opportunities
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">
          Sign in to save opportunities
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Keep a private list of opportunities you want to revisit. Browsing,
          searching and opening source pages always remain public.
        </p>

        <div className="mt-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[0_16px_45px_rgba(18,48,34,0.08)] sm:p-7">
          <LoginForm nextPath={nextPath} />
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--subtle)]">
          Staff permissions remain separate and are granted only by an administrator.
        </p>
      </main>
    </div>
  );
}
