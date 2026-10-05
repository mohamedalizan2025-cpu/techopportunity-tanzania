/** Auth engineering + staging recovery milestone regression tests. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildAuthCallbackUrl,
  buildRecoveryCallbackUrl,
  resolveSiteOrigin,
} from "../lib/auth-redirect";
import {
  postLoginDestination,
  sanitizeNextPath,
} from "../lib/staff-form-state";

let passed = 0;
function test(name: string, run: () => void) {
  run();
  passed += 1;
  console.log(`PASS ${name}`);
}

const root = process.cwd();
const read = (file: string) => readFileSync(join(root, file), "utf8");

const authAction = read("lib/data/auth-actions.ts");
const authCallback = read("app/auth/callback/route.ts");
const authRedirect = read("lib/auth-redirect.ts");
const loginPage = read("app/login/page.tsx");
const loginForm = read("app/login/login-form.tsx");
const forgotPage = read("app/forgot-password/page.tsx");
const forgotForm = read("app/forgot-password/forgot-password-form.tsx");
const resetPage = read("app/reset-password/page.tsx");
const resetForm = read("app/reset-password/reset-password-form.tsx");
const resendPage = read("app/resend-confirmation/page.tsx");
const resendForm = read("app/resend-confirmation/resend-confirmation-form.tsx");

function sliceBetween(
  source: string,
  start: string,
  end: string
): string {
  const from = source.indexOf(start);
  if (from === -1) throw new Error(`start marker missing: ${start}`);
  const rest = source.slice(from + start.length);
  const to = rest.indexOf(end);
  return to === -1 ? rest : rest.slice(0, to);
}

const forgotSlice = sliceBetween(
  authAction,
  "export async function requestPasswordResetAction",
  "export async function resendConfirmationAction"
);
const resendSlice = sliceBetween(
  authAction,
  "export async function resendConfirmationAction",
  "export async function updatePasswordAction"
);
const updateSlice = sliceBetween(
  authAction,
  "export async function updatePasswordAction",
  "export async function logOutAction"
);

// A. Sign-in contract -------------------------------------------------------
test("sign-in keeps the safe invalid-credentials error", () => {
  assert.match(authAction, /Invalid email or password/);
});

test("sign-in email-not-confirmed guides to confirmation, not retry", () => {
  assert.match(authAction, /Confirm your email before signing in/);
  assert.doesNotMatch(authAction, /has not been confirmed yet/);
});

test("sign-in maps rate limits without provider detail", () => {
  assert.match(
    authAction,
    /Too many attempts\. Please wait a moment and try again\./
  );
  assert.match(authAction, /over_request_rate_limit/);
  assert.match(authAction, /over_email_send_rate_limit/);
});

test("sign-in transport failure maps to a safe unavailable message", () => {
  assert.match(authAction, /Sign-in is temporarily unavailable/);
});

test("sign-in still trims the email and passes the password through", () => {
  assert.match(authAction, /formData\.get\("email"\) as string\)\.trim\(\)/);
  assert.match(authAction, /signInWithPassword\(\{ email, password \}\)/);
});

// B. Sign-up hardening ------------------------------------------------------
test("sign-up keeps the 8-character minimum guard", () => {
  assert.match(authAction, /mode === "sign-up" && password\.length < 8/);
  assert.match(authAction, /Use a password with at least 8 characters/);
});

test("sign-up bounds the password maximum consistently with the form", () => {
  assert.match(authAction, /password\.length > 128/);
  assert.match(resetForm, /maxLength=\{128\}/);
  assert.match(loginForm, /maxLength=\{128\}/);
});

test("sign-up supplies the validated email callback", () => {
  assert.match(authAction, /buildAuthCallbackUrl\(nextPath\)/);
  assert.match(authAction, /options: \{ emailRedirectTo \}/);
});

test("sign-up keeps the honest confirmation message", () => {
  assert.match(authAction, /Check your email to confirm the account/);
});

test("sign-up never accepts a caller-supplied role", () => {
  assert.doesNotMatch(authAction, /formData\.get\(["']role["']\)/);
  assert.doesNotMatch(authAction, /name="role"/);
  assert.doesNotMatch(loginForm, /name="role"/);
  assert.doesNotMatch(loginForm, /moderator|admin/);
});

test("existing-email sign-up does not enumerate the account", () => {
  assert.match(authAction, /user_already_exists/);
  assert.match(authAction, /email_exists/);
  const signupSlice = sliceBetween(
    authAction,
    'if (mode === "sign-up") {',
    "redirect(postLoginDestination(nextPath, false));"
  );
  assert.doesNotMatch(signupSlice, /already registered|already exists/i);
});

// E. Forgot-password generic response ---------------------------------------
test("forgot-password returns the generic recovery message", () => {
  assert.match(
    authAction,
    /If an account exists for that email, we'll send password reset instructions/
  );
  assert.match(forgotForm, /send password[\s\S]*reset instructions/);
});

test("forgot-password never enumerates the account", () => {
  assert.doesNotMatch(forgotSlice, /user_already|email_exists|not found/i);
  assert.doesNotMatch(forgotSlice, /error\.message/);
  assert.doesNotMatch(forgotSlice, /formData\.get\("password"\)/);
  assert.doesNotMatch(forgotSlice, /updateUser/);
});

test("forgot-password uses the canonical recovery callback", () => {
  assert.match(forgotSlice, /buildRecoveryCallbackUrl\(\)/);
  assert.match(forgotSlice, /resetPasswordForEmail\(email/);
  assert.match(forgotSlice, /redirectTo: emailRedirectTo/);
});

test("forgot-password validates the address without leaking state", () => {
  assert.match(forgotSlice, /Enter your email address/);
  assert.match(forgotSlice, /Enter a valid email address/);
});

// Reset-password ------------------------------------------------------------
test("reset requires matching confirmation and minimum length", () => {
  assert.match(authAction, /Passwords do not match/);
  assert.match(updateSlice, /Use a password with at least 8 characters/);
  assert.match(updateSlice, /Use a password with at most 128 characters/);
  assert.match(resetForm, /Confirm new password/);
  assert.match(resetForm, /name="confirmPassword"/);
});

test("reset success requires a fresh sign-in", () => {
  assert.match(
    authAction,
    /Password updated\. Sign in with your new password/
  );
  assert.match(updateSlice, /await supabase\.auth\.signOut\(\)/);
  assert.match(resetForm, /Sign in with your new password/);
});

test("reset requires a live session and fails safe without one", () => {
  assert.match(updateSlice, /supabase\.auth\.getUser\(\)/);
  assert.match(
    authAction,
    /This password reset link is invalid or expired/
  );
  assert.match(resetPage, /getAuthenticatedUser\(\)/);
  assert.match(resetPage, /Request a fresh link/);
});

test("passwords never travel in URLs and are never logged", () => {
  assert.doesNotMatch(updateSlice, /new URL\(.*password/i);
  assert.doesNotMatch(updateSlice, /console\.log/);
  assert.doesNotMatch(resetForm, /searchParams/);
  assert.doesNotMatch(authAction, /SUPABASE_SERVICE_ROLE_KEY|service_role/);
});

// Resend confirmation -------------------------------------------------------
test("resend returns a generic privacy-safe response", () => {
  assert.match(
    authAction,
    /we'll send a fresh confirmation link/
  );
  assert.doesNotMatch(resendSlice, /error\.message/);
});

test("resend uses the signup confirmation channel and safe callback", () => {
  assert.match(resendSlice, /\.resend\(/);
  assert.match(resendSlice, /type: "signup"/);
  assert.match(resendSlice, /options: \{ emailRedirectTo \}/);
  assert.match(resendSlice, /buildAuthCallbackUrl\(nextPath\)/);
});

test("resend page carries a labelled email form with safe return", () => {
  assert.match(resendForm, /<label\s+htmlFor="email"/);
  assert.match(resendForm, /resendConfirmationAction/);
  assert.match(resendForm, /name="next"/);
  assert.match(resendPage, /Confirm your email/);
});

test("expired links point at resend instead of account recreation", () => {
  assert.match(loginPage, /That confirmation link is invalid or expired/);
  assert.doesNotMatch(loginPage, /by creating the account again/);
  assert.match(loginPage, /instead of creating the account again/);
  assert.match(loginPage, /Resend confirmation email/);
  assert.match(loginForm, /Forgot password\?/);
  assert.match(loginForm, /Resend confirmation email/);
});

// G. Safe callback handling -------------------------------------------------
test("callback keeps the PKCE code exchange", () => {
  assert.match(authCallback, /exchangeCodeForSession\(code\)/);
  assert.match(authCallback, /sanitizeNextPath/);
});

test("callback forces recovery links onto the reset page", () => {
  assert.match(authCallback, /type === "recovery"/);
  assert.match(authCallback, /RECOVERY_DESTINATION/);
  assert.match(authCallback, /\/reset-password/);
});

test("callback supports token-hash links without trusting hosts", () => {
  assert.match(authCallback, /token_hash/);
  assert.match(authCallback, /verifyOtp/);
  assert.doesNotMatch(authRedirect, /request\.headers|headers\(\)|x-forwarded-host/i);
  assert.doesNotMatch(authCallback, /error\.message/);
});

test("recovery callback builder targets the reset page only", () => {
  assert.equal(
    buildRecoveryCallbackUrl({
      NEXT_PUBLIC_SITE_URL: "https://techopportunity-tanzania.vercel.app",
      NODE_ENV: "production",
    }),
    "https://techopportunity-tanzania.vercel.app/auth/callback?next=%2Freset-password"
  );
  assert.equal(
    buildRecoveryCallbackUrl({ NODE_ENV: "production" }),
    null
  );
});

// O. Open redirect resistance -----------------------------------------------
test("hostile destinations still fail closed", () => {
  assert.equal(sanitizeNextPath("https://evil.example"), null);
  assert.equal(sanitizeNextPath("//evil.example"), null);
  assert.equal(sanitizeNextPath("javascript:alert(1)"), null);
  assert.equal(
    postLoginDestination(sanitizeNextPath("https://evil.example"), false),
    "/saved"
  );
  assert.equal(postLoginDestination("/moderation", false), "/saved");
  assert.equal(
    postLoginDestination("/reset-password", false),
    "/reset-password"
  );
  assert.equal(
    buildAuthCallbackUrl("https://evil.example", {
      VERCEL_PROJECT_PRODUCTION_URL: "techopportunity-tanzania.vercel.app",
      NODE_ENV: "production",
    }),
    "https://techopportunity-tanzania.vercel.app/auth/callback?next=%2Fsaved"
  );
});

// P. Sign-out regression retained -------------------------------------------
test("sign-out still invalidates the session and lands on /", () => {
  assert.match(authAction, /supabase\.auth\.signOut\(\)/);
  assert.match(authAction, /redirect\("\/"\)/);
});

// Recovery pages stay public, robots-excluded, and reachable ----------------
test("recovery pages render without session and stay out of search", () => {
  for (const page of [forgotPage, resetPage, resendPage]) {
    assert.match(page, /robots: \{ index: false, follow: false \}/);
    assert.match(page, /id="main-content"/);
  }
  assert.doesNotMatch(forgotPage, /getAuthenticatedUser/);
  assert.doesNotMatch(resendPage, /getAuthenticatedUser/);
});

test("recovery origin resolution fails closed when unconfigured", () => {
  assert.equal(resolveSiteOrigin({ NODE_ENV: "production" }), null);
});

console.log(`\n${passed} auth engineering and recovery tests passed.`);
