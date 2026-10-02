import Link from "next/link";
import { logOutAction } from "@/lib/data/auth-actions";
import { getAuthenticatedUser } from "@/lib/data/supabase-auth";
import { UiIcon } from "./ui-icon";
import { NavigationLink } from "./navigation-link";
import { MobileNavigation } from "./mobile-navigation";

const linkClasses = "nav-link";

export async function SiteHeader() {
  const user = await getAuthenticatedUser();
  const isStaff = user?.role === "moderator" || user?.role === "admin";
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--line)] bg-[var(--surface)]">
      <div className="page-shell flex min-h-[72px] items-center justify-between gap-3">
        <Link href="/" className="brand rounded-md">
          <span aria-hidden="true" className="brand-mark">
            <UiIcon name="arrow" className="-rotate-45" />
          </span>
          <span>
            Tech <span className="block sm:inline">Opportunity</span>
          </span>
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 xl:flex">
          <NavigationLink href="/">Explore</NavigationLink>
          <NavigationLink href="/for-you">For You</NavigationLink>
          <NavigationLink href="/activity">Activity</NavigationLink>
          {user ? (
            <>
              <NavigationLink href="/saved">
                Saved
              </NavigationLink>
              <NavigationLink href="/profile">
                Profile
              </NavigationLink>
              {isStaff ? (
                <>
                  <NavigationLink href="/moderation">
                    Staff
                  </NavigationLink>
                  <NavigationLink href="/campaigns">
                    Campaigns
                  </NavigationLink>
                </>
              ) : null}
              <form action={logOutAction}>
                <button type="submit" className={linkClasses}>
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <NavigationLink href="/saved">
                Saved
              </NavigationLink>
              <Link href="/login?next=%2Fsaved" className="button-primary ml-3">
                Sign in
              </Link>
            </>
          )}
        </nav>
        <MobileNavigation>
          <NavigationLink href="/">Explore opportunities</NavigationLink>
          <NavigationLink href="/for-you">For You</NavigationLink>
          <NavigationLink href="/activity">Your activity</NavigationLink>
          <NavigationLink href="/saved">
            Saved opportunities
          </NavigationLink>
          {user ? (
            <>
              <NavigationLink href="/profile">
                Your profile
              </NavigationLink>
              <p className="break-words px-3 py-2 text-xs text-[var(--muted)]">
                Signed in as {user.displayName ?? user.email ?? "your account"}
              </p>
              {isStaff ? (
                <>
                  <NavigationLink href="/moderation">
                    Staff moderation
                  </NavigationLink>
                  <NavigationLink href="/campaigns">
                    Campaign pilot
                  </NavigationLink>
                </>
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
