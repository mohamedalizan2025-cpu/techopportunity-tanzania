import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createClient } from "@supabase/supabase-js";
import type { DeadlineAlertRunReport } from "./runner";
import { runDeadlineAlertEvaluation } from "./runner";

const startedAt = new Date().toISOString();
const reportPath = process.env.DEADLINE_ALERT_REPORT_PATH ?? "alert-health/report.json";

function writeReport(report: DeadlineAlertRunReport): void {
  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`DEADLINE_ALERT_REPORT_JSON=${JSON.stringify(report)}`);
}

async function main(): Promise<void> {
  if (process.env.DEADLINE_ALERTS_ENABLED !== "true") {
    writeReport({
      schemaVersion: 1,
      status: "disabled",
      startedAt,
      completedAt: new Date().toISOString(),
      enabledUsers: 0,
      evaluatedSaves: 0,
      recentChanges: 0,
      candidates: 0,
      created: 0,
      duplicatesSuppressed: 0,
      pruned: 0,
      deliveryAttempted: false,
    });
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "[deadline-alerts] Enabled execution requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  try {
    writeReport(await runDeadlineAlertEvaluation(client));
  } catch (error) {
    const report: DeadlineAlertRunReport = {
      schemaVersion: 1,
      status: "failed",
      startedAt,
      completedAt: new Date().toISOString(),
      enabledUsers: 0,
      evaluatedSaves: 0,
      recentChanges: 0,
      candidates: 0,
      created: 0,
      duplicatesSuppressed: 0,
      pruned: 0,
      deliveryAttempted: false,
    };
    writeReport(report);
    throw error;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "[deadline-alerts] Unknown worker failure.");
  process.exitCode = 1;
});
