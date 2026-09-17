import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CampaignStatusControl } from "@/components/campaign-status-control";
import { OpportunityCard } from "@/components/opportunity-card";
import { getModerationAccess } from "@/lib/data/moderation";
import { getProviderCampaign } from "@/lib/data/provider-campaigns";
import {
  getCampaignAudience,
  getCampaignEngagement,
} from "@/lib/data/campaign-engagement";
import { getPublishedOpportunityById } from "@/lib/data/published-management";
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

  // REAL aggregates from stored talent activity (counts only — individual
  // rows never leave the database). Unavailable only while migration 0020
  // is not yet applied; zero is an honest zero.
  const [linked, engagement, audience] = await Promise.all([
    getPublishedOpportunityById(campaign.opportunityId),
    getCampaignEngagement(access.staff.client, campaign.id),
    getCampaignAudience(access.staff.client, campaign.id),
  ]);

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
            2 · Relevant audience (talent)
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Targeting:{" "}
            {[
              campaign.geography ?? "any geography",
              campaign.sector ?? "any sector",
              campaign.opportunityType ?? "any type",
            ].join(" · ")}
            . Counts core-complete talent profiles whose sector/type focus
            overlaps this targeting — aggregate only, no identities. Geography
            targeting stays descriptive.
          </p>
          {!audience.available ? (
            <p
              role="alert"
              className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
            >
              Audience estimate unavailable (aggregate schema pending).
            </p>
          ) : (
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
                <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--subtle)]">
                  Matching profiles
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
                  {audience.audience}
                </dd>
                <dd className="mt-1 text-xs leading-5 text-[var(--muted)]">
                  {audience.audience === 0
                    ? "No matching profiles yet — 0 is valid until talent complete profiles."
                    : "Aggregate count only — no names, emails, or profile rows."}
                </dd>
              </div>
            </dl>
          )}
          {campaign.goalText ? (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Pilot goal: {campaign.goalText}
            </p>
          ) : null}
        </div>
      </section>

      <section
        aria-labelledby="engagement-heading"
        className="border-t border-[var(--line)]"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <h2
            id="engagement-heading"
            className="text-2xl font-semibold text-[var(--foreground)]"
          >
            3 · Engagement funnel (real activity)
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Saved, Interested, Applying, and Applied counts from real stored
            talent activity for the linked opportunity — aggregate only, no
            identities. A talent may appear in Saved and one funnel stage.
          </p>
          {!engagement.available ? (
            <p
              role="alert"
              className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
            >
              Engagement aggregates unavailable (aggregate schema pending).
            </p>
          ) : (
            <dl className="mt-4 grid gap-3 sm:grid-cols-4">
              {(
                [
                  ["Saved", engagement.engagement.saved],
                  ["Interested", engagement.engagement.interested],
                  ["Applying", engagement.engagement.applying],
                  ["Applied", engagement.engagement.applied],
                ] as const
              ).map(([label, count]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4"
                >
                  <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--subtle)]">
                    {label}
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
                    {count}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>
    </main>
  );
}
