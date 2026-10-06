"use client";

import { useActionState } from "react";
import { triageListingReportAction } from "@/lib/data/listing-report-actions";
import { initialTriageMutationState } from "@/lib/listing-report-state";
import {
  LISTING_REPORT_STATUS_LABELS,
  LISTING_REPORT_TRIAGE_STATUSES,
} from "@/lib/listing-report-state";

export function ReportTriageForm({ reportId }: { reportId: string }) {
  const [state, formAction, isPending] = useActionState(
    triageListingReportAction,
    initialTriageMutationState
  );

  return (
    <form action={formAction} className="mt-3 flex flex-col gap-2">
      <input type="hidden" name="reportId" value={reportId} />
      <label
        htmlFor={`resolution-note-${reportId}`}
        className="text-xs font-semibold text-[var(--muted)]"
      >
        Resolution note (optional, 500 characters or fewer)
      </label>
      <input
        id={`resolution-note-${reportId}`}
        name="resolutionNote"
        type="text"
        maxLength={500}
        placeholder="What did you check or decide?"
        className="auth-input"
      />
      <div className="flex flex-wrap gap-2">
        {LISTING_REPORT_TRIAGE_STATUSES.map((status) => (
          <button
            key={status}
            type="submit"
            name="status"
            value={status}
            disabled={isPending}
            className="button-secondary min-h-11 px-4 py-2 text-xs disabled:opacity-60"
          >
            {isPending ? "Working…" : `Mark ${LISTING_REPORT_STATUS_LABELS[status].toLowerCase()}`}
          </button>
        ))}
      </div>
      {state.status !== "idle" && state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className="text-xs text-red-700 dark:text-red-300"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
