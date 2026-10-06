"use client";

import Link from "next/link";
import { useActionState } from "react";
import { submitListingReportAction } from "@/lib/data/listing-report-actions";
import { initialListingReportMutationState } from "@/lib/listing-report-state";
import {
  LISTING_REPORT_REASON_LABELS,
  LISTING_REPORT_REASONS,
} from "@/lib/listing-report-state";
import { UiIcon } from "./ui-icon";

const WHATSAPP_HREF = "https://wa.me/255624295705";

export function ReportOpportunityControl({
  opportunityId,
  isAuthenticated,
  loginHref,
  returnTo,
}: {
  opportunityId: string;
  isAuthenticated: boolean;
  loginHref: string;
  returnTo: string;
}) {
  const [state, formAction, isPending] = useActionState(
    submitListingReportAction,
    initialListingReportMutationState
  );

  return (
    <section
      aria-labelledby="report-problem-heading"
      className="mt-8 rounded-md border border-[var(--line)] bg-[var(--surface)] p-5"
    >
      <h2 id="report-problem-heading" className="text-base font-semibold text-[var(--foreground)]">
        Something wrong with this listing?
      </h2>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
        Reports go to human review. Reporting never changes a listing
        automatically.
      </p>
      {!isAuthenticated ? (
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href={loginHref} className="button-secondary">
            Sign in to report a problem
          </Link>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--accent-strong)] underline-offset-2 hover:underline"
          >
            Contact us on WhatsApp
          </a>
        </div>
      ) : state.sent ? (
        <p role="status" className="mt-3 text-sm font-semibold text-[var(--accent-strong)]">
          {state.message ?? "Thanks. Your report was sent for review."}
        </p>
      ) : (
        <details className="mt-3">
          <summary className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-[var(--accent-strong)] underline-offset-4 hover:underline">
            <UiIcon name="info" width="16" height="16" />
            Report a problem
          </summary>
          <form action={formAction} className="mt-3 flex flex-col gap-4">
            <input type="hidden" name="opportunityId" value={opportunityId} />
            <input type="hidden" name="returnTo" value={returnTo} />
            <div>
              <label
                htmlFor="report-reason"
                className="block text-sm font-semibold text-[var(--foreground)]"
              >
                Reason
              </label>
              <select
                id="report-reason"
                name="reason"
                required
                defaultValue=""
                className="auth-input"
              >
                <option value="" disabled>
                  Choose a reason
                </option>
                {LISTING_REPORT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {LISTING_REPORT_REASON_LABELS[reason]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="report-details"
                className="block text-sm font-semibold text-[var(--foreground)]"
              >
                Details
              </label>
              <textarea
                id="report-details"
                name="details"
                rows={3}
                required
                minLength={4}
                maxLength={1000}
                placeholder="What is wrong? Keep it brief and factual."
                className="auth-input"
              />
              <p className="mt-1.5 text-xs leading-5 text-[var(--subtle)]">
                Do not include passwords or sensitive personal information.
              </p>
            </div>
            {state.status === "error" && state.message ? (
              <p role="alert" className="text-sm text-red-700 dark:text-red-300">
                {state.message}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={isPending}
              className="button-secondary w-fit disabled:opacity-60"
            >
              {isPending ? "Sending…" : "Send report for review"}
            </button>
          </form>
        </details>
      )}
    </section>
  );
}
