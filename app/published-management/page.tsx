import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logOutAction } from "@/lib/data/auth-actions";
import { categoryLabel } from "@/lib/category-labels";
import { formatDeadlinePresentation } from "@/lib/opportunity-presentation";
import { getModerationAccess } from "@/lib/data/moderation";
import { listManagedPublishedOpportunities } from "@/lib/data/published-management";
import { UnpublishControl } from "./unpublish-control";
import { OpportunityCover } from "@/components/opportunity-cover";

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
      <div className="hero-dark border-b border-black/20">
        <div className="mx-auto w-full max-w-2xl px-6 py-8 sm:py-10">
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
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-2xl flex-1 px-6 py-8 sm:py-10">

        {published.length === 0 ? (
            <p className="mt-10 rounded-md border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--muted)]">
            No published opportunities to manage.
          </p>
        ) : (
          <>
            <p className="mt-8 text-sm text-[var(--muted)]">
              Unpublishing hides one record from the public site. It never
              deletes the row: discovery source, URL, timestamps and the title
              stay intact. A required reason and the authenticated moderator,
              exact record, status transition and decision time are retained
              in the moderation audit. An unpublished record is not publicly
              readable and does not re-enter the pending review queue — this
              interface offers no re-publish button by design. Re-review keeps
              a record live only after the complete current trust contract
              passes again.
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {published.map((opportunity) => (
                <li
                  key={opportunity.id}
                  className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <span aria-hidden="true" className="hidden h-16 w-24 shrink-0 overflow-hidden rounded-md sm:block">
                      <OpportunityCover opportunity={opportunity} className="h-full w-full" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-medium text-[var(--foreground)]">
                        {opportunity.title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {categoryLabel(opportunity.category)}
                        {opportunity.organization ? ` · ${opportunity.organization}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-[var(--subtle)]">
                        {opportunity.sourceName
                          ? `Source · ${opportunity.sourceName}`
                          : "Source · none recorded (manually entered)"}
                        {" · "}
                        Deadline {formatDeadlinePresentation(opportunity.deadline).dateLabel ?? formatDeadlinePresentation(opportunity.deadline).label}
                        {" · "}
                        Published {formatPublished(opportunity.createdAt)}
                      </p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-[var(--subtle)]">
                        Status · publicly visible
                      </p>
                      <Link
                        href={`/opportunities/${opportunity.slug}`}
                        className="mt-2 inline-block text-xs font-medium text-[var(--muted)] underline underline-offset-2 hover:text-[var(--foreground)]"
                      >
                        View public page ↗
                      </Link>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Link
                        href={`/moderation/${opportunity.id}?mode=published`}
                        className="inline-flex h-9 items-center rounded-md border border-[var(--line-strong)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
                      >
                        Re-review evidence
                      </Link>
                      <UnpublishControl id={opportunity.id} title={opportunity.title} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>
    </div>
  );
}
