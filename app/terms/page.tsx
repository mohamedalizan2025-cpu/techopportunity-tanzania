import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use | Tech Opportunity",
  description:
    "The rules for using Tech Opportunity: sources stay authoritative, no selection guarantees, acceptable use.",
};

const EFFECTIVE_DATE = "6 October 2026";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2 id={id} className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-[var(--muted)]">{children}</div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="flex flex-1 flex-col items-center bg-[var(--background)] px-5 font-sans sm:px-8">
      <main
        id="main-content"
        tabIndex={-1}
        className="w-full max-w-3xl flex-1 py-8 sm:py-12"
      >
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
          Trust
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">
          Terms of Use
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Effective {EFFECTIVE_DATE} · Last updated {EFFECTIVE_DATE}
        </p>

        <Section id="terms-service" title="The service">
          <p>
            Tech Opportunity is an early-stage educational and career
            opportunity platform for students — including secondary and
            high-school students — graduates, technology learners, young
            professionals, and general opportunity seekers. It helps you
            discover opportunities, check their evidence, prioritize them,
            and track your own application progress.
          </p>
        </Section>

        <Section id="terms-account" title="Your account">
          <p>
            You are responsible for keeping your sign-in details private and
            for activity under your account. One account per person; do not
            share accounts or pretend to be someone else. If you believe
            your account is compromised, reset your password and contact us
            (see <Link href="/contact" className="font-semibold text-[var(--accent-strong)] underline underline-offset-2">Contact</Link>).
          </p>
        </Section>

        <Section id="terms-acceptable" title="Acceptable use">
          <ul className="list-disc space-y-2 pl-5">
            <li>Use the service for genuine opportunity discovery and application tracking.</li>
            <li>Do not submit false, misleading, or fraudulent opportunities.</li>
            <li>Do not attempt to access other users&rsquo; private data, interfere with the service, or abuse reporting and contact channels.</li>
            <li>Do not scrape, bulk-copy, or resell platform content.</li>
          </ul>
        </Section>

        <Section id="terms-accuracy" title="Information accuracy and the official source">
          <ul className="list-disc space-y-2 pl-5">
            <li>Opportunity information, deadlines, and eligibility requirements may change after publication.</li>
            <li>The official opportunity source linked from each listing remains authoritative — always verify final requirements there before applying.</li>
            <li>Human review reduces risk but is not a guarantee of permanent accuracy.</li>
            <li>Where evidence is unknown, we say so; an unknown is not an approval.</li>
          </ul>
        </Section>

        <Section id="terms-no-guarantee" title="No guarantees">
          <p>
            Tech Opportunity does not control third-party application
            websites and does not guarantee admission, employment, funding,
            or selection for any opportunity. AI-assisted explanations help
            you read verified facts; they never decide eligibility and never
            predict your chances.
          </p>
        </Section>

        <Section id="terms-links" title="External links">
          <p>
            Listings link to external application and source websites that
            we do not operate. Their content, availability, and privacy
            practices are their owners&rsquo; responsibility.
          </p>
        </Section>

        <Section id="terms-providers" title="Provider submissions">
          <p>
            Providers, universities, hubs, NGOs, and other organizations may
            submit legitimate, currently open opportunities for human review.
            Misleading or fraudulent submissions are prohibited, paid
            promotion can never buy approval, and publication always
            requires human review. Aggregate engagement reporting never
            exposes private talent data.
          </p>
        </Section>

        <Section id="terms-ip" title="Content">
          <p>
            Opportunity content remains owned by its original publishers and
            is shown with source attribution. The platform&rsquo;s own text,
            design, and code remain ours. By submitting an opportunity you
            confirm it is legitimate and that you accept it being displayed
            with its source evidence.
          </p>
        </Section>

        <Section id="terms-enforcement" title="Misuse and access">
          <p>
            Misuse or abuse — including fraudulent submissions, scraping, or
            attempts to access others&rsquo; private data — may lead to
            restricted or terminated access. Serious abuse may be reported
            to the relevant platform or authority.
          </p>
        </Section>

        <Section id="terms-availability" title="Availability and changes">
          <p>
            As an early-stage service, Tech Opportunity may change, pause
            features, or occasionally be unavailable. We aim to keep
            published opportunity information accurate and the service
            dependable, but provide it as-is without service-level promises.
          </p>
        </Section>

        <Section id="terms-contact" title="Questions">
          <p>
            Message us on WhatsApp at{" "}
            <a
              href="https://wa.me/255624295705"
              className="font-semibold text-[var(--accent-strong)] underline underline-offset-2"
            >
              +255 624 295 705
            </a>
            . Our <Link href="/privacy" className="font-semibold text-[var(--accent-strong)] underline underline-offset-2">Privacy Policy</Link> explains
            how your data is handled.
          </p>
        </Section>
      </main>
    </div>
  );
}
