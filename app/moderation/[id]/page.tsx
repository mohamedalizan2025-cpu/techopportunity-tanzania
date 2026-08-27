import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OpportunityDetail } from "@/components/opportunity-detail";
import { logOutAction } from "@/lib/data/auth-actions";
import { listOrganizationOptions } from "@/lib/data/opportunities";
import {
  getModerationAccess,
  getPendingOpportunityById,
  isValidOpportunityId,
} from "@/lib/data/moderation";
import { DecisionForm } from "../decision-form";

export const metadata: Metadata = {
  title: "Review submission · TechOpportunity Tanzania",
  robots: { index: false, follow: false },
};

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ModerationReviewPage({ params }: ReviewPageProps) {
  const { id } = await params;
  const access = await getModerationAccess();

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      redirect(`/login?next=${encodeURIComponent(`/moderation/${id}`)}`);
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
          <button
            type="submit"
            className="inline-flex h-9 items-center rounded-full border border-black/[.10] bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Sign out
          </button>
        </form>
      </div>
    );
  }

  if (!isValidOpportunityId(id)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-50 px-6 py-24 font-sans dark:bg-black">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          Submission not found
        </h1>
        <Link
          href="/moderation"
          className="text-sm font-medium underline underline-offset-4 text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to queue
        </Link>
      </div>
    );
  }

  const opportunity = await getPendingOpportunityById(id);
  const organizations = await listOrganizationOptions();

  if (!opportunity) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-zinc-50 px-6 py-24 font-sans dark:bg-black">
        <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
          No longer pending
        </h1>
        <p className="max-w-md text-center text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          This submission was not found in the pending queue — it may already
          have been reviewed.
        </p>
        <Link
          href="/moderation"
          className="text-sm font-medium underline underline-offset-4 text-zinc-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          ← Back to queue
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 sm:py-16">
        <div className="flex items-start justify-between gap-4">
          <Link
            href="/moderation"
            className="text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Moderation queue
          </Link>
          <form action={logOutAction}>
            <button
              type="submit"
              className="inline-flex h-9 items-center rounded-full border border-black/[.10] bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              Sign out
            </button>
          </form>
        </div>

        <p className="mt-4 rounded-lg border border-dashed border-black/[.15] p-3 text-xs uppercase tracking-wide text-zinc-500 dark:border-white/[.2] dark:text-zinc-400">
          Pending review · Submitted{" "}
          {new Intl.DateTimeFormat("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
            timeZone: "UTC",
          }).format(new Date(opportunity.createdAt))}
        </p>

        <div className="mt-4">
          <OpportunityDetail opportunity={opportunity} />
        </div>

        {opportunity.sourceName ? (
          <dl className="mt-6 rounded-lg border border-dashed border-black/[.15] p-4 text-sm dark:border-white/[.2]">
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="w-32 shrink-0 font-medium text-black dark:text-zinc-50">
                Discovery source
              </dt>
              <dd className="text-zinc-600 dark:text-zinc-400">{opportunity.sourceName}</dd>
            </div>
            <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="w-32 shrink-0 font-medium text-black dark:text-zinc-50">
                Discovered
              </dt>
              <dd className="text-zinc-600 dark:text-zinc-400">
                {new Intl.DateTimeFormat("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                }).format(new Date(opportunity.discoveredAt ?? opportunity.createdAt))}
                {opportunity.discoveryMethod ? ` · ${opportunity.discoveryMethod}` : ""}
              </dd>
            </div>
          </dl>
        ) : null}

        <section className="mt-10 border-t border-black/[.08] pt-8 dark:border-white/[.145]">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            Decision
          </h2>
          <div className="mt-4">
            <DecisionForm opportunityId={opportunity.id} organizations={organizations} />
          </div>
        </section>
      </main>
    </div>
  );
}
