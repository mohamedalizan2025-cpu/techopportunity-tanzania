import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "You are offline | Tech Opportunity",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center"
    >
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
        Offline
      </p>
      <h1 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">
        You’re offline.
      </h1>
      <p className="mt-4 max-w-md text-base leading-7 text-[var(--muted)]">
        Opportunity deadlines and eligibility may have changed. Reconnect
        before relying on current opportunity information — cached listings
        are never presented as current.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="button-primary">
          Try Explore again
        </Link>
        <Link href="/saved" className="button-secondary">
          Saved list
        </Link>
      </div>
    </main>
  );
}
