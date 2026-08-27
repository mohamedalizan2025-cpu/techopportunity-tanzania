"use client";

import { useActionState } from "react";
import Link from "next/link";
import { decideOpportunityAction } from "@/lib/data/moderation-actions";
import { initialDecisionState } from "@/lib/staff-form-state";
import {
  TANZANIA_MAINLAND_REGIONS,
  TANZANIA_ZANZIBAR_REGIONS,
} from "@/lib/tanzania-regions";
import { OPPORTUNITY_CATEGORIES, type Opportunity } from "@/lib/types";

interface OrganizationOption {
  id: string;
  name: string;
}

const selectClasses =
  "w-full rounded-lg border border-black/[.10] bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black/40 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-white/40";
const inputClasses = selectClasses;
const labelClasses = "block text-sm font-medium text-black dark:text-zinc-50";

function TextField({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className={labelClasses}>
      {label}
      {required ? null : <span className="ml-1 font-normal text-zinc-500">(optional)</span>}
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
}: {
  opportunity: Opportunity;
  organizations: OrganizationOption[];
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
          <Link
            href="/moderation"
            className="inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
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
    <form action={formAction} className="flex flex-col gap-5">
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
          <select name="category" defaultValue={opportunity.category} className={`${selectClasses} mt-1.5`}>
            {OPPORTUNITY_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClasses}>
          Description
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
        <label className={labelClasses}>
          Region
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
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#ccc]"
        >
          {isPending ? "Working…" : "Save review & approve"}
        </button>
        <button
          type="submit"
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
