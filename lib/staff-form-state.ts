export function sanitizeNextPath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("\\")) return null;
  return value;
}

export interface LoginState {
  status: "idle" | "error";
  message: string | null;
}

export const initialLoginState: LoginState = { status: "idle", message: null };

export interface DecisionState {
  status: "idle" | "success" | "error";
  message: string | null;
  decision: "approve" | "reject" | null;
  decidedTitle: string | null;
  decidedSlug: string | null;
}

export const initialDecisionState: DecisionState = {
  status: "idle",
  message: null,
  decision: null,
  decidedTitle: null,
  decidedSlug: null,
};

/**
 * Client-safe shared form-state module (no server-only imports).
 *
 * The published-management confirmation token lives here on purpose: the
 * staff list page and its client control both need it, and importing it from
 * lib/data/published-management would pull `next/headers` (via the Supabase
 * auth server client) into the browser bundle.
 */
export const UNPUBLISH_CONFIRM_TOKEN = "unpublish" as const;

/**
 * Published-record management (Milestone 14). Deliberately narrower than
 * DecisionState: an unpublish changes visibility only, so the only useful
 * echo back to the staff member is WHICH record disappeared.
 */
export interface UnpublishState {
  status: "idle" | "success" | "error";
  message: string | null;
  unpublishedId: string | null;
}

export const initialUnpublishState: UnpublishState = {
  status: "idle",
  message: null,
  unpublishedId: null,
};
