import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logOutAction } from "@/lib/data/auth-actions";
import { categoryLabel } from "@/lib/category-labels";
import { getModerationAccess } from "@/lib/data/moderation";
import { listManagedPublishedOpportunities } from "@/lib/data/published-management";
import { UnpublishControl } from "./unpublish-control";

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

const signOutButtonClasses =
  "inline-flex h-9 items-center rounded-full border border-black/[.10] bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50";

/**
 * Staff-only published-record list (Milestone 14). Same authorization
 * boundary as the moderation queue, deliberately minimal: one line per live
 * public record and one per-record unpublish action. No dashboards, no bulk
 * selection, no new status vocabulary.
 */
export default async function PublishedManagementPage() {
  const access = await getModerationAccess();

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      redirect("/login?next=%2Fpublished-management");
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-50 px-6 py-24 text-center font-sans dark:bg-black">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Access restricted
        </h1>
        <p className="max-w-md text-sm leading-6 text-zinc-600 dark:text-zinc-400">
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
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:py-16">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
              Published records
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Signed in as {signedInAs} ·{" "}
              {published.length === 0
                ? "nothing is public right now"
                : `${published.length} live on the public site`}
            </p>
          </div>
          <form action={logOutAction}>
            <button type="submit" className={signOutButtonClasses}>
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link
            href="/moderation"
            className="font-medium text-zinc-600 underline underline-offset-2 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Moderation queue
          </Link>
          <Link
            href="/"
            className="font-medium text-zinc-600 underline underline-offset-2 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            View public site ↗
          </Link>
        </div>

        {published.length === 0 ? (
          <p className="mt-10 rounded-lg border border-dashed border-black/[.15] p-8 text-center text-sm text-zinc-500 dark:border-white/[.2] dark:text-zinc-400">
            No published opportunities to manage.
          </p>
        ) : (
          <>
            <p className="mt-8 text-sm text-zinc-600 dark:text-zinc-400">
              Unpublishing hides one record from the public site. It never
              deletes the row: discovery source, URL, timestamps and the title
              stay intact for audit. An unpublished record is not publicly
              readable and does not re-enter the pending review queue — this
              interface offers no re-publish button by design.
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {published.map((opportunity) => (
                <li
                  key={opportunity.id}
                  className="rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words font-medium text-black dark:text-zinc-50">
                        {opportunity.title}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        {categoryLabel(opportunity.category)}
                        {opportunity.organization ? ` · ${opportunity.organization}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                        {opportunity.sourceName
                          ? `Source · ${opportunity.sourceName}`
                          : "Source · none recorded (manually entered)"}
                        {" · "}
                        Published {formatPublished(opportunity.createdAt)}
                      </p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                        Status · publicly visible
                      </p>
                      <Link
                        href={`/opportunities/${opportunity.slug}`}
                        className="mt-2 inline-block text-xs font-medium text-zinc-600 underline underline-offset-2 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        View public page ↗
                      </Link>
                    </div>
                    <UnpublishControl id={opportunity.id} title={opportunity.title} />
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
