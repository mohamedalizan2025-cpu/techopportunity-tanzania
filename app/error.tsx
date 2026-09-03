"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-[var(--background)] px-6 py-24 text-center font-sans">
      <h1 className="text-2xl font-semibold text-[var(--foreground)]">
        Something went wrong
      </h1>
      <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
        An unexpected error occurred while loading this page. Your data is
        safe — please try again.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
      >
        Try again
      </button>
    </div>
  );
}
