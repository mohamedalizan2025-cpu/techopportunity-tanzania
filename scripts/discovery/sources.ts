import { createClient } from "@supabase/supabase-js";
import type { SourceRecord } from "./types";

export async function loadActiveSources(): Promise<SourceRecord[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY; the worker needs the service key for registry reads and source-health updates only (GitHub Actions secret / local .env.local, never NEXT_PUBLIC_*)");
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("opportunity_sources")
    .select("id,name,base_url,source_type,country,region,active,last_checked_at,last_success_at,last_error")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load discovery sources: ${error.message}`);
  }

  return (data ?? []) as SourceRecord[];
}