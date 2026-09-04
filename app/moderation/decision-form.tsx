"use client";

import { useActionState } from "react";
import Link from "next/link";
import { decideOpportunityAction } from "@/lib/data/moderation-actions";
import type { ModerationCategoryOption } from "@/lib/data/moderation";
import { initialDecisionState } from "@/lib/staff-form-state";
import {
  TANZANIA_MAINLAND_REGIONS,
  TANZANIA_ZANZIBAR_REGIONS,
} from "@/lib/tanzania-regions";
import type { Opportunity } from "@/lib/types";

interface OrganizationOption {
  id: string;
  name: string;
}

const selectClasses =
  "w-full rounded-lg border border-black/[.10] bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black/40 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-white/40";
const inputClasses = selectClasses;
const labelClasses = "block text-sm font-medium text-black dark:text-zinc-50";

// Known-vs-unknown hints: a prefilled value was discovered automatically
// (still worth a glance); an empty value is UNKNOWN and must only be filled
// from the official page. Never inferred by the UI.
const KNOWN_HINT_CLASSES =
  "ml-2 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium normal-case text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
const UNKNOWN_HINT_CLASSES =
  "ml-2 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium normal-case text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200";

function KnownHint({ hasValue }: { hasValue: boolean }) {
  return hasValue ? (
    <span className={KNOWN_HINT_CLASSES}>known from source — verify</span>
  ) : (
    <span className={UNKNOWN_HINT_CLASSES}>unknown — check official page</span>
  );
}

function TextField({
  label,
  name,
  defaultValue,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
}) {
  return (
    <label className={labelClasses}>
      {label}
      <KnownHint hasValue={defaultValue !== ""} />
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        maxLength={name === "url" ? 500 : 300}
        className={`${inputClasses} mt-1.5`}
      />
    </label>
  );
}

