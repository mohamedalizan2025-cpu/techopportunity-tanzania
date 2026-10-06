import type { Metadata } from "next";
import Link from "next/link";
import { UiIcon } from "@/components/ui-icon";

export const metadata: Metadata = {
  title: "For Organizations | Tech Opportunity",
  description:
    "How opportunity providers, universities, hubs and NGOs can reach Tanzanian talent through verified distribution and privacy-safe reporting.",
};

export default function OrganizationsPage() {
  return (
    <main id="main-content" tabIndex={-1} className="flex-1">
      <section className="hero-dark border-b border-black/20">
        <div className="page-shell grid gap-8 py-10 sm:py-14 lg:grid-cols-[0.86fr_1.14fr] lg:items-center">
          <div>
            <p className="eyebrow-gold">For organizations</p>
            <h1 className="hero-title font-display mt-4 max-w-3xl text-[#f7f2e8]">
              Reach talent with opportunities that matter.
            </h1>
            <div className="hero-rule mt-5" aria-hidden="true" />
            <p className="mt-5 max-w-2xl text-base leading-7 hero-muted">
              Tech Opportunity connects verified opportunities with Tanzania’s
              emerging talent — students, graduates, developers and young
              professionals — through human review and evidence-first listings.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/submit"
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-[var(--gold)] px-6 text-sm font-bold text-[#082f2b] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#082f2b]"
              >
                Submit an opportunity
              </Link>
              <Link
                href="/#opportunities"
                className="inline-flex min-h-12 items-center justify-center rounded-md border border-white/25 px-6 text-sm font-semibold text-[#f7f2e8] hover:border-[var(--gold)] hover:text-[var(--gold)]"
              >
                See the public shelf
              </Link>
            </div>
          </div>
          <div
            className="rounded-md border border-white/15 bg-white/5 p-6 sm:p-7"
            aria-label="Sample campaign report with illustrative data"
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--gold)]">
              Sample report · illustrative data, not real results
            </p>
            <h2 className="mt-2 text-lg font-semibold text-[#f7f2e8]">
              What a campaign report looks like
            </h2>
            <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Relevant audience", value: "1,240" },
                { label: "Saved", value: "48" },
                { label: "Interested", value: "12" },
                { label: "Applying", value: "5" },
                { label: "Applied", value: "2" },
              ].map((row) => (
                <div key={row.label} className="rounded-md bg-white/5 px-4 py-3">
                  <dt className="text-xs text-[#c9d4cb]">{row.label}</dt>
                  <dd className="mt-1 text-2xl font-semibold text-[#f7f2e8]">{row.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              <div className="h-full w-3/4 rounded-full bg-[var(--gold)]" />
            </div>
            <p className="mt-4 text-sm leading-6 hero-muted">
              Counts only — no names, emails, or per-user lists. You receive
              aggregate engagement for your call, never personal data.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="providers-heading" className="border-b border-[var(--line)]">
        <div className="page-shell py-10 sm:py-14">
          <p className="eyebrow">For opportunity providers</p>
          <h2 id="providers-heading" className="font-display mt-3 text-2xl font-semibold sm:text-3xl">
            A managed pilot, not a self-service portal.
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Employers, accelerators, NGOs, companies and programme owners can
            put a legitimate open call in front of relevant Tanzanian talent
            through a staff-managed pilot. Provider self-service is not yet
            available.
          </p>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { n: "1", title: "Share the call", body: "You share a legitimate, currently open opportunity." },
              { n: "2", title: "We verify", body: "Human review checks evidence, eligibility and deadlines before anything goes public." },
              { n: "3", title: "Agreed distribution", body: "The listing reaches a relevant audience through agreed channels." },
              { n: "4", title: "Aggregate measurement", body: "Saved, Interested, Applying and Applied are counted — never identified." },
              { n: "5", title: "Simple report", body: "You receive a plain campaign report with counts, not personal data." },
            ].map((step) => (
              <li key={step.n} className="border-t-2 border-[var(--gold)] pt-4">
                <p className="font-display text-2xl font-semibold text-[var(--accent-strong)]">{step.n}</p>
                <h3 className="mt-2 font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-6 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Pilot service — we charge for verification work and delivery, never
            for passing verification. No guaranteed applicant numbers.
          </p>
        </div>
      </section>

      <section aria-labelledby="institutions-heading" className="border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="page-shell py-10 sm:py-14">
          <p className="eyebrow">For universities &amp; hubs</p>
          <h2 id="institutions-heading" className="font-display mt-3 text-2xl font-semibold sm:text-3xl">
            One trusted discovery workflow for your community.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { icon: "source" as const, title: "Curated opportunities", body: "Calls relevant to your students, filtered for evidence and access — not an unfiltered feed." },
              { icon: "globe" as const, title: "Community access", body: "Give every student the same starting point: source, deadline and eligibility evidence, clearly marked." },
              { icon: "clock" as const, title: "Future engagement insight", body: "Aggregate, privacy-safe insight into what your community engages with is the planned next step — not a live product yet." },
            ].map((item) => (
              <div key={item.title} className="rounded-md border border-[var(--line)] bg-[var(--background)] p-5">
                <p className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                  <UiIcon name={item.icon} width="20" height="20" />
                </p>
                <h3 className="mt-3 font-semibold">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Early institutional pilot model. There are no institution
            dashboards, no integrations and no partner claims today — if you
            run a campus or hub community, start by submitting an opportunity
            or browsing the public shelf.
          </p>
        </div>
      </section>

      <section aria-labelledby="privacy-heading">
        <div className="page-shell py-10 sm:py-14">
          <p className="eyebrow">Privacy and trust</p>
          <h2 id="privacy-heading" className="font-display mt-3 text-2xl font-semibold sm:text-3xl">
            Aggregate insight. Never personal data.
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              "Talent profiles are never sold.",
              "Private Saved and Activity data is never exposed — counts only.",
              "Sponsored opportunities still require full verification, and are labeled as sponsored.",
              "Aggregate reporting only — no names, emails, or per-user lists.",
              "No guaranteed applicant numbers, ever.",
            ].map((rule) => (
              <li key={rule} className="flex items-start gap-3 rounded-md border border-[var(--line)] bg-[var(--surface)] p-4 text-sm leading-6">
                <UiIcon name="shield" width="18" height="18" className="mt-0.5 shrink-0 text-[var(--accent-strong)]" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/submit" className="button-primary">
              Submit an opportunity
            </Link>
            <Link href="/#opportunities" className="button-secondary">
              Browse the shelf
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
