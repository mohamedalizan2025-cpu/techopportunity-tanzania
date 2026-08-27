"use client";

import { useActionState } from "react";
import Link from "next/link";
import { decideOpportunityAction } from "@/lib/data/moderation-actions";
import { initialDecisionState } from "@/lib/staff-form-state";

const inputSelectClasses =
  "w-full rounded-lg border border-black/[.10] bg-white px-3 py-2 text-sm text-black outline-none transition-colors focus:border-black/40 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-white/40";

interface OrganizationOption {
  id: string;
  name: string;
}

export function DecisionForm({
  opportunityId,
  organizations,
}: {
  opportunityId: string;
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
    <form action={formAction} className="flex flex-col gap-3">
      {state.status === "error" && state.message !== null ? (
        <p
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {state.message}
        </p>
      ) : null}

      <input type="hidden" name="opportunityId" value={opportunityId} />

      <label className="block text-sm font-medium text-black dark:text-zinc-50">
        Attach organization{" "}
        <span className="font-normal text-zinc-500">(optional — approval only)</span>
        <select
          name="organizationId"
          defaultValue=""
          className={`${inputSelectClasses} mt-1.5`}
        >
          <option value="">No organization (organizer stays unknown)</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-[#ccc]"
        >
          {isPending ? "Working…" : "Approve & publish"}
        </button>
        <button
          type="submit"
          name="decision"
          value="reject"
          disabled={isPending}
          className="inline-flex h-11 items-center justify-center rounded-full border border-black/[.10] bg-white px-6 text-sm font-medium text-zinc-600 transition-colors hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-red-900 dark:hover:text-red-300"
        >
          Reject
        </button>
      </div>

      <p className="text-xs text-zinc-500 dark:text-zinc-500">
        Approving makes this submission immediately visible on the public site.
      </p>
    </form>
  );
}
