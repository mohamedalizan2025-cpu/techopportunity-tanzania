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
