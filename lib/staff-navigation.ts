/**
 * Staff navigation visibility (auth-correctness milestone).
 *
 * PUBLIC NAV VISIBILITY is moderator-only by owner requirement:
 * only a resolved profile role of exactly `"moderator"` sees the
 * Staff / Campaigns entries. This is presentation, NOT security —
 * server authorization (`getModerationAccess`) intentionally keeps its
 * own moderator+admin contract and is unchanged.
 */

export const STAFF_ROUTE_PREFIXES = [
  "/moderation",
  "/published-management",
  "/campaigns",
] as const;

/** Exact moderator check for public navigation visibility. */
export function isModeratorRole(role: unknown): role is "moderator" {
  return role === "moderator";
}

/** Public Staff/Campaigns entries render only for moderators. */
export function canSeeStaffNavigation(role: unknown): boolean {
  return isModeratorRole(role);
}

/**
 * Null-safe staff-route check. `usePathname()` can yield `null` outside a
 * mounted router context (transitions, fallbacks); a null pathname must
 * render the public chrome, never throw into the root error boundary.
 */
export function isStaffRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return STAFF_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}
