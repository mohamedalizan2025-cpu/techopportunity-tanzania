import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

export const STAGING_PROJECT_REF = "pumzofcwfjqswkiwfqty";
export const PRODUCTION_PROJECT_REF = "jltuufukcwztugvojwjd";
export const STAGING_PROJECT_URL = `https://${STAGING_PROJECT_REF}.supabase.co`;

type HealthState = "healthy" | "blocked" | "failed";

export interface StagingHealthReport {
  schemaVersion: 1;
  generatedAt: string;
  projectRef: typeof STAGING_PROJECT_REF;
  state: HealthState;
  readOnly: true;
  connectivity: {
    state: "connected" | "blocked" | "failed";
    httpStatus: number | null;
  };
  rls: {
    publicOpportunitiesVisible: number | null;
    nonPublishedOpportunitiesVisible: number | null;
    privateTalentProfilesDenied: boolean | null;
    privateTalentProfilesHttpStatus: number | null;
  };
  reasons: string[];
  pausePolicy: {
    claim: "no_guarantee";
    note: string;
  };
}

type FetchLike = typeof fetch;

function report(
  generatedAt: string,
  state: HealthState,
  reasons: string[],
  fields?: Partial<Pick<StagingHealthReport, "connectivity" | "rls">>
): StagingHealthReport {
  return {
    schemaVersion: 1,
    generatedAt,
    projectRef: STAGING_PROJECT_REF,
    state,
    readOnly: true,
    connectivity: fields?.connectivity ?? {
      state: state === "healthy" ? "connected" : state,
      httpStatus: null,
    },
    rls: fields?.rls ?? {
      publicOpportunitiesVisible: null,
      nonPublishedOpportunitiesVisible: null,
      privateTalentProfilesDenied: null,
      privateTalentProfilesHttpStatus: null,
    },
    reasons,
    pausePolicy: {
      claim: "no_guarantee",
      note: "Read-only checks provide staging evidence but do not guarantee exemption from Supabase Free Plan inactivity pausing.",
    },
  };
}

export function validateStagingUrl(rawUrl: string | undefined): string {
  if (!rawUrl) throw new Error("staging_url_missing");
  const url = new URL(rawUrl);
  if (
    url.origin !== STAGING_PROJECT_URL
    || url.pathname !== "/"
    || url.username
    || url.password
    || rawUrl.includes(PRODUCTION_PROJECT_REF)
  ) {
    throw new Error("staging_identity_mismatch");
  }
  return url.origin;
}

export async function inspectStagingHealth(input: {
  url: string | undefined;
  anonKey: string | undefined;
  fetchImpl?: FetchLike;
  now?: Date;
}): Promise<StagingHealthReport> {
  const generatedAt = (input.now ?? new Date()).toISOString();
  let url: string;
  try {
    url = validateStagingUrl(input.url);
  } catch (error) {
    return report(generatedAt, "blocked", [error instanceof Error ? error.message : "staging_identity_mismatch"]);
  }

  const anonKey = input.anonKey?.trim();
  if (!anonKey) return report(generatedAt, "blocked", ["staging_anon_key_missing"]);

  const headers = {
    Accept: "application/json",
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
  const fetchImpl = input.fetchImpl ?? fetch;

  try {
    const opportunities = await fetchImpl(
      `${url}/rest/v1/opportunities?select=status&limit=1000`,
      { method: "GET", headers, redirect: "error", signal: AbortSignal.timeout(20_000) }
    );
    if (!opportunities.ok) {
      return report(generatedAt, "failed", ["staging_connectivity_failed"], {
        connectivity: { state: "failed", httpStatus: opportunities.status },
      });
    }

    const rows: unknown = await opportunities.json();
    if (!Array.isArray(rows) || rows.some((row) => !row || typeof row !== "object" || !("status" in row))) {
      return report(generatedAt, "failed", ["unexpected_public_response"], {
        connectivity: { state: "connected", httpStatus: opportunities.status },
      });
    }
    const nonPublished = rows.filter((row) => (row as { status: unknown }).status !== "published").length;

    const talentProfiles = await fetchImpl(
      `${url}/rest/v1/talent_profiles?select=user_id&limit=1`,
      { method: "GET", headers, redirect: "error", signal: AbortSignal.timeout(20_000) }
    );
    const privateDenied = talentProfiles.status === 401 || talentProfiles.status === 403;
    const reasons = [
      ...(nonPublished === 0 ? [] : ["anon_can_see_non_published_opportunities"]),
      ...(privateDenied ? [] : ["anon_talent_profiles_not_denied"]),
    ];

    return report(generatedAt, reasons.length === 0 ? "healthy" : "failed", reasons, {
      connectivity: { state: "connected", httpStatus: opportunities.status },
      rls: {
        publicOpportunitiesVisible: rows.length,
        nonPublishedOpportunitiesVisible: nonPublished,
        privateTalentProfilesDenied: privateDenied,
        privateTalentProfilesHttpStatus: talentProfiles.status,
      },
    });
  } catch {
    return report(generatedAt, "failed", ["staging_request_failed"]);
  }
}

function writeReport(path: string, value: StagingHealthReport) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const outputPath = process.env.STAGING_HEALTH_REPORT_PATH ?? "staging-health/report.json";
  const value = await inspectStagingHealth({
    url: process.env.STAGING_SUPABASE_URL,
    anonKey: process.env.STAGING_SUPABASE_ANON_KEY,
  });
  writeReport(outputPath, value);
  console.log(`STAGING_HEALTH_REPORT_JSON=${JSON.stringify(value)}`);
  if (value.state !== "healthy") process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main();
}
