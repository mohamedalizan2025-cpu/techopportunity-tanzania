# Auth email readiness (repo-side, SMTP not activated)

Status: PREPARED — copy, tests, and configuration documentation are ready.
Sending is NOT configured. No credentials exist in this branch.

## What this branch contains

- `lib/auth-email.ts`: pure branded builders for the three Supabase Auth
  template bodies (signup confirmation, password reset, resend confirmation).
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
   - Paste the three template bodies from `lib/auth-email.ts`
     (subject + text; adapt the HTML where the dashboard expects it).
   - Confirm the redirect allow-list includes
     `https://techopportunity.tech/auth/callback**`.
3. Send one test signup + one test reset to an owner mailbox; confirm links
   land on the canonical domain and complete sign-in / password update.
4. Never configure staging with production credentials; never commit secrets.

## Explicitly NOT done

- No real credentials added. No Supabase custom SMTP configured.
- No Resend dashboard configured. No production email sent.
- Production AI stays OFF; deadline-alert delivery stays `generated`-only
  (see boundary invariant — no email claim added).
