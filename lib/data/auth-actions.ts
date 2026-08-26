"use server";

import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "./supabase-auth";
import { getModerationAccess } from "./moderation";
import { sanitizeNextPath, type LoginState } from "../staff-form-state";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid email or password.",
  email_not_confirmed:
    "This account's email address has not been confirmed yet.",
  over_request_rate_limit:
    "Too many attempts. Please wait a moment and try again.",
};

export async function logInAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email =
    typeof formData.get("email") === "string"
      ? (formData.get("email") as string).trim()
      : "";
  const password =
    typeof formData.get("password") === "string"
      ? (formData.get("password") as string)
      : "";
  const nextPath = sanitizeNextPath(formData.get("next"));

  if (email === "" || password === "") {
    return { status: "error", message: "Enter your email and password." };
  }

  let supabase;
  try {
    supabase = await createSupabaseAuthServerClient();
  } catch {
    return {
      status: "error",
      message:
        "The sign-in service is temporarily unavailable. Please try again later.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: AUTH_ERROR_MESSAGES[error.code ?? ""] ?? "Invalid email or password.",
    };
  }

  const access = await getModerationAccess();
  const target = access.ok ? (nextPath ?? "/moderation") : "/";

  redirect(target);
}

export async function logOutAction(): Promise<void> {
  try {
    const supabase = await createSupabaseAuthServerClient();
    await supabase.auth.signOut();
  } catch {}
  redirect("/");
}
