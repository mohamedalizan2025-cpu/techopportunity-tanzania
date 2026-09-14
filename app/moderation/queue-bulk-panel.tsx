"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { bulkRejectPendingAction } from "@/lib/data/moderation-actions";
import {
  BULK_REJECT_CONFIRM_TOKEN,
  BULK_REJECT_MAX_ITEMS,
  MODERATION_REASON_MAX_LENGTH,
  MODERATION_REASON_MIN_LENGTH,
  initialBulkRejectState,
} from "@/lib/staff-form-state";

export interface BulkQueueItem {
  id: string;
  title: string;
  flagged: boolean;
}

const panelClasses =
  "mt-8 rounded-lg border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-950";
const ghostButtonClasses =
  "inline-flex h-9 items-center rounded-full border border-black/[.10] bg-white px-4 text-sm font-medium text-zinc-600 transition-colors hover:text-black disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50";
const dangerButtonClasses =
  "inline-flex h-9 items-center rounded-full border border-red-300 bg-white px-4 text-sm font-medium text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:bg-zinc-950 dark:text-red-300 dark:hover:bg-red-950/40";
const checkboxClasses = "h-4 w-4 shrink-0 accent-black dark:accent-zinc-50";

/**
 * Bulk pending-rejection panel (Bulk Moderator Actions milestone).
 *
 * Selection, search narrowing, and the flagged filter all live in the
 * server-rendered queue; this component only tracks which VISIBLE rows are
 * checked and submits them to `bulkRejectPendingAction`. Every record still
 * travels the exact single-record attributable RPC, so each keeps its own
 * Moderator attribution, timestamp, reason, and audit row. There is
 * deliberately no bulk approve: approval demands per-record M31 evidence.
 */
