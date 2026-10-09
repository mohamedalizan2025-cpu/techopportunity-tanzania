import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/data/supabase-auth";
import { isOfflineOpportunityId } from "@/lib/offline-cache";

const UUID_BODY_CAP = 64 * 1024;

type IncomingOp =
  | { id?: string; type: "save" | "unsave"; opportunityId: string }
  | {
      id?: string;
      type: "interested" | "applying" | "applied" | "remove-activity";
      opportunityId: string;
    };

function isOp(value: unknown): value is IncomingOp {
  if (!value || typeof value !== "object") return false;
  const op = value as Record<string, unknown>;
  if (typeof op.opportunityId !== "string") return false;
  if (!isOfflineOpportunityId(op.opportunityId)) return false;
  return (
    op.type === "save" ||
    op.type === "unsave" ||
    op.type === "interested" ||
    op.type === "applying" ||
    op.type === "applied" ||
    op.type === "remove-activity"
  );
}

/**
 * Idempotent reconnect sync for offline-queued mutations.
 * - Auth required (401 otherwise); identity from claims only.
 * - Save: insert-if-missing (23505 = already saved, counts as applied).
 * - Unsave: delete-if-present (0 rows = already removed, counts as applied).
 * - Activity: upsert / delete-if-present; unpublished targets fail closed
 *   and stay queued only when the failure is transient — unknown targets
 *   count as applied (server truth: nothing to track) so the queue drains.
 * - Server truth wins; the client clears only the ids we report applied.
 */
export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  let body: unknown = null;
  try {
    const text = await request.text();
    if (text.length > UUID_BODY_CAP) {
      return NextResponse.json({ error: "Queue too large." }, { status: 413 });
    }
    body = text ? (JSON.parse(text) as unknown) : null;
  } catch {
    return NextResponse.json({ error: "Invalid queue." }, { status: 400 });
  }

  const ops = (body as { ops?: unknown } | null)?.ops;
  if (!Array.isArray(ops) || ops.length === 0 || ops.length > 100) {
    return NextResponse.json({ error: "Invalid queue." }, { status: 400 });
  }
  const valid = ops.filter(isOp).slice(0, 100);

  const applied: string[] = [];
  const failed: string[] = [];

  for (const op of valid) {
    const key = typeof op.id === "string" ? op.id : null;
    try {
      if (op.type === "save" || op.type === "unsave") {
        if (op.type === "unsave") {
          const { error } = await user.client
            .from("saved_opportunities")
            .delete()
            .eq("user_id", user.userId)
            .eq("opportunity_id", op.opportunityId);
          if (error) throw error;
        } else {
          const { data: target } = await user.client
            .from("opportunities")
            .select("id")
            .eq("id", op.opportunityId)
            .eq("status", "published")
            .maybeSingle();
          if (!target) {
            // Server truth: nothing saveable. Drain so the queue cannot
            // retry forever against a removed/unpublished row.
            if (key) applied.push(key);
            continue;
          }
          const { error } = await user.client
            .from("saved_opportunities")
            .insert({ user_id: user.userId, opportunity_id: op.opportunityId });
          if (error && error.code !== "23505") throw error;
        }
      } else {
        if (op.type === "remove-activity") {
          const { error } = await user.client
            .from("talent_opportunity_activity")
            .delete()
            .eq("user_id", user.userId)
            .eq("opportunity_id", op.opportunityId);
          if (error) throw error;
        } else {
          const { data: target } = await user.client
            .from("opportunities")
            .select("id")
            .eq("id", op.opportunityId)
            .eq("status", "published")
            .maybeSingle();
          if (!target) {
            if (key) applied.push(key);
            continue;
          }
          const { error } = await user.client
            .from("talent_opportunity_activity")
            .upsert(
              {
                user_id: user.userId,
                opportunity_id: op.opportunityId,
                status: op.type,
              },
              { onConflict: "user_id,opportunity_id" }
            );
          if (error) throw error;
        }
      }
      if (key) applied.push(key);
    } catch {
      if (key) failed.push(key);
    }
  }

  return NextResponse.json(
    { applied, failed, received: valid.length },
    {
      headers: {
        "Cache-Control": "private, no-store",
      },
    }
  );
}
