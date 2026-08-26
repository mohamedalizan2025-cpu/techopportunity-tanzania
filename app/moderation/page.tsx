import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { logOutAction } from "@/lib/data/auth-actions";
import { categoryLabel } from "@/lib/category-labels";
import { getModerationAccess, listPendingOpportunities } from "@/lib/data/moderation";

export const metadata: Metadata = {
  title: "Moderation queue · TechOpportunity Tanzania",
  robots: { index: false, follow: false },
};

function formatSubmitted(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

function formatQueueDeadline(iso: string | null): string {
  if (!iso) return "Rolling";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));
}

const signOutButtonClasses =
  "inline-flex h-9 items-center rounded-full border border-black/[.10] bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50";

export default async function ModerationPage() {
  const access = await getModerationAccess();

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      redirect("/login?next=%2Fmoderation");
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
  const pending = await listPendingOpportunities();
  const signedInAs = displayName ?? email ?? "staff";

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:py-16">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-black sm:text-4xl dark:text-zinc-50">
              Moderation queue
            </h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Signed in as {signedInAs} ·{" "}
              {pending.length === 0
                ? "queue is empty"
                : `${pending.length} awaiting review`}
            </p>
          </div>
          <form action={logOutAction}>
            <button type="submit" className={signOutButtonClasses}>
              Sign out
            </button>
          </form>
        </div>

        {pending.length === 0 ? (
          <p className="mt-10 rounded-lg border border-dashed border-black/[.15] p-8 text-center text-sm text-zinc-500 dark:border-white/[.2] dark:text-zinc-400">
            No submissions are waiting for review right now.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-3">
            {pending.map((opportunity) => (
              <li key={opportunity.id}>
                <Link
                  href={`/moderation/${opportunity.id}`}
                  className="block rounded-lg border border-black/[.08] bg-white p-4 transition-colors hover:border-black/30 dark:border-white/[.145] dark:bg-zinc-950 dark:hover:border-white/40"
                >
                  <p className="font-medium text-black dark:text-zinc-50">
                    {opportunity.title}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    {opportunity.organization} ·{" "}
                    {categoryLabel(opportunity.category)}
                    {opportunity.location?.city
                      ? ` · ${opportunity.location.city}`
                      : " · Remote"}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                    Submitted {formatSubmitted(opportunity.createdAt)} · Deadline{" "}
                    {formatQueueDeadline(opportunity.deadline)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