export function QueueBulkPanel({ items }: { items: BulkQueueItem[] }) {
  const [state, formAction, isPending] = useActionState(
    bulkRejectPendingAction,
    initialBulkRejectState
  );
  const [selected, setSelected] = useState<string[]>([]);
  const [armed, setArmed] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const handledState = useRef<typeof state | null>(null);

  const visibleIds = items.map((item) => item.id);
  const selectedVisible = selected.filter((id) => visibleIds.includes(id));
  const allVisibleSelected =
    visibleIds.length > 0 && selectedVisible.length === visibleIds.length;
  const overCap = selectedVisible.length > BULK_REJECT_MAX_ITEMS;

  // After a submission, drop succeeded records from the selection (they are
  // no longer pending) and keep failures checked for an immediate retry.
  // The list itself refreshes from the server; this only reconciles state.
  useEffect(() => {
    if (
      handledState.current !== state &&
      (state.status === "success" || state.status === "partial")
    ) {
      handledState.current = state;
      const succeeded = new Set(
        state.results.filter((result) => result.ok).map((result) => result.id)
      );
      setSelected((previous) => previous.filter((id) => !succeeded.has(id)));
      setArmed(false);
      setAcknowledged(false);
    }
  }, [state]);

  function toggleId(id: string): void {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((entry) => entry !== id)
        : [...previous, id]
    );
  }

  function toggleAllVisible(): void {
    setSelected((previous) =>
      allVisibleSelected
        ? previous.filter((id) => !visibleIds.includes(id))
        : [...previous.filter((id) => !visibleIds.includes(id)), ...visibleIds]
    );
  }

  if (items.length === 0) return null;
  const selectedItems = items.filter((item) => selectedVisible.includes(item.id));

  return (
    <section aria-label="Bulk rejection" className={panelClasses}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-black dark:text-zinc-50">
            Bulk reject
          </h2>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
            One confirmed reason, applied record by record — each keeps its own
            attribution and audit. Approvals stay per-record.
          </p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={toggleAllVisible}
            disabled={isPending}
            className={checkboxClasses}
          />
          Select all visible ({visibleIds.length})
        </label>
      </div>

      <ul className="mt-3 flex max-h-64 flex-col gap-1 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id}>
            <label className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900">
              <input
                type="checkbox"
                checked={selectedVisible.includes(item.id)}
                onChange={() => toggleId(item.id)}
                disabled={isPending}
                aria-label={`Select ${item.title}`}
                className={`${checkboxClasses} mt-0.5`}
              />
              <span className="min-w-0 flex-1 break-words">
                {item.title}
                {item.flagged ? (
                  <span className="ml-2 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                    flagged — verify
                  </span>
                ) : null}
              </span>
            </label>
          </li>
        ))}
      </ul>

      {state.status !== "idle" && state.message !== null ? (
        <div
          role={state.status === "error" ? "alert" : "status"}
          className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
            state.status === "error"
              ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
              : "border-black/[.08] bg-zinc-50 text-zinc-700 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-300"
          }`}
        >
          <p className="font-medium">{state.message}</p>
          {state.results.length > 0 ? (
            <ul className="mt-2 flex flex-col gap-1">
              {state.results.map((result) => (
                <li key={result.id} className="text-xs">
                  {result.ok ? (
                    <span>
                      ✅ {result.title ?? result.id} — rejected with attribution.
                    </span>
                  ) : (
                    <span>
                      ⛔ {result.id} — {result.error ?? "not rejected."}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {!armed ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setArmed(true)}
            disabled={isPending || selectedVisible.length === 0}
            className={ghostButtonClasses}
          >
            {selectedVisible.length === 0
              ? "Select records above first"
              : `Review bulk rejection (${selectedVisible.length})`}
          </button>
          {overCap ? (
            <p role="alert" className="text-xs font-medium text-red-700 dark:text-red-300">
              At most {BULK_REJECT_MAX_ITEMS} records per batch — narrow the
              selection before reviewing.
            </p>
          ) : null}
        </div>
      ) : (
        <form action={formAction} className="mt-3 flex flex-col gap-2 border-t border-black/[.08] pt-3 dark:border-white/[.145]">
          {selectedVisible.map((id) => (
            <input key={id} type="hidden" name="opportunityId" value={id} />
          ))}
          <p className="text-sm font-medium text-black dark:text-zinc-50">
            Reject these {selectedItems.length} records?
          </p>
          <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto text-xs text-zinc-600 dark:text-zinc-400">
            {selectedItems.map((item) => (
              <li key={item.id} className="break-words">
                • {item.title}
              </li>
            ))}
          </ul>
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            Shared rejection reason (recorded on every record&apos;s audit)
            <textarea
              name="rejectionReason"
              required
              minLength={MODERATION_REASON_MIN_LENGTH}
              maxLength={MODERATION_REASON_MAX_LENGTH}
              rows={3}
              disabled={isPending}
              placeholder={`State the evidence-based reason (${MODERATION_REASON_MIN_LENGTH}-${MODERATION_REASON_MAX_LENGTH} characters).`}
              className="mt-1 w-full rounded-lg border border-black/[.12] bg-white px-3 py-2 text-sm font-normal text-zinc-900 dark:border-white/[.16] dark:bg-zinc-950 dark:text-zinc-100"
            />
          </label>
          <label className="inline-flex cursor-pointer items-start gap-2 text-xs font-medium text-zinc-700 dark:text-zinc-300">
            <input
              type="checkbox"
              name="acknowledge"
              value="yes"
              checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)}
              disabled={isPending}
              className={`${checkboxClasses} mt-0.5`}
            />
            I confirm rejection of these {selectedItems.length} records with this
            reason. Each keeps its own attribution and audit.
          </label>
          {overCap ? (
            <p role="alert" className="text-xs font-medium text-red-700 dark:text-red-300">
              At most {BULK_REJECT_MAX_ITEMS} records per batch — uncheck some
              records before confirming.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              name="confirm"
              value={BULK_REJECT_CONFIRM_TOKEN}
              disabled={isPending || !acknowledged || overCap}
              className={dangerButtonClasses}
            >
              {isPending
                ? "Working…"
                : `Confirm rejection (${selectedVisible.length})`}
            </button>
            <button
              type="button"
              onClick={() => {
                setArmed(false);
                setAcknowledged(false);
              }}
              disabled={isPending}
              className={ghostButtonClasses}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
