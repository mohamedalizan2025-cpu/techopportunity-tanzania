"use client";

import Link from "next/link";
import { useActionState } from "react";
import { decideOpportunityAction } from "@/lib/data/moderation-actions";
import {
  APPROVE_CONFIRM_TOKEN,
  initialDecisionState,
} from "@/lib/staff-form-state";

export function QuickApproveForm({
  opportunityId,
  fields,
  ready,
}: {
  opportunityId: string;
  fields: Record<string, string>;
  ready: boolean;
}) {
  const [state, formAction, isPending] = useActionState(
    decideOpportunityAction,
    initialDecisionState
  );

  if (state.status === "success") {
    return (
      <div className="flex shrink-0 flex-col items-end gap-1 text-right">
        <p className="text-sm font-medium text-[var(--foreground)]">
          Approved — published.
        </p>
        {state.decidedSlug ? (
          <Link
            href={`/opportunities/${state.decidedSlug}`}
            className="text-xs font-medium underline underline-offset-2 text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            View public page ↗
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex shrink-0 flex-col items-end gap-2">
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <input type="hidden" name="decision" value="approve" />
      <input type="hidden" name="confirm" value={APPROVE_CONFIRM_TOKEN} />
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--accent)] px-6 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? "Working…"
          : ready
            ? "Approve & Publish"
            : "Approve with current info"}
      </button>
      <p className="max-w-[240px] text-right text-[11px] leading-4 text-[var(--muted)]">
        Publishes the stored values. Missing evidence stays unknown.
      </p>
      {state.status === "error" && state.message !== null ? (
        <p
          role="alert"
          className="max-w-[240px] text-right text-xs leading-5 text-red-700 dark:text-red-300"
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
