"use client";
import Link from "next/link";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex flex-1 flex-col items-center justify-center gap-4 bg-[var(--background)] px-6 py-24 text-center font-sans"
    >
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
        We couldn’t load this page. Try again, or return to browse
        opportunities.
      </p>
      <button type="button" onClick={reset} className="button-primary">
        Try again
      </button>
      <Link href="/" className="nav-link underline underline-offset-4">
        Back to opportunities
      </Link>
    </main>
  );
}
