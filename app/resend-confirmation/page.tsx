import type { Metadata } from "next";
import Link from "next/link";
import { sanitizeNextPath } from "@/lib/staff-form-state";
import { ResendConfirmationForm } from "./resend-confirmation-form";

export const metadata: Metadata = {
  title: "Resend confirmation email | Tech Opportunity",
  robots: { index: false, follow: false },
};

interface ResendConfirmationPageProps {
  searchParams: Promise<{
    next?: string | string[];
  }>;
}

export default async function ResendConfirmationPage({
  searchParams,
}: ResendConfirmationPageProps) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const nextPath = sanitizeNextPath(rawNext);

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
          Confirm your email.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Confirmation links expire. Request a fresh one here — your account
          details are kept, nothing needs to be recreated.
        </p>

        <div className="mt-8 rounded-md border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-7">
          <ResendConfirmationForm nextPath={nextPath} />
        </div>
      </main>
    </div>
  );
}
