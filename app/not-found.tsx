import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-[var(--background)] px-6 py-24 text-center font-sans">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">
        404
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
        Page not found
      </h1>
      <p className="max-w-md text-base leading-7 text-[var(--muted)]">
        The page you are looking for does not exist or is no longer publicly
        available.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Browse opportunities
        </Link>
        <Link
          href="/submit"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--surface)] px-6 text-sm font-semibold text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Submit an opportunity
        </Link>
      </div>
    </div>
  );
}
