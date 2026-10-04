"use server";

import { redirect } from "next/navigation";
import { buildAuthCallbackUrl } from "../auth-redirect";
import { createSupabaseAuthServerClient } from "./supabase-auth";
import { getModerationAccess } from "./moderation";
import {
  postLoginDestination,
  sanitizeNextPath,
  type LoginState,
} from "../staff-form-state";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid email or password.",
  email_not_confirmed:
    "This account's email address has not been confirmed yet.",
  over_request_rate_limit:
    "Too many attempts. Please wait a moment and try again.",
};

export async function authenticateAction(
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
  const mode = formData.get("mode") === "sign-up" ? "sign-up" : "sign-in";
  const nextPath = sanitizeNextPath(formData.get("next"));

  if (email === "" || password === "") {
    return { status: "error", message: "Enter your email and password." };
  }
  if (mode === "sign-up" && password.length < 8) {
    return {
      status: "error",
      message: "Use a password with at least 8 characters.",
    };
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

  if (mode === "sign-up") {
    const emailRedirectTo = buildAuthCallbackUrl(nextPath);
    if (!emailRedirectTo) {
      return {
        status: "error",
        message:
          "Account confirmation is temporarily unavailable. Please try again later.",
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo },
    });
    if (error) {
      return {
        status: "error",
        message:
          AUTH_ERROR_MESSAGES[error.code ?? ""] ??
          "The account could not be created. Please check the details and try again.",
      };
    }
    if (!data.session) {
      return {
        status: "success",
        message:
          "Check your email to confirm the account. The fresh link will return you here and sign you in.",
      };
    }
    redirect(postLoginDestination(nextPath, false));
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      status: "error",
      message: AUTH_ERROR_MESSAGES[error.code ?? ""] ?? "Invalid email or password.",
    };
  }

  const access = await getModerationAccess();
  redirect(postLoginDestination(nextPath, access.ok));
}

/**
 * Sign-out contract (auth-correctness milestone):
 * - Supabase session is invalidated (`signOut`, global scope) and the SSR
 *   client clears auth cookies via setAll during removal.
 * - A signOut error is logged server-side (never exposed) and does NOT
 *   cancel the logout: we re-check for a surviving session and still
 *   redirect to public `/`, so this action can never throw the user into
 *   the global error boundary. A surviving session surfaces as
 *   still-signed-in (retry), never as an error page.
 */
export async function logOutAction(): Promise<void> {
  try {
    const supabase = await createSupabaseAuthServerClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(
        "[auth] sign-out returned an error; verifying local session before redirect.",
        error.message
      );
    }
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      console.error(
        "[auth] session survived sign-out; redirecting to / anyway (retry surfaces as still-signed-in, never as an error page)."
      );
    }
  } catch (error) {
    console.error(
      "[auth] sign-out failed before redirect; redirecting to / anonymously-failed-safe.",
      error instanceof Error ? error.message : error
    );
  }
  redirect("/");
}
