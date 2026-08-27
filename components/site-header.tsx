import Link from "next/link";

const linkClasses =
  "inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50";

export function SiteHeader() {
  return (
    <header className="w-full border-b border-black/[.08] bg-white dark:border-white/[.145] dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-black transition-colors hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-400"
        >
          TechOpportunity Tanzania
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
          <Link href="/" className={linkClasses}>
            Opportunities
          </Link>
          <Link href="/submit" className={linkClasses}>
            Submit
          </Link>
          <Link
            href="/login?next=%2Fmoderation"
            className={`${linkClasses} border border-transparent hover:underline`}
          >
            For staff
          </Link>
        </nav>
      </div>
    </header>
  );
}
