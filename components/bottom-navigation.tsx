"use client";

import { usePathname } from "next/navigation";
import { isStaffRoute } from "@/lib/staff-navigation";
import { NavigationLink } from "./navigation-link";
import { UiIcon } from "./ui-icon";

/**
 * Thumb-first primary navigation for phones. Desktop and tablet keep the
 * header navigation; this bar renders below the `md` breakpoint only.
 * Staff operational routes use StaffNav instead — never both.
 * All targets are full product routes with 60px touch rows.
 */
export function BottomNavigation() {
  const pathname = usePathname();
  if (isStaffRoute(pathname)) {
    return null;
  }
  return (
    <>
      <nav aria-label="Primary" className="bottom-nav md:hidden">
        <div className="mx-auto flex w-full max-w-xl items-stretch">
          <NavigationLink href="/" className="bottom-nav-link">
            <UiIcon name="globe" width="20" height="20" />
            Explore
          </NavigationLink>
          <NavigationLink href="/for-you" className="bottom-nav-link">
            <UiIcon name="check" width="20" height="20" />
            For You
          </NavigationLink>
          <NavigationLink href="/saved" className="bottom-nav-link">
            <UiIcon name="bookmark" width="20" height="20" />
            Saved
          </NavigationLink>
          <NavigationLink href="/profile" className="bottom-nav-link">
            <UiIcon name="user" width="20" height="20" />
            Profile
          </NavigationLink>
        </div>
      </nav>
      <div aria-hidden="true" className="h-[76px] md:hidden" />
    </>
  );
}
