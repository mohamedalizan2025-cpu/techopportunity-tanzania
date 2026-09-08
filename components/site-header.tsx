import Link from "next/link";
import { logOutAction } from "@/lib/data/auth-actions";
import { getAuthenticatedUser } from "@/lib/data/supabase-auth";
import { UiIcon } from "./ui-icon";
import { MobileNavigation } from "./mobile-navigation";

const linkClasses = "nav-link";

export async function SiteHeader() {
  const user = await getAuthenticatedUser();
  const isStaff = user?.role === "moderator" || user?.role === "admin";
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur">
      <div className="page-shell flex min-h-[72px] items-center justify-between gap-3">
        <Link href="/" className="brand rounded-md">
          <span aria-hidden="true" className="brand-mark">
            <UiIcon name="arrow" className="-rotate-45" />
          </span>
          <span>
            Tech <span className="block sm:inline">Opportunity</span>
          </span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
          <Link href="/" className={linkClasses}>
            Explore
          </Link>
          {user ? (
            <>
              <Link href="/saved" className={linkClasses}>
                Saved
              </Link>
              {isStaff ? (
                <Link href="/moderation" className={linkClasses}>
                  Staff
                </Link>
              ) : null}
              <form action={logOutAction}>
                <button type="submit" className={linkClasses}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/saved" className={linkClasses}>
                Saved
              </Link>
              <Link href="/login?next=%2Fsaved" className="button-primary ml-3">
                Sign in
              </Link>
            </>
          )}
        </nav>
        <MobileNavigation>
          <Link href="/#opportunities" className={linkClasses}>
            Explore opportunities
          </Link>
          <Link href="/saved" className={linkClasses}>
            Saved opportunities
          </Link>
          {user ? (
            <>
              <p className="break-words px-3 py-2 text-xs text-[var(--muted)]">
                Signed in as {user.displayName ?? user.email ?? "your account"}
              </p>
              {isStaff ? (
                <Link href="/moderation" className={linkClasses}>
                  Staff moderation
                </Link>
              ) : null}
              <form action={logOutAction}>
                <button type="submit" className={linkClasses}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login?next=%2Fsaved" className={linkClasses}>
              Sign in
            </Link>
          )}
        </MobileNavigation>
      </div>
    </header>
  );
}
