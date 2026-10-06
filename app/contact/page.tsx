import type { Metadata } from "next";
import Link from "next/link";
import { UiIcon } from "@/components/ui-icon";

export const metadata: Metadata = {
  title: "Contact | Tech Opportunity",
  description:
    "Reach Tech Opportunity for support, privacy requests, listing corrections, or provider enquiries.",
};

const WHATSAPP_HREF = "https://wa.me/255624295705";
const WHATSAPP_LABEL = "+255 624 295 705";

const CATEGORIES: Array<{ title: string; body: string }> = [
  { title: "General support", body: "Using the site, accounts, saved lists, or application tracking." },
  { title: "Privacy or data request", body: "A copy of your data, a correction, or deletion of your account and data." },
  { title: "Incorrect opportunity information", body: "Anything on a listing that looks wrong or outdated." },
  { title: "Deadline correction", body: "A closing date that has changed or passed." },
  { title: "Eligibility concern", body: "Questions about who can apply, including Tanzania access." },
  { title: "Suspicious or fraudulent listing", body: "Anything that looks like a scam or impersonation — include the listing title." },
  { title: "Provider or organization enquiry", body: "Submitting an opportunity, distribution, or institutional use." },
];

export default function ContactPage() {
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
          Contact us
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
          Message us on WhatsApp for support, privacy requests, listing
          corrections, or provider enquiries. Structured in-product
          reporting is coming separately — for now, a message with the
          listing title gets a human review.
        </p>

        <div className="mt-6 rounded-md border border-[var(--line)] bg-[var(--surface)] p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--subtle)]">
            WhatsApp
          </p>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Chat with Tech Opportunity on WhatsApp at ${WHATSAPP_LABEL}`}
            className="button-primary mt-3 w-full sm:w-auto"
          >
            Chat on WhatsApp · {WHATSAPP_LABEL}
          </a>
          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
            Opens WhatsApp in a new tab. We are a small early-stage team —
            there is no ticket system, no response-time promise, and no
            24/7 support line.
          </p>
        </div>

        <section aria-labelledby="contact-categories" className="mt-8">
          <h2 id="contact-categories" className="text-xl font-semibold tracking-tight text-[var(--foreground)]">
            What you can message about
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {CATEGORIES.map((item) => (
              <li key={item.title} className="rounded-md border border-[var(--line)] bg-[var(--surface)] p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
                  <UiIcon name="info" width="16" height="16" className="shrink-0 text-[var(--accent-strong)]" aria-hidden="true" />
                  {item.title}
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-8 text-sm leading-6 text-[var(--muted)]">
          Prefer reading first? See the{" "}
          <Link href="/privacy" className="font-semibold text-[var(--accent-strong)] underline underline-offset-2">Privacy Policy</Link>{" "}
          and{" "}
          <Link href="/terms" className="font-semibold text-[var(--accent-strong)] underline underline-offset-2">Terms of Use</Link>.
        </p>
      </main>
    </div>
  );
}