export function DecisionForm({
  opportunity,
  organizations,
  nextHref,
  queueHref,
  categoryOptions,
}: {
  opportunity: Opportunity;
  organizations: OrganizationOption[];
  /** Pre-built next-record href from the server (carries the active queue
   *  filter so the reviewer stays inside the batch). Null at queue end. */
  nextHref: string | null;
  /** Queue href preserving the active filter. */
  queueHref: string;
  categoryOptions: ModerationCategoryOption[];
}) {
  const [state, formAction, isPending] = useActionState(
    decideOpportunityAction,
    initialDecisionState
  );

  if (state.status === "success") {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-black/[.08] bg-white p-6 dark:border-white/[.145] dark:bg-zinc-950">
        <p className="text-sm font-medium text-black dark:text-zinc-50">
          {state.decision === "approve" ? "✅ Approved" : "⛔ Rejected"} —{" "}
          <span className="font-normal text-zinc-600 dark:text-zinc-400">
            {state.message}
          </span>
        </p>
        <div className="flex flex-wrap gap-3">
          {nextHref ? (
            <Link
              href={nextHref}
              autoFocus
              className="inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Review next in queue → (Enter)
            </Link>
          ) : null}
          <Link
            href={queueHref}
            className={
              nextHref
                ? "inline-flex h-10 items-center rounded-full border border-black/[.10] bg-white px-5 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
                : "inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            }
          >
            Back to queue
          </Link>
          {state.decision === "approve" && state.decidedSlug ? (
            <Link
              href={`/opportunities/${state.decidedSlug}`}
              className="inline-flex h-10 items-center rounded-full border border-black/[.10] bg-white px-5 text-sm font-medium text-zinc-600 transition-colors hover:text-black dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              View public page ↗
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <form id="decision-form" action={formAction} className="flex flex-col gap-5">
      {state.status === "error" && state.message !== null ? (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.message}
        </p>
      ) : null}

      <input type="hidden" name="opportunityId" value={opportunity.id} />

      <fieldset className="flex flex-col gap-3 rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Opportunity
        </legend>
        <label className={labelClasses}>
          Title
          <KnownHint hasValue={true} />
          <input
            type="text"
            name="title"
            defaultValue={opportunity.title}
            maxLength={200}
            required
            className={`${inputClasses} mt-1.5`}
          />
        </label>
        <label className={labelClasses}>
          Category
          <KnownHint hasValue={true} />
          <select name="category" defaultValue={opportunity.category} className={`${selectClasses} mt-1.5`}>
            {categoryOptions.map((option) => (
              <option key={option.slug} value={option.slug}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClasses}>
          Description
          <KnownHint hasValue={opportunity.description.trim() !== ""} />
          <textarea
            name="description"
            defaultValue={opportunity.description}
            rows={6}
            maxLength={10000}
            required
            className={`${inputClasses} mt-1.5`}
          />
        </label>
        <label className={labelClasses}>
          Official URL
          <KnownHint hasValue={true} />
          <input
            type="url"
            name="url"
            defaultValue={opportunity.url}
            maxLength={500}
            required
            className={`${inputClasses} mt-1.5`}
          />
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Organizer
        </legend>
        <label className={labelClasses}>
          Organization{" "}
          <span className="font-normal text-zinc-500">(only when verified)</span>
          <KnownHint hasValue={opportunity.organizationId != null} />
          <select
            name="organizationId"
            defaultValue={opportunity.organizationId ?? ""}
            className={`${selectClasses} mt-1.5`}
          >
            <option value="">No organization (organizer stays unknown)</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Location — only what the official source confirms
        </legend>
        <TextField label="Venue" name="venue_name" defaultValue={opportunity.location?.venueName ?? ""} />
        <TextField label="Address" name="address" defaultValue={opportunity.location?.address ?? ""} />
        <TextField label="City" name="city" defaultValue={opportunity.location?.city ?? ""} />
        <TextField
          label="Country (worldwide — leave empty when unverified)"
          name="country"
          defaultValue={opportunity.trust?.countryVerification === "unknown" ? "" : opportunity.location?.country ?? ""}
        />
        <label className={labelClasses}>
          Country verification
          <select
            name="country_verification"
            defaultValue={opportunity.trust?.countryVerification ?? "unknown"}
            className={`${selectClasses} mt-1.5`}
          >
            <option value="unknown">Unknown — do not use country as evidence</option>
            <option value="verified_tanzania">Verified Tanzania</option>
            <option value="verified_other">Verified other geography</option>
          </select>
        </label>
        <TextField
          label="Country evidence"
          name="country_evidence"
          defaultValue={opportunity.trust?.countryEvidence ?? ""}
        />
        <label className={labelClasses}>
          Region
          <KnownHint hasValue={(opportunity.location?.region ?? "") !== ""} />
          <select
            name="region"
            defaultValue={opportunity.location?.region ?? ""}
            className={`${selectClasses} mt-1.5`}
          >
            <option value="">Not specified</option>
            <optgroup label="Mainland Tanzania">
              {TANZANIA_MAINLAND_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </optgroup>
            <optgroup label="Zanzibar">
              {TANZANIA_ZANZIBAR_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </optgroup>
          </select>
        </label>
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Deadline
        </legend>
        <TextField
          label="Application deadline"
          name="deadline"
          type="date"
          defaultValue={opportunity.deadline ? opportunity.deadline.slice(0, 10) : ""}
        />
        <label className={labelClasses}>
          Deadline precision
          <select
            name="deadline_precision"
            defaultValue={opportunity.deadline ? "date" : opportunity.deadlinePrecision === "rolling" ? "rolling" : "unknown"}
            className={`${selectClasses} mt-1.5`}
          >
            <option value="unknown">Unknown</option>
            <option value="date">Date from source</option>
            <option value="rolling">Rolling / no fixed deadline</option>
          </select>
        </label>
        <TextField
          label="Deadline evidence"
          name="deadline_evidence"
          defaultValue={opportunity.deadlineEvidence ?? ""}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Publication trust gate
        </legend>
        <TextField
          label="Why this is a technology/research opportunity"
          name="relevance_evidence"
          defaultValue={opportunity.trust?.relevanceEvidence ?? ""}
        />
        <label className={labelClasses}>
          Tanzanian eligibility
          <select
            name="eligibility"
            defaultValue={opportunity.trust?.eligibilityDecision ?? "unknown"}
            className={`${selectClasses} mt-1.5`}
          >
            <option value="unknown">Unknown — cannot approve</option>
            <option value="tanzanians_eligible">Verified: Tanzanians may apply</option>
            <option value="tanzanians_not_eligible">Rejected: Tanzanians may not apply</option>
          </select>
        </label>
        <TextField
          label="Exact eligibility evidence"
          name="eligibility_evidence"
          defaultValue={opportunity.trust?.eligibilityEvidence ?? ""}
        />
      </fieldset>

      {/* Decision controls stay reachable at the bottom of long records;
          they submit the same form (no duplicated state). */}
      <div className="sticky bottom-0 -mx-6 mt-2 flex flex-wrap gap-3 border-t border-black/[.08] bg-zinc-50 px-6 py-4 dark:border-white/[.145] dark:bg-black">
        <button
          type="submit"
          form="decision-form"
          name="decision"
          value="approve"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#ccc]"
        >
          {isPending ? "Working…" : "Save review & approve"}
        </button>
        <button
          type="submit"
          form="decision-form"
          name="decision"
          value="reject"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-full border border-black/[.10] bg-white px-6 text-sm font-medium text-zinc-600 transition-colors hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-red-900 dark:hover:text-red-300"
        >
          Reject (keeps record as discovered)
        </button>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        Corrections are saved only when approving. Rejecting keeps the record
        exactly as discovered. Leave a field empty when the official source
        does not confirm it — unknown stays unknown.
      </p>
    </form>
  );
}
