# Auth email readiness (repo-side, SMTP not activated)

ACTIVATION BLOCKED until domain/DNS + Supabase SMTP/Resend owner steps are complete.

Status: PREPARED — copy, tests, and configuration documentation are ready.
Sending is NOT configured. No credentials exist in this branch.

## What this branch contains

- `lib/auth-email.ts`: pure branded copy builders for confirmation, reset and resend
  wording. Supabase uses two dashboard templates here: Confirm signup and
  Reset password; signup resends reuse Confirm signup.
  No sending, no secrets, no provider SDK.
- `tests/auth-email.test.ts`: pins sender, branding, generic
  non-enumerating wording, `/contact` support pointer, URL passthrough,
  HTML escaping, and the no-secret invariant. Run:
  `npx tsx tests/auth-email.test.ts` (wired as `npm run test:auth-email`).
- Current flows (unchanged, audited): `lib/data/auth-actions.ts` already
  uses `buildAuthCallbackUrl()` / `buildRecoveryCallbackUrl()` so every
  email link returns through `/auth/callback` with open-redirect guards;
  all user-facing responses are generic (no account enumeration);
  rate-limit and outage states map to safe messages.

## Required environment-variable names only (no values)

- `NEXT_PUBLIC_SITE_URL` — must be `https://techopportunity.tech` in
  Production at SMTP activation so email links point at the canonical domain.
- Supabase Auth SMTP settings live in the Supabase dashboard (NOT env):
  SMTP host / port / username / password, sender address, sender name.
- No `SMTP_*` / `RESEND_*` variables are read by application code today;
  do not invent any until a code-side mailer is separately approved
  (none is needed — Supabase sends the mail).

## Owner activation steps (manual, dashboard — NOT done here)

1. DNS first: `techopportunity.tech` live with HTTPS; add the SPF/DKIM/DMARC
   records the email provider requires for `auth.techopportunity.tech`.
   Recommended: one Resend domain, free tier, $0.
2. Supabase dashboard → Project (production `jltuufukcwztugvojwjd`) →
   Authentication → Emails:
   - Enable Custom SMTP; enter provider host/port/credentials.
   - Sender address: `no-reply@auth.techopportunity.tech`, sender name:
     `Tech Opportunity`.
   - Set Auth URL Configuration Site URL to `https://techopportunity.tech`
     (no trailing slash) only after the live HTTPS owner gate is satisfied.
   - Paste the matching Subject and HTML Body blocks below into the
     Confirm signup and Reset password templates. Do not paste TypeScript.
   - Confirm the redirect allow-list includes
     `https://techopportunity.tech/auth/callback**`.
3. Send one test signup + one test reset to an owner mailbox; confirm links
   land on the canonical domain and complete sign-in / password update.
4. Never configure staging with production credentials; never commit secrets.

## Copy/paste dashboard templates (prepared, NOT applied)

Use the Subject as plain text and the HTML block as the template Body. Leave
Go placeholders exactly as written; Supabase expands them when it sends mail.
Never replace them with a real token, email address, credential or sample URL.
The Site URL must be the owner-verified canonical origin above. The placeholders
and hosted template fields are documented in
[Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates).

These links deliberately use `{{ .TokenHash }}` at the existing server-side
`/auth/callback`, which verifies the hash with `verifyOtp`. This supports opening
on another browser/device without relying on the signup browser's PKCE verifier.
`{{ .SiteURL }}` supplies the approved app origin. The `type=email` confirmation
lands at Saved; `type=recovery` always lands at Reset Password in the current
callback regardless of a caller's `next`. HTML query separators must remain
`&amp;`. Do not substitute `{{ .RedirectTo }}` alone (no verification token),
append app paths to `{{ .ConfirmationURL }}`, or change the callback path.
These placeholders are template syntax, not secret values.

### Confirm signup (also used for signup confirmation resends)

Subject:

```text
Tech Opportunity - Confirm your account
```

HTML Body:

```html
<h2>Tech Opportunity</h2>
<p>Hi there,</p>
<p>You created a Tech Opportunity account. Confirm your email to finish signing up and start tracking opportunities.</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=email&amp;next=%2Fsaved">Confirm my account</a></p>
<p>If the button does not work, copy and paste this link into your browser:<br>{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=email&amp;next=%2Fsaved</p>
<p>This link expires soon. If you did not create this account, you can safely ignore this email.</p>
<p>Tech Opportunity<br>Need help? <a href="{{ .SiteURL }}/contact">Contact us</a>.</p>
```

There is no separate resend-confirmation dashboard template: keep Confirm signup
wording valid for both the first email and a fresh link. The optional resend copy
builder is reference copy only and is not wired into a sending path.

### Reset password

Subject:

```text
Tech Opportunity - Reset your password
```

HTML Body:

```html
<h2>Tech Opportunity</h2>
<p>Hi there,</p>
<p>We received a request to reset the password for this email address. Use the link below to choose a new password.</p>
<p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=%2Freset-password">Reset my password</a></p>
<p>If the button does not work, copy and paste this link into your browser:<br>{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=%2Freset-password</p>
<p>This link expires soon. If you did not request this, you can safely ignore this email - your password stays unchanged.</p>
<p>Tech Opportunity<br>Need help? <a href="{{ .SiteURL }}/contact">Contact us</a>.</p>
```

### Owner acceptance checks after authorized activation

Preview each template to check branding, link labels, fallback URL and Contact.
Send signup/resend and reset only to an owner-controlled test mailbox after the
owner gates pass. Check that the canonical callback verifies the link and lands
at Saved or Reset Password, including a second browser/device. Reused/expired
links must not establish a session or claim a successful reset; request a fresh
link through the existing generic UI. Verify the password update and normal
sign-in afterward. These are manual acceptance steps, not completed evidence.
No sending code, credentials, dashboard action or activation is added here.

## Explicitly NOT done

- No real credentials added. No Supabase custom SMTP configured.
- No Resend dashboard configured. No production email sent.
- Production AI stays OFF; deadline-alert delivery stays `generated`-only
  (see boundary invariant — no email claim added).
