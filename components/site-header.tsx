import Link from "next/link";
import { logOutAction } from "@/lib/data/auth-actions";
import { getAuthenticatedUser } from "@/lib/data/supabase-auth";

const linkClasses =
  "inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold text-[var(--muted)] transition-colors hover:bg-[var(--muted-surface)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:px-4";

export async function SiteHeader() {
  const user = await getAuthenticatedUser();
  const isStaff = user?.role === "moderator" || user?.role === "admin";
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-8">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2.5 rounded-md text-sm font-bold tracking-tight text-[var(--foreground)] transition-colors hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:text-base"
        >
          <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--accent)] text-sm text-white shadow-sm">T</span>
          <span className="truncate"><span className="hidden sm:inline">TechOpportunity </span>Tanzania</span>
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center gap-1">
          <Link href="/" className={linkClasses}>
            Opportunities
          </Link>
          {user ? (
            <>
              <Link href="/saved" className={linkClasses}>Saved</Link>
              {isStaff ? (
                <Link href="/moderation" className={`${linkClasses} hidden sm:inline-flex`}>
                  Staff
                </Link>
              ) : null}
              <form action={logOutAction}>
                <button type="submit" className={linkClasses}>Sign out</button>
              </form>
            </>
          ) : (
            <Link href="/login?next=%2Fsaved" className={linkClasses}>Sign in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
