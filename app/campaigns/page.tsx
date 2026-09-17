import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateCampaignForm } from "@/components/create-campaign-form";
import { getModerationAccess } from "@/lib/data/moderation";
import { listProviderCampaigns } from "@/lib/data/provider-campaigns";
import { listManagedPublishedOpportunities } from "@/lib/data/published-management";
import { summarizeFunnel } from "@/lib/campaign-analytics";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_DESCRIPTIONS,
} from "@/lib/provider-campaign-state";
import { logOutAction } from "@/lib/data/auth-actions";

export const metadata: Metadata = {
  title: "Provider Campaign Pilot · TechOpportunity Tanzania",
  description: "Internal staff-only campaign pilot with aggregate analytics.",
  robots: { index: false, follow: false },
};

const signOutButtonClasses =
  "inline-flex h-9 items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)]";

export default async function CampaignPilotPage() {
  const access = await getModerationAccess();

  if (!access.ok) {
    if (access.reason === "unauthenticated") {
      redirect("/login?next=%2Fcampaigns");
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

  const [campaigns, published] = await Promise.all([
    listProviderCampaigns(access.staff.client),
    listManagedPublishedOpportunities(),
  ]);
  const funnel = summarizeFunnel(campaigns.campaigns);

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="flex-1 bg-[var(--background)]"
    >
      <section className="border-b border-[var(--line)] bg-[var(--hero)]">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            Internal pilot · staff only
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--foreground)] sm:text-5xl">
            Provider Campaign Pilot
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Rehearse the commercial story — Verified Opportunity → Relevant
            Audience → Engagement Funnel — on public corpus data only. No
            talent profile, bookmark, activity, or alert data is read or shown
            here.
          </p>
        </div>
      </section>

      <section aria-labelledby="funnel-heading">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <h2
            id="funnel-heading"
            className="text-2xl font-semibold text-[var(--foreground)]"
          >
            Engagement funnel (aggregate)
          </h2>
          {!campaigns.available ? (
            <div
              role="alert"
              className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
            >
              Campaigns are temporarily unavailable (schema pending). Public
              browsing and moderation are unaffected.
            </div>
          ) : (
            <>
              <p role="status" className="mt-2 text-sm text-[var(--muted)]">
                {funnel.total}{" "}
                {funnel.total === 1 ? "campaign" : "campaigns"} in the pilot
                pipeline
              </p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-4">
                {(
                  [
                    ["draft", funnel.draft],
                    ["active", funnel.active],
                    ["paused", funnel.paused],
                    ["completed", funnel.completed],
                  ] as const
                ).map(([status, count]) => (
                  <div
                    key={status}
                    className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4"
                  >
                    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--subtle)]">
                      {CAMPAIGN_STATUS_LABELS[status]}
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
                      {count}
                    </dd>
                    <dd className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      {CAMPAIGN_STATUS_DESCRIPTIONS[status]}
                    </dd>
                  </div>
                ))}
              </dl>
              {campaigns.campaigns.length === 0 ? (
                <p className="mt-6 text-sm leading-6 text-[var(--muted)]">
                  No campaigns yet. Create the first one below to start the
                  pilot.
                </p>
              ) : (
                <ul className="mt-6 grid gap-4 md:grid-cols-2">
                  {campaigns.campaigns.map((campaign) => (
                    <li
                      key={campaign.id}
                      className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5"
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--accent-strong)]">
                        {CAMPAIGN_STATUS_LABELS[campaign.status]}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="hover:text-[var(--accent-strong)]"
                        >
                          {campaign.name}
                        </Link>
                      </h3>
                      <p className="mt-1 text-xs text-[var(--subtle)]">
                        {[
                          campaign.geography ?? "any geography",
                          campaign.sector ?? "any sector",
                          campaign.opportunityType ?? "any type",
                        ].join(" · ")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
          <CreateCampaignForm
            opportunities={published.map((opportunity) => ({
              id: opportunity.id,
              title: opportunity.title,
            }))}
          />
        </div>
      </section>
    </main>
  );
}
