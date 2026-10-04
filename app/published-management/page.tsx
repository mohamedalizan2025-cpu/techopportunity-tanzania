import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logOutAction } from "@/lib/data/auth-actions";
import { categoryLabel } from "@/lib/category-labels";
import { formatDeadlinePresentation } from "@/lib/opportunity-presentation";
import { getModerationAccess } from "@/lib/data/moderation";
import { listManagedPublishedOpportunities } from "@/lib/data/published-management";
import { UnpublishControl } from "./unpublish-control";
import { StaffNav } from "@/components/staff-nav";

export const metadata: Metadata = {
  title: "Published records · TechOpportunity Tanzania",
  robots: { index: false, follow: false },
};

function formatPublished(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

const signOutButtonClasses = "unused-staff-signout-placeholder";

/**
 * Staff-only published-record list (Milestone 14). Same authorization
 * boundary as the moderation queue, deliberately minimal: one line per live
 * public record and explicit per-record re-review/unpublish actions. No
 * dashboards, no bulk selection, no new status vocabulary.
 */
export default async function PublishedManagementPage() {
  const access = await getModerationAccess();

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      redirect("/login?next=%2Fpublished-management");
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[var(--background)] px-6 py-24 text-center">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Access restricted
        </h1>
        <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
          Your account does not have moderation permissions.
        </p>
        <form action={logOutAction}>
          <button type="submit" className={signOutButtonClasses}>
            Sign out
          </button>
        </form>
      </div>
    );
  }

  const { displayName, email } = access.staff;
  const published = await listManagedPublishedOpportunities();
  const signedInAs = displayName ?? email ?? "staff";

  return (
    <div className="flex flex-1 flex-col bg-[var(--background)]">
      <StaffNav />
      <div className="staff-hero border-b border-black/20">
        <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow-gold">Staff management</p>
              <h1 className="font-display mt-2 text-3xl font-semibold text-[#f7f2e8] sm:text-4xl">
                Published records
              </h1>
              <p className="mt-2 text-sm hero-muted">
                Signed in as {signedInAs} ·{" "}
                {published.length === 0
                  ? "nothing is public right now"
                  : `${published.length} live on the public site`}
              </p>
            </div>
            <form action={logOutAction}>
              <button
                type="submit"
                className="inline-flex h-9 items-center rounded-md border border-white/25 bg-white/5 px-4 text-sm font-medium text-[#f7f2e8] transition-colors hover:border-[var(--gold)]"
              >
                Sign out
              </button>
            </form>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <Link
              href="/moderation"
              className="font-medium text-[#c9d4cb] underline underline-offset-2 hover:text-[var(--gold)]"
            >
              ← Moderation queue
            </Link>
            <Link
              href="/"
              className="font-medium text-[#c9d4cb] underline underline-offset-2 hover:text-[var(--gold)]"
            >
              View public site ↗
            </Link>
          </div>
        </div>
      </div>
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-6 py-8 sm:py-10">

        {published.length === 0 ? (
            <p className="mt-10 rounded-md border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">
            No published opportunities to manage.
          </p>
        ) : (
          <>
            <p className="mt-8 text-sm text-[var(--muted)]">
              Showing {published.length} live {published.length === 1 ? "record" : "records"}.
              Unpublishing hides one record from the public site — it never
              deletes the row, and an unpublished record does not re-enter the
              pending queue. A required reason and the authenticated moderator,
              exact record, status transition and decision time are retained
              in the moderation audit.
            </p>
            <p className="mt-4 text-xs text-[var(--muted)]" role="status">
              Showing {published.length} of {published.length} published
            </p>
            {/* Desktop: compact operations table. */}
            <div className="mt-4 hidden overflow-x-auto rounded-md border border-[var(--line)] bg-[var(--surface)] md:block">
              <table className="w-full min-w-[880px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--subtle)]">
                    <th scope="col" className="px-4 py-3">Opportunity</th>
                    <th scope="col" className="px-4 py-3">Organization</th>
                    <th scope="col" className="px-4 py-3">Category</th>
                    <th scope="col" className="px-4 py-3">Deadline</th>
                    <th scope="col" className="px-4 py-3">Published</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {published.map((opportunity) => {
                    const deadline = formatDeadlinePresentation(opportunity.deadline);
                    return (
                    <tr key={opportunity.id} className="border-b border-[var(--line)] align-top transition-colors last:border-b-0 hover:bg-[var(--hero)]">
                      <td className="max-w-[280px] px-4 py-3">
                        <p className="break-words font-semibold leading-5 text-[var(--foreground)]">
                          {opportunity.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--muted)]">
                          {opportunity.sourceName
                            ? `Source · ${opportunity.sourceName}`
                            : "Source · none recorded"}
                        </p>
                        <Link
                          href={`/opportunities/${opportunity.slug}`}
                          className="mt-1 inline-block text-xs font-medium text-[var(--primary-text)] underline underline-offset-2 hover:underline"
                        >
                          View public page ↗
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--muted)]">
                        {opportunity.organization ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--muted)]">
                        {categoryLabel(opportunity.category)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {deadline.state === "urgent" ? (
                          <span className="font-medium text-amber-800 dark:text-amber-200">
                            {deadline.dateLabel ?? deadline.label}
                          </span>
                        ) : (
                          <span className="text-[var(--muted)]">
                            {deadline.dateLabel ?? deadline.label}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[var(--muted)]">
                        {formatPublished(opportunity.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="trust-badge trust-badge-verified">
                          Live
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/moderation/${opportunity.id}?mode=published`}
                            aria-label={`Re-review evidence for ${opportunity.title}`}
                            className="inline-flex h-9 items-center rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-deep)]"
                          >
                            Re-review
                          </Link>
                          <UnpublishControl id={opportunity.id} title={opportunity.title} />
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile: compact stacked cards (no forced table columns). */}
            <ul className="mt-4 flex flex-col gap-2 md:hidden">
              {published.map((opportunity) => {
                const deadline = formatDeadlinePresentation(opportunity.deadline);
                return (
                <li
                  key={opportunity.id}
                  className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-3"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="trust-badge trust-badge-verified">
                      Live
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--subtle)]">
                      {categoryLabel(opportunity.category)}
                    </span>
                  </span>
                  <span className="mt-1.5 block break-words text-[15px] font-semibold leading-6 text-[var(--foreground)]">
                    {opportunity.title}
                  </span>
                  <span className="mt-1.5 grid gap-x-6 gap-y-1 text-xs leading-5 text-[var(--muted)]">
                    <span>
                      <span className="font-semibold text-[var(--subtle)]">Organization </span>
                      {opportunity.organization ?? "—"}
                    </span>
                    <span>
                      <span className="font-semibold text-[var(--subtle)]">Deadline </span>
                      {deadline.dateLabel ?? deadline.label}
                    </span>
                    <span>
                      <span className="font-semibold text-[var(--subtle)]">Published </span>
                      {formatPublished(opportunity.createdAt)}
                    </span>
                  </span>
                  <span className="mt-3 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/moderation/${opportunity.id}?mode=published`}
                      aria-label={`Re-review evidence for ${opportunity.title}`}
                      className="inline-flex h-9 items-center rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--primary-deep)]"
                    >
                      Re-review →
                    </Link>
                    <UnpublishControl id={opportunity.id} title={opportunity.title} />
                  </span>
                  <Link
                    href={`/opportunities/${opportunity.slug}`}
                    className="mt-2 inline-block text-xs font-medium text-[var(--primary-text)] underline underline-offset-2 hover:underline"
                  >
                    View public page ↗
                  </Link>
                </li>
                );
              })}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
