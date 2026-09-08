import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex flex-1 flex-col items-center justify-center gap-4 bg-[var(--background)] px-6 py-24 text-center font-sans"
    >
      <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent-strong)]">
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
        <Link href="/" className="button-primary">
          Browse opportunities
        </Link>
        <Link href="/submit" className="button-secondary">
          Submit an opportunity
        </Link>
      </div>
    </main>
  );
}
