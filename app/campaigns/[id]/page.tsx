import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CampaignStatusControl } from "@/components/campaign-status-control";
import { OpportunityCard } from "@/components/opportunity-card";
import { getModerationAccess } from "@/lib/data/moderation";
import { getProviderCampaign } from "@/lib/data/provider-campaigns";
import {
  getPublishedOpportunityById,
  listManagedPublishedOpportunities,
} from "@/lib/data/published-management";
import { estimateAudience } from "@/lib/campaign-analytics";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_DESCRIPTIONS,
} from "@/lib/provider-campaign-state";
import { logOutAction } from "@/lib/data/auth-actions";

export const metadata: Metadata = {
  title: "Campaign detail · TechOpportunity Tanzania",
  robots: { index: false, follow: false },
};

const signOutButtonClasses =
  "inline-flex h-9 items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await getModerationAccess();

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      redirect(`/login?next=%2Fcampaigns%2F${encodeURIComponent(id)}`);
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-[var(--background)] px-6 py-24 text-center font-sans">
        <h1 className="text-2xl font-semibold text-[var(--foreground)]">
          Access restricted
        </h1>
        <p className="max-w-md text-sm leading-6 text-[var(--muted)]">
          The campaign pilot is an internal staff tool.
        </p>
        <form action={logOutAction}>
          <button type="submit" className={signOutButtonClasses}>
            Sign out
          </button>
        </form>
      </div>
    );
  }

  const { available, campaign } = await getProviderCampaign(
    access.staff.client,
    id
  );
  if (!available) {
    return (
      <main className="flex-1 bg-[var(--background)]">
        <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
          <div
            role="alert"
            className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
          >
            Campaigns are temporarily unavailable (schema pending).{" "}
            <Link href="/campaigns" className="font-semibold underline underline-offset-2">
              Back to campaigns
            </Link>
            .
          </div>
        </div>
      </main>
    );
  }
  if (!campaign) notFound();

  const [linked, corpus] = await Promise.all([
    getPublishedOpportunityById(campaign.opportunityId),
    listManagedPublishedOpportunities(),
  ]);
  const audience = estimateAudience(corpus, {
    geography: campaign.geography,
    sector: campaign.sector,
    opportunityType: campaign.opportunityType,
  });

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex-1 bg-[var(--background)]"
    >
      <section className="border-b border-[var(--line)] bg-[var(--hero)]">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <Link
            href="/campaigns"
            className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--accent-strong)]"
          >
            ← All campaigns
          </Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            {CAMPAIGN_STATUS_LABELS[campaign.status]} · internal pilot
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-5xl">
            {campaign.name}
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {CAMPAIGN_STATUS_DESCRIPTIONS[campaign.status]}
          </p>
          <div className="mt-5">
            <CampaignStatusControl
              campaignId={campaign.id}
              currentStatus={campaign.status}
              returnTo={`/campaigns/${campaign.id}`}
            />
          </div>
        </div>
      </section>

      <section aria-labelledby="verified-opportunity-heading">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <h2
            id="verified-opportunity-heading"
            className="text-2xl font-semibold text-[var(--foreground)]"
          >
            1 · Verified opportunity
          </h2>
          {linked ? (
            <div className="mt-4 max-w-2xl">
              <OpportunityCard opportunity={linked} returnHref="/campaigns" />
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
              The linked opportunity is no longer published. The campaign stays
              for aggregate learning but cannot be promoted until it links a
              currently published record.
            </p>
          )}
        </div>
      </section>

      <section
        aria-labelledby="relevant-audience-heading"
        className="border-t border-[var(--line)]"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <h2
            id="relevant-audience-heading"
            className="text-2xl font-semibold text-[var(--foreground)]"
          >
            2 · Relevant audience (public corpus)
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Targeting:{" "}
            {[
              campaign.geography ?? "any geography",
              campaign.sector ?? "any sector",
              campaign.opportunityType ?? "any type",
            ].join(" · ")}
            . Sized from published inventory staff can already read — never
            from talent profiles or private activity.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--subtle)]">
                Corpus
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
                {audience.corpusSize}
              </dd>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--subtle)]">
                Matched
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
                {audience.matched}
              </dd>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--subtle)]">
                National
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
                {audience.matchedNational}
              </dd>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
              <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--subtle)]">
                International
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
                {audience.matchedInternational}
              </dd>
            </div>
          </dl>
          {campaign.goalText ? (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Pilot goal: {campaign.goalText}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
