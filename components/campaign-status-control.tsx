"use client";

import { useActionState } from "react";
import {
  changeCampaignStatusAction,
  initialCampaignMutationState,
} from "@/lib/data/provider-campaign-actions";
import {
  CAMPAIGN_STATUSES,
  CAMPAIGN_STATUS_LABELS,
  type CampaignStatus,
} from "@/lib/provider-campaign-state";

export function CampaignStatusControl({
  campaignId,
  currentStatus,
  returnTo,
}: {
  campaignId: string;
  currentStatus: CampaignStatus;
  returnTo: string;
}) {
  const [state, formAction, isPending] = useActionState(
    changeCampaignStatusAction,
    initialCampaignMutationState
  );

  return (
    <div>
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="campaignId" value={campaignId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        <label
          htmlFor={`campaign-status-${campaignId}`}
          className="text-xs font-semibold text-[var(--muted)]"
        >
          Pipeline stage
        </label>
        <select
          id={`campaign-status-${campaignId}`}
          name="intent"
          defaultValue={currentStatus}
          disabled={isPending}
          aria-label="Change campaign pipeline stage"
          className="min-h-11 rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-3 text-sm font-semibold text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {CAMPAIGN_STATUSES.map((status) => (
            <option key={status} value={status}>
              {CAMPAIGN_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[var(--line-strong)] bg-[var(--surface)] px-5 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Working…" : "Update stage"}
        </button>
      </form>
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`mt-2 text-xs leading-5 ${
            state.status === "error"
              ? "text-red-700 dark:text-red-300"
              : "text-[var(--muted)]"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
