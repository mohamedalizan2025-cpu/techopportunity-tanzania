import type { Metadata } from "next";
import { OfflinePageClient } from "@/components/offline-page-client";

export const metadata: Metadata = {
  title: "You are offline | Tech Opportunity",
  robots: { index: false, follow: false },
};

/**
 * Useful offline product page (not an error screen): clear offline state,
 * stale honesty, last sync, cached browse, recently viewed, cached saved
 * where safe, reconnect status, and the optional Opportunity Run game.
 * Civic Hybrid, mobile-first.
 */
export default function OfflinePage() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex-1 bg-[var(--background)]"
    >
      <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          Offline
        </p>
        <h1 className="font-display mt-3 text-3xl font-semibold sm:text-4xl">
          You’re offline.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Opportunity deadlines and eligibility may have changed. Reconnect
          before relying on current opportunity information — cached listings
          are never presented as current.
        </p>
        <div className="mt-6 min-w-0">
          <OfflinePageClient />
        </div>
      </div>
    </main>
  );
}
