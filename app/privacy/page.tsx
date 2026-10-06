import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Tech Opportunity",
  description:
    "How Tech Opportunity collects, uses, stores, and lets you control your personal data.",
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

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          Effective {EFFECTIVE_DATE} · Last updated {EFFECTIVE_DATE}
        </p>

        <Section id="privacy-who" title="Who operates this service">
          <p>
            Tech Opportunity is an early-stage opportunity platform and
            project for Tanzania&rsquo;s emerging talent. It is not presented
            here as an incorporated company, and nothing in this policy
            claims a registration, office, or legal department that does
            not exist.
          </p>
        </Section>

        <Section id="privacy-who-for" title="Who the service is for">
          <p>
            Tech Opportunity is designed for students and opportunity
            seekers, including secondary-school and university students,
            graduates, technology learners and builders, young
            professionals, and general opportunity seekers. Because younger
            students may use the service, we keep data collection minimal,
            collect no date of birth, keep profiles private by default, and
            never make talent activity visible to providers or other users.
          </p>
        </Section>

        <Section id="privacy-collect" title="Data we collect">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-semibold text-[var(--foreground)]">Account identity:</span>{" "}
              your email address and an encrypted password, plus the
              technical session information needed to keep you signed in.
            </li>
            <li>
              <span className="font-semibold text-[var(--foreground)]">Talent profile (all optional):</span>{" "}
              education or career level, field or discipline, sectors of
              interest, preferred opportunity types, skills, region,
              experience level, and goals. You may leave any or all of
              these empty.
            </li>
            <li>
              <span className="font-semibold text-[var(--foreground)]">Saved opportunities</span> and{" "}
              <span className="font-semibold text-[var(--foreground)]">Interested / Applying / Applied states</span>{" "}
              you set, with timestamps.
            </li>
            <li>
              <span className="font-semibold text-[var(--foreground)]">Deadline-reminder preference</span>{" "}
              (on or off) for opportunities you track.
            </li>
            <li>
              <span className="font-semibold text-[var(--foreground)]">Essential session cookies</span>{" "}
              that keep you signed in, one{" "}
              <span className="font-semibold text-[var(--foreground)]">install-prompt dismissal flag</span>{" "}
              stored in your own browser, and a{" "}
              <span className="font-semibold text-[var(--foreground)]">PWA cache</span> of
              static app files for offline use. There are currently no
              analytics or advertising cookies and no third-party tracking
              on this site.
            </li>
            <li>
              <span className="font-semibold text-[var(--foreground)]">Listing reports you send</span>{" "}
              (reason, details, and your account identifier), stored so
              authorized staff can review reported problems. Reports are
              visible only to staff — never to providers or other users —
              and never change a listing automatically. Do not include
              passwords or sensitive personal information in a report.
            </li>
            <li>
              <span className="font-semibold text-[var(--foreground)]">Privacy-safe aggregate counts</span>{" "}
              (for example how many people saved an opportunity) used in
              provider reports. These contain no names, emails, or
              per-user lists.
            </li>
          </ul>
        </Section>

        <Section id="privacy-use" title="Why we use it">
          <ul className="list-disc space-y-2 pl-5">
            <li>Operating your account and keeping it secure.</li>
            <li>Ordering your For You recommendations and explaining each suggestion.</li>
            <li>Keeping your saved list and application progress.</li>
            <li>Sending deadline reminders you explicitly enabled.</li>
            <li>Reporting honest aggregate engagement to opportunity providers.</li>
          </ul>
        </Section>

        <Section id="privacy-not" title="What we do not do">
          <ul className="list-disc space-y-2 pl-5">
            <li>We do not sell private talent data — profiles, saves, and activity are never for sale.</li>
            <li>We do not give providers your raw profile or activity without your explicit consent; reports are aggregate counts only.</li>
            <li>Paid promotion can never bypass human verification.</li>
            <li>We run no advertising tracking or analytics on this site today.</li>
          </ul>
        </Section>

        <Section id="privacy-vendors" title="Third-party services">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <span className="font-semibold text-[var(--foreground)]">Supabase</span> stores
              the database and handles sign-in (account data above).
            </li>
            <li>
              <span className="font-semibold text-[var(--foreground)]">Vercel</span> hosts
              the application (standard hosting logs only).
            </li>
            <li>
              <span className="font-semibold text-[var(--foreground)]">Gemini and Groq</span> are
              AI providers used only in staging and evaluation. Production AI
              is currently OFF, so these providers receive no Production user
              information today. Fonts ship with the application; no font
              provider receives your data when you use the site.
            </li>
          </ul>
        </Section>

        <Section id="privacy-ai" title="AI-assisted features">
          <p>
            Explanations labelled AI-assisted may be enabled separately. They
            help you read verified facts faster and are always subordinate to
            them: deterministic verified information remains authoritative,
            AI never decides eligibility, and AI cannot guarantee selection.
            Only bounded, approved context is ever sent to an AI service —
            opportunity evidence plus selected profile fields. Your identity,
            contact details, activity history, CVs, and documents are never
            sent. AI features never run without you asking (for example by
            tapping an explanation button).
          </p>
        </Section>

        <Section id="privacy-retention" title="Retention">
          <p>
            Your account data is kept while your account exists so the
            product keeps working. There are currently no fixed automatic
            deletion schedules beyond what you control below, and platform
            backups follow the hosting providers&rsquo; own cycles, so
            backup copies cannot be purged instantly on request. Anonymized
            listing reports (content kept, reporter removed) are retained
            for moderation and trust purposes. If fixed retention periods
            are introduced later, this policy will say so.
          </p>
        </Section>

        <Section id="privacy-controls" title="Your controls">
          <ul className="list-disc space-y-2 pl-5">
            <li>Edit or clear any profile field at any time on the Profile page.</li>
            <li>Unsave opportunities and remove or change Interested / Applying / Applied states.</li>
            <li>Turn deadline reminders on or off.</li>
            <li>Sign out on any device to end the session.</li>
            <li>
              Delete your whole account yourself on the Profile page
              (Delete account, confirm by typing DELETE). This permanently
              removes your profile, saved opportunities, application
              activity, and reminder preferences, and signs you out.
              Listing reports you sent stay for moderation with your
              identity removed.
            </li>
            <li>
              Ask for anything else — a copy of your data or a correction —
              through WhatsApp (see Contact below).
            </li>
          </ul>
        </Section>

        <Section id="privacy-security" title="Security">
          <p>
            Accounts are protected with encrypted passwords and
            access-controlled storage: your talent data is readable only by
            you, enforced by database access rules. These are reasonable
            technical safeguards for an early-stage service — not a
            certification, audit, or compliance claim.
          </p>
        </Section>

        <Section id="privacy-updates" title="Policy updates">
          <p>
            If this policy changes materially, the effective date above will
            change with it. Continued use after an update means you accept
            the updated policy.
          </p>
        </Section>

        <Section id="privacy-contact" title="Contact">
          <p>
            For privacy requests, corrections, or deletion — or to report an
            incorrect listing — message us on WhatsApp at{" "}
            <a
              href="https://wa.me/255624295705"
              className="font-semibold text-[var(--accent-strong)] underline underline-offset-2"
            >
              +255 624 295 705
            </a>
            . See also the <Link href="/contact" className="font-semibold text-[var(--accent-strong)] underline underline-offset-2">Contact page</Link>.
          </p>
        </Section>
      </main>
    </div>
  );
}
