/**
 * Branded auth-email copy for the future custom-SMTP activation.
 *
 * Repo-side preparation only: these are pure string builders used to pin
 * the confirmation / password-reset / resend-confirmation wording in tests
 * and to paste into the Supabase Auth email-template dashboard when the
 * owner activates SMTP. Nothing here sends email, holds credentials, or
 * configures any provider.
 *
 * Future sender: no-reply@auth.techopportunity.tech
 * Support pointer: the public /contact page (plus the WhatsApp channel
 * already published there). Templates stay generic so they never reveal
 * whether an address is registered.
 */

export const AUTH_EMAIL_SENDER = "no-reply@auth.techopportunity.tech";

export const AUTH_EMAIL_BRAND = "Tech Opportunity";

export interface AuthEmailMessage {
  subject: string;
  text: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function brandedShell(params: {
  heading: string;
  intro: string;
  actionLabel: string;
  actionUrl: string;
  fallback: string;
}): AuthEmailMessage {
  const safeUrl = escapeHtml(params.actionUrl);
  const text =
    `${AUTH_EMAIL_BRAND} — ${params.heading}\n\n` +
    `${params.intro}\n\n` +
    `${params.actionLabel}: ${params.actionUrl}\n\n` +
    `${params.fallback}\n\n` +
    `Need help? Visit Tech Opportunity → Contact (/contact).`;
  const html =
    `<p>Hi there,</p>` +
    `<p>${escapeHtml(params.intro)}</p>` +
    `<p><a href="${safeUrl}">${escapeHtml(params.actionLabel)}</a></p>` +
    `<p>If the button does not work, copy and paste this link into your browser:<br />${safeUrl}</p>` +
    `<p>${escapeHtml(params.fallback)}</p>` +
    `<p>— ${escapeHtml(AUTH_EMAIL_BRAND)}<br />Need help? Visit Tech Opportunity → Contact (/contact).</p>`;
  return { subject: `${AUTH_EMAIL_BRAND} — ${params.heading}`, text, html };
}

/** First signup confirmation (Supabase `Confirm signup` template body). */
export function confirmationEmail(confirmationUrl: string): AuthEmailMessage {
  return brandedShell({
    heading: "Confirm your account",
    intro:
      "You created a Tech Opportunity account. Confirm your email to finish signing up and start tracking opportunities.",
    actionLabel: "Confirm my account",
    actionUrl: confirmationUrl,
    fallback:
      "This link expires soon. If you did not create this account, you can safely ignore this email.",
  });
}

/** Password-reset request (Supabase `Reset password` template body). */
export function passwordResetEmail(resetUrl: string): AuthEmailMessage {
  return brandedShell({
    heading: "Reset your password",
    intro:
      "We received a request to reset the password for this email address. Use the link below to choose a new password.",
    actionLabel: "Reset my password",
    actionUrl: resetUrl,
    fallback:
      "This link expires soon. If you did not request this, you can safely ignore this email — your password stays unchanged.",
  });
}

/** Confirmation resend (same channel as signup, fresh link). */
export function resendConfirmationEmail(
  confirmationUrl: string
): AuthEmailMessage {
  return brandedShell({
    heading: "Your fresh confirmation link",
    intro:
      "Here is a fresh confirmation link for your Tech Opportunity account. Use it to finish signing in.",
    actionLabel: "Confirm my account",
    actionUrl: confirmationUrl,
    fallback:
      "This link expires soon. If you did not request this, you can safely ignore this email.",
  });
}
