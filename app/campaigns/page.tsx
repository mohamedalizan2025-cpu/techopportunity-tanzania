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
} from "@/lib/provider-campaign-state";
import { logOutAction } from "@/lib/data/auth-actions";
import { StaffNav } from "@/components/staff-nav";

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
      <StaffNav />
      <section className="hero-dark border-b border-black/20">
        <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
          <div>
          <p className="eyebrow-gold">
            Provider campaigns · internal pilot
          </p>
          <h1 className="font-display mt-3 text-3xl font-semibold text-[#f7f2e8] sm:text-4xl">
            Campaign intelligence
          </h1>
          <div className="hero-rule mt-4" aria-hidden="true" />
          <p className="mt-4 max-w-2xl text-base leading-7 hero-muted">
            Manage verified opportunity campaigns and review privacy-safe
            engagement. Verified Opportunity → Relevant Audience →
            Engagement Funnel — on public corpus data only. No talent profile,
            bookmark, activity, or alert data is read or shown here.
          </p>
          <p className="mt-3 text-sm">
            <Link
              href="/organizations"
              className="font-medium hero-muted underline underline-offset-2 hover:text-[var(--gold)]"
            >
              Public provider &amp; institution story →
            </Link>
          </p>
          </div>
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
              className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-6 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
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
                    ["draft", funnel.draft, "var(--subtle)", "Ideas not yet running."],
                    ["active", funnel.active, "var(--primary)", "Live and collecting engagement."],
                    ["paused", funnel.paused, "#b45309", "On hold; counts frozen."],
                    ["completed", funnel.completed, "var(--gold)", "Finished; read the report."],
                  ] as const
                ).map(([status, count, accent, descriptor]) => (
                  <div
                    key={status}
                    className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-4"
                    style={{ borderTop: `3px solid ${accent}` }}
                  >
                    <dt className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--subtle)]">
                      {CAMPAIGN_STATUS_LABELS[status]}
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-[var(--foreground)]">
                      {count}
                    </dd>
                    <dd className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      {descriptor}
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
                  {campaigns.campaigns.map((campaign) => {
                    const linkedTitle = published.find(
                      (opportunity) => opportunity.id === campaign.opportunityId
                    )?.title;
                    return (
                    <li
                      key={campaign.id}
                      className={`rounded-md border bg-[var(--surface)] p-5 transition hover:border-[var(--line-strong)] ${
                        campaign.status === "active"
                          ? "border-l-4 border-l-[var(--primary)] border-[var(--line)]"
                          : "border-[var(--line)]"
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary-text)]">
                        {CAMPAIGN_STATUS_LABELS[campaign.status]}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-[var(--foreground)]">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="hover:text-[var(--primary-text)]"
                        >
                          {campaign.name}
                        </Link>
                      </h3>
                      {linkedTitle ? (
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Linked opportunity: {linkedTitle}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-[var(--subtle)]">
                        {[
                          campaign.geography ?? "any geography",
                          campaign.sector ?? "any sector",
                          campaign.opportunityType ?? "any type",
                        ].join(" · ")}
                      </p>
                      <p className="mt-3">
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--primary-text)] underline-offset-4 hover:underline"
                        >
                          View campaign →
                        </Link>
                      </p>
                    </li>
                    );
                  })}
                </ul>
              )}
              <div className="mt-8 rounded-md border border-[var(--line-strong)] bg-[var(--primary-soft)] p-5 text-sm leading-6 text-[var(--primary-deep)]">
                <p className="font-semibold">Aggregate only.</p>
                <p className="mt-1">
                  No private talent profile or activity data is exposed —
                  counts only, never names, emails, or per-user lists.
                </p>
              </div>
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
