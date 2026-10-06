import { NavigationLink } from "./navigation-link";
import { UiIcon } from "./ui-icon";

/**
 * Compact operations navigation for staff routes. Deliberately distinct
 * from public Explore/For You navigation: a navy operations band with the
 * review queue, published records, and the campaign pilot only. Active
 * section reads navy/cobalt with a gold rule — never green.
 */
export function StaffNav() {
  return (
    <nav
      aria-label="Staff"
      className="border-b border-black/20 bg-[var(--primary-ink)] text-[#eef1f4]"
    >
      <div className="page-shell flex min-h-12 flex-wrap items-center gap-x-1 gap-y-0 overflow-x-auto py-1">
        <span className="mr-2 inline-flex shrink-0 items-center gap-2 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[#f7f2e8]">
          <span
            aria-hidden="true"
            className="grid h-5 w-5 place-items-center rounded-[4px] bg-white/10"
          >
            <UiIcon name="shield" width="12" height="12" />
          </span>
          Tech Opportunity · Staff
        </span>
        <span className="mr-1 hidden h-5 w-px shrink-0 bg-white/15 sm:inline-block" aria-hidden="true" />
        <NavigationLink href="/moderation">Review queue</NavigationLink>
        <NavigationLink href="/published-management">Published</NavigationLink>
        <NavigationLink href="/reports">Reports</NavigationLink>
        <NavigationLink href="/campaigns">Campaigns</NavigationLink>
      </div>
    </nav>
  );
}
