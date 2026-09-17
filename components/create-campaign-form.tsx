"use client";

import { useActionState } from "react";
import {
  createProviderCampaignAction,
  initialCampaignMutationState,
} from "@/lib/data/provider-campaign-actions";
import { SECTORS, SECTOR_LABELS } from "@/lib/taxonomy";
import { OPPORTUNITY_CATEGORIES } from "@/lib/types";
import { categoryLabel } from "@/lib/category-labels";

export function CreateCampaignForm({
  opportunities,
}: {
  opportunities: Array<{ id: string; title: string }>;
}) {
  const [state, formAction, isPending] = useActionState(
    createProviderCampaignAction,
    initialCampaignMutationState
  );

  return (
    <form
      action={formAction}
      className="mt-6 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6"
    >
      <h2 className="text-lg font-semibold text-[var(--foreground)]">
        New pilot campaign
      </h2>
      <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
        Links one published opportunity to targeting notes. Internal only —
        nothing here is shown to talent or providers.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-semibold text-[var(--foreground)]">
            Campaign name
          </span>
          <input
            name="name"
            required
            minLength={3}
            maxLength={120}
            disabled={isPending}
            placeholder="National AI fellowships push"
            className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
          />
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-[var(--foreground)]">
            Verified opportunity
          </span>
          <select
            name="opportunityId"
            required
            disabled={isPending || opportunities.length === 0}
            className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
          >
            <option value="">
              {opportunities.length === 0
                ? "No published opportunities"
                : "Choose a published opportunity"}
            </option>
            {opportunities.map((opportunity) => (
              <option key={opportunity.id} value={opportunity.id}>
                {opportunity.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-[var(--foreground)]">
            Audience geography (optional)
          </span>
          <select
            name="geography"
            disabled={isPending}
            defaultValue=""
            className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
          >
            <option value="">No geography focus</option>
            <option value="national">National</option>
            <option value="international">International</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-[var(--foreground)]">
            Audience sector (optional)
          </span>
          <select
            name="sector"
            disabled={isPending}
            defaultValue=""
            className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
          >
            <option value="">No sector focus</option>
            {SECTORS.map((sector) => (
              <option key={sector} value={sector}>
                {SECTOR_LABELS[sector]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-[var(--foreground)]">
            Opportunity type (optional)
          </span>
          <select
            name="opportunityType"
            disabled={isPending}
            defaultValue=""
            className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
          >
            <option value="">No type focus</option>
            {OPPORTUNITY_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {categoryLabel(category)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-semibold text-[var(--foreground)]">
            Goal (optional)
          </span>
          <input
            name="goal"
            maxLength={500}
            disabled={isPending}
            placeholder="What should this pilot learn?"
            className="mt-1 min-h-11 w-full rounded-lg border border-[var(--line-strong)] bg-[var(--background)] px-3 text-sm text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:opacity-60"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Creating…" : "Create campaign"}
      </button>
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`mt-3 text-sm leading-6 ${
            state.status === "error"
              ? "text-red-700 dark:text-red-300"
              : "text-[var(--muted)]"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
