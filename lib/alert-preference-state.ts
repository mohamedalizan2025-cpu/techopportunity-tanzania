import type { DeadlineAlertEventType } from "./deadline-alerts";

export interface AlertPreferenceMutationState {
  status: "idle" | "success" | "error";
  message: string | null;
  enabled: boolean | null;
}

export const initialAlertPreferenceMutationState: AlertPreferenceMutationState = {
  status: "idle",
  message: null,
  enabled: null,
};

export function parseAlertPreferenceIntent(value: FormDataEntryValue | null): boolean | null {
  if (value === "enable") return true;
  if (value === "disable") return false;
  return null;
}

export function ownsAlertRecord(
  authenticatedUserId: string | null,
  recordUserId: string
): boolean {
  return authenticatedUserId !== null && authenticatedUserId === recordUserId;
}

export function deadlineAlertEventLabel(eventType: DeadlineAlertEventType): string {
  const labels: Record<DeadlineAlertEventType, string> = {
    deadline_approaching: "This saved opportunity is closing soon.",
    deadline_became_known: "A deadline was added to this saved opportunity.",
    deadline_extended: "The deadline for this saved opportunity was extended.",
    deadline_shortened: "The deadline for this saved opportunity moved earlier.",
    deadline_changed: "The deadline details for this saved opportunity changed.",
    deadline_became_rolling: "This saved opportunity now has an explicitly rolling deadline.",
  };
  return labels[eventType];
}
