"use server";

import { redirect } from "next/navigation";
import { buildAuthCallbackUrl, buildRecoveryCallbackUrl } from "../auth-redirect";
import { createSupabaseAuthServerClient } from "./supabase-auth";
import { getModerationAccess } from "./moderation";
import {
  postLoginDestination,
  sanitizeNextPath,
  type LoginState,
} from "../staff-form-state";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Invalid email or password.",
  email_not_confirmed: "Confirm your email before signing in.",
  over_request_rate_limit:
    "Too many attempts. Please wait a moment and try again.",
  over_email_send_rate_limit:
    "Too many attempts. Please wait a moment and try again.",
  over_sms_send_rate_limit:
    "Too many attempts. Please wait a moment and try again.",
};

const RATE_LIMIT_CODES = new Set([
  "over_request_rate_limit",
  "over_email_send_rate_limit",
  "over_sms_send_rate_limit",
]);

const SIGN_IN_UNAVAILABLE_MESSAGE =
  "Sign-in is temporarily unavailable. Please try again.";
const RECOVERY_UNAVAILABLE_MESSAGE =
  "Password reset is temporarily unavailable. Please try again later.";
const RESEND_UNAVAILABLE_MESSAGE =
  "Confirmation email is temporarily unavailable. Please try again later.";
const FORGOT_GENERIC_MESSAGE =
  "If an account exists for that email, we'll send password reset instructions.";
const RESEND_GENERIC_MESSAGE =
  "If an account exists for that email, we'll send a fresh confirmation link.";
const RECOVERY_EXPIRED_MESSAGE =
  "This password reset link is invalid or expired. Request a fresh link and try again.";
const PASSWORD_UPDATED_MESSAGE =
  "Password updated. Sign in with your new password.";

function isPlausibleEmail(value: string): boolean {
  if (value.length === 0 || value.length > 320) return false;
  const at = value.indexOf("@");
  if (at <= 0 || at >= value.length - 1) return false;
  if (/\s/.test(value)) return false;
  return true;
}

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
  if (mode === "sign-up" && password.length > 128) {
    return {
      status: "error",
      message: "Use a password with at most 128 characters.",
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

    let data;
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo },
      });
      data = result.data;
      if (result.error) {
        const code = result.error.code ?? "";
        // Never reveal whether the address is known: a known address gets
        // the same confirmation-shaped response as a new one.
        if (code === "user_already_exists" || code === "email_exists") {
          return {
            status: "success",
            message:
              "Check your email to confirm the account. The fresh link will return you here and sign you in.",
          };
        }
        return {
          status: "error",
          message:
            AUTH_ERROR_MESSAGES[code] ??
            "The account could not be created. Please check the details and try again.",
        };
      }
    } catch {
      return {
        status: "error",
        message:
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

  let signInError: { code?: string } | null = null;
  try {
    const result = await supabase.auth.signInWithPassword({ email, password });
    signInError = result.error;
  } catch {
    return { status: "error", message: SIGN_IN_UNAVAILABLE_MESSAGE };
  }

  if (signInError) {
    return {
      status: "error",
      message: AUTH_ERROR_MESSAGES[signInError.code ?? ""] ?? "Invalid email or password.",
    };
  }

  const access = await getModerationAccess();
  redirect(postLoginDestination(nextPath, access.ok));
}

/**
 * Password-recovery request (forgot-password flow). Always returns the same
 * generic response so the result never reveals whether an account exists
 * for the address. Rate-limit and outage states map to safe messages; raw
 * provider errors are never surfaced.
 */
export async function requestPasswordResetAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email =
    typeof formData.get("email") === "string"
      ? (formData.get("email") as string).trim()
      : "";

  if (email === "") {
    return { status: "error", message: "Enter your email address." };
  }
  if (!isPlausibleEmail(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const emailRedirectTo = buildRecoveryCallbackUrl();
  if (!emailRedirectTo) {
    return { status: "error", message: RECOVERY_UNAVAILABLE_MESSAGE };
  }

  let supabase;
  try {
    supabase = await createSupabaseAuthServerClient();
  } catch {
    return { status: "error", message: RECOVERY_UNAVAILABLE_MESSAGE };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: emailRedirectTo,
    });
    if (error && RATE_LIMIT_CODES.has(error.code ?? "")) {
      return {
        status: "error",
        message: "Too many attempts. Please wait a moment and try again.",
      };
    }
  } catch {
    return { status: "error", message: RECOVERY_UNAVAILABLE_MESSAGE };
  }

  return { status: "success", message: FORGOT_GENERIC_MESSAGE };
}

/**
 * Confirmation-email resend. Generic privacy-safe response: the caller
 * cannot tell whether the address is registered, unconfirmed, or unknown.
 */
export async function resendConfirmationAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email =
    typeof formData.get("email") === "string"
      ? (formData.get("email") as string).trim()
      : "";
  const nextPath = sanitizeNextPath(formData.get("next"));

  if (email === "") {
    return { status: "error", message: "Enter your email address." };
  }
  if (!isPlausibleEmail(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const emailRedirectTo = buildAuthCallbackUrl(nextPath);
  if (!emailRedirectTo) {
    return { status: "error", message: RESEND_UNAVAILABLE_MESSAGE };
  }

  let supabase;
  try {
    supabase = await createSupabaseAuthServerClient();
  } catch {
    return { status: "error", message: RESEND_UNAVAILABLE_MESSAGE };
  }

  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo },
    });
    if (error && RATE_LIMIT_CODES.has(error.code ?? "")) {
      return {
        status: "error",
        message: "Too many attempts. Please wait a moment and try again.",
      };
    }
  } catch {
    return { status: "error", message: RESEND_UNAVAILABLE_MESSAGE };
  }

  return { status: "success", message: RESEND_GENERIC_MESSAGE };
}

/**
 * Password update for a valid recovery (or signed-in) session. Requires a
 * live authenticated session — direct anonymous access fails safely with an
 * expired-link message. Passwords never travel in URLs and are never logged.
 * On success the recovery session is signed out so the user continues with
 * a fresh sign-in.
 */
export async function updatePasswordAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password =
    typeof formData.get("password") === "string"
      ? (formData.get("password") as string)
      : "";
  const confirmPassword =
    typeof formData.get("confirmPassword") === "string"
      ? (formData.get("confirmPassword") as string)
      : "";

  if (password === "" || confirmPassword === "") {
    return { status: "error", message: "Enter your new password twice." };
  }
  if (password.length < 8) {
    return {
      status: "error",
      message: "Use a password with at least 8 characters.",
    };
  }
  if (password.length > 128) {
    return {
      status: "error",
      message: "Use a password with at most 128 characters.",
    };
  }
  if (password !== confirmPassword) {
    return { status: "error", message: "Passwords do not match." };
  }

  let supabase;
  try {
    supabase = await createSupabaseAuthServerClient();
  } catch {
    return { status: "error", message: RECOVERY_UNAVAILABLE_MESSAGE };
  }

  try {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      return { status: "error", message: RECOVERY_EXPIRED_MESSAGE };
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      if (RATE_LIMIT_CODES.has(error.code ?? "")) {
        return {
          status: "error",
          message: "Too many attempts. Please wait a moment and try again.",
        };
      }
      return {
        status: "error",
        message: "The password could not be updated. Please try again.",
      };
    }
  } catch {
    return { status: "error", message: RECOVERY_UNAVAILABLE_MESSAGE };
  }

  try {
    await supabase.auth.signOut();
  } catch {}

  return { status: "success", message: PASSWORD_UPDATED_MESSAGE };
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
