import type { DeadlineAlertEventType } from "../deadline-alerts";
import type { AuthenticatedUserContext } from "./supabase-auth";

export interface DeadlineAlertPreferenceResult {
  available: boolean;
  enabled: boolean;
}

export interface DeadlineAlertEventView {
  id: string;
  eventType: DeadlineAlertEventType;
  generatedAt: string;
  deadline: string | null;
  opportunity: { title: string; slug: string };
}

interface DeadlineAlertEventRow {
  id: string;
  event_type: DeadlineAlertEventType;
  generated_at: string;
  deadline: string | null;
  opportunity:
    | { title: string; slug: string; status: string }
    | Array<{ title: string; slug: string; status: string }>
    | null;
}

function missingAlertSchema(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("user_alert_preferences") === true ||
    error.message?.includes("deadline_alert_events") === true
  );
}

export async function getDeadlineAlertPreference(
  user: AuthenticatedUserContext
): Promise<DeadlineAlertPreferenceResult> {
  const { data, error } = await user.client
    .from("user_alert_preferences")
    .select("deadline_alerts_enabled")
    .eq("user_id", user.userId)
    .maybeSingle();
  if (error) {
    if (!missingAlertSchema(error)) {
      console.error("[lib/data] Failed to read deadline alert preference:", error.message);
    }
    return { available: false, enabled: false };
  }
  const row = data as unknown as { deadline_alerts_enabled: boolean } | null;
  return { available: true, enabled: row?.deadline_alerts_enabled === true };
}

function oneOpportunity(
  value: DeadlineAlertEventRow["opportunity"]
): { title: string; slug: string; status: string } | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function listDeadlineAlertEvents(
  user: AuthenticatedUserContext
): Promise<{ available: boolean; events: DeadlineAlertEventView[] }> {
  const { data, error } = await user.client
    .from("deadline_alert_events")
    .select("id,event_type,generated_at,deadline,opportunity:opportunities(title,slug,status)")
    .eq("user_id", user.userId)
    .eq("opportunity.status", "published")
    .order("generated_at", { ascending: false })
    .limit(20);
  if (error) {
    if (!missingAlertSchema(error)) {
      console.error("[lib/data] Failed to list deadline alerts:", error.message);
    }
    return { available: false, events: [] };
  }

  const events = ((data ?? []) as unknown as DeadlineAlertEventRow[]).flatMap((row) => {
    const opportunity = oneOpportunity(row.opportunity);
    if (!opportunity || opportunity.status !== "published") return [];
    return [{
      id: row.id,
      eventType: row.event_type,
      generatedAt: row.generated_at,
      deadline: row.deadline,
      opportunity: { title: opportunity.title, slug: opportunity.slug },
    }];
  });
  return { available: true, events };
}
