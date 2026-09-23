import {
  DEFAULT_EXPECTED_INTERVAL_HOURS,
  DEFAULT_SCHEDULE_MINUTE,
  scheduledSlotForObservation,
  triggerKindForEvent,
  type HealthHistory,
  type TriggerKind,
} from "./health";

export interface DiscoveryTriggerInput {
  event: string;
  requestedKind?: string;
  actor?: string;
  allowedExternalActor?: string;
  externalSchedulerEnabled?: boolean;
  nominalSlot?: string;
  evaluatedAt?: string;
  scheduleMinute?: number;
  intervalHours?: number;
  history?: HealthHistory;
}

export interface DiscoveryTriggerResolution {
  accepted: boolean;
  triggerKind: TriggerKind;
  nominalSlot: string | null;
  reason: string;
}

function isCanonicalNominalSlot(
  value: string,
  scheduleMinute: number,
  intervalHours: number
): boolean {
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    && parsed.toISOString() === value
    && parsed.getUTCMinutes() === scheduleMinute
    && parsed.getUTCHours() % intervalHours === 0
    && parsed.getUTCSeconds() === 0
    && parsed.getUTCMilliseconds() === 0;
}

function slotAlreadyRetained(history: HealthHistory | undefined, nominalSlot: string): boolean {
  return (history?.observations ?? []).some(
    (observation) => scheduledSlotForObservation(observation) === nominalSlot
  );
}

export function resolveDiscoveryTrigger(input: DiscoveryTriggerInput): DiscoveryTriggerResolution {
  const requestedKind = input.requestedKind?.trim() ?? "";
  const nominalSlot = input.nominalSlot?.trim() ?? "";
  if (input.event !== "workflow_dispatch") {
    return {
      accepted: requestedKind !== "external_schedule" && nominalSlot.length === 0,
      triggerKind: triggerKindForEvent(input.event),
      nominalSlot: null,
      reason: requestedKind === "external_schedule" || nominalSlot.length > 0
        ? "External scheduling inputs are valid only on workflow_dispatch."
        : "Native trigger identity accepted.",
    };
  }

  if (requestedKind === "" || requestedKind === "manual") {
    return {
      accepted: nominalSlot.length === 0,
      triggerKind: "manual",
      nominalSlot: null,
      reason: nominalSlot.length === 0
        ? "Manual trigger identity accepted."
        : "Manual runs cannot claim a nominal scheduled slot.",
    };
  }

  if (requestedKind !== "external_schedule") {
    return {
      accepted: false,
      triggerKind: "other",
      nominalSlot: null,
      reason: "Unknown workflow-dispatch trigger identity.",
    };
  }

  if (!input.externalSchedulerEnabled) {
    return {
      accepted: false,
      triggerKind: "external_schedule",
      nominalSlot: null,
      reason: "External scheduling is owner-disabled.",
    };
  }
  const actor = input.actor?.trim().toLowerCase();
  const allowedActor = input.allowedExternalActor?.trim().toLowerCase();
  if (!actor || !allowedActor || actor !== allowedActor) {
    return {
      accepted: false,
      triggerKind: "external_schedule",
      nominalSlot: null,
      reason: "External scheduler actor is not authorized.",
    };
  }

  const scheduleMinute = input.scheduleMinute ?? DEFAULT_SCHEDULE_MINUTE;
  const intervalHours = input.intervalHours ?? DEFAULT_EXPECTED_INTERVAL_HOURS;
  if (!isCanonicalNominalSlot(nominalSlot, scheduleMinute, intervalHours)) {
    return {
      accepted: false,
      triggerKind: "external_schedule",
      nominalSlot: null,
      reason: "External nominal slot is malformed or off cadence.",
    };
  }
  const evaluatedAt = Date.parse(input.evaluatedAt ?? new Date().toISOString());
  const slotAt = Date.parse(nominalSlot);
  const ageMinutes = (evaluatedAt - slotAt) / 60_000;
  const toleranceMinutes = Math.max(120, intervalHours * 15);
  if (!Number.isFinite(ageMinutes) || ageMinutes < -5 || ageMinutes > toleranceMinutes) {
    return {
      accepted: false,
      triggerKind: "external_schedule",
      nominalSlot: null,
      reason: "External nominal slot is outside the allowed dispatch window.",
    };
  }
  if (slotAlreadyRetained(input.history, nominalSlot)) {
    return {
      accepted: false,
      triggerKind: "external_schedule",
      nominalSlot,
      reason: "External nominal slot is already retained and cannot be replayed.",
    };
  }
  return {
    accepted: true,
    triggerKind: "external_schedule",
    nominalSlot,
    reason: "Authenticated external schedule identity accepted.",
  };
}
