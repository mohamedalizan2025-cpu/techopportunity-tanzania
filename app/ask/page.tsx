import type { Metadata } from "next";
import Link from "next/link";
import { AskForm } from "@/components/ask-form";
import { ASK_FAQ } from "@/lib/ask/knowledge";
import { getAuthenticatedUser } from "@/lib/data/supabase-auth";

export const metadata: Metadata = {
  title: "Ask Tech Opportunity | Tech Opportunity",
  description:
    "Answers about opportunities, eligibility and trust information, application tracking, and using Tech Opportunity — grounded in verified information.",
};

export default async function AskPage() {
  const user = await getAuthenticatedUser();

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex-1 bg-[var(--background)]"
    >
      <section className="border-b border-[var(--line)] bg-[var(--hero)]">
        <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            Ask Tech Opportunity
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-4xl">
            Ask Tech Opportunity
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Ask about opportunities or how Tech Opportunity works. Answers
            use verified information only — including what is still
            unknown — and never decide eligibility or predict selection.
          </p>
          <AskForm isAuthenticated={user !== null} />
        </div>
      </section>

      <section aria-labelledby="ask-help-heading">
        <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
          <h2
            id="ask-help-heading"
            className="text-2xl font-semibold text-[var(--foreground)]"
          >
            Common answers
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Read instantly, no account needed.
          </p>
          <ul className="mt-6 space-y-3">
            {ASK_FAQ.map((entry) => (
              <li
                key={entry.id}
                className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-5"
              >
                <h3 className="font-semibold text-[var(--foreground)]">
                  {entry.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {entry.body}
                </p>
                <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                  See:{" "}
                  {entry.routes.map((route, index) => (
                    <span key={route}>
                      {index > 0 ? " · " : null}
                      <Link
                        href={route}
                        className="font-semibold text-[var(--accent-strong)] underline-offset-2 hover:underline"
                      >
                        {route}
                      </Link>
                    </span>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
