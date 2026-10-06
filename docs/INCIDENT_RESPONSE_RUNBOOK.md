# Incident response runbook (internal operations — not a compliance claim)

Status 2026-10-06: minimum viable operations for the real-user pilot.
Covers the product AS BUILT: human-gated publication, owner-scoped RLS,
fail-closed AI (OFF in production), GitHub + Cloudflare discovery
scheduling, Vercel hosting. No certifications claimed, no statutory
deadlines invented, no enterprise process pretended.

Topology in one paragraph: `main` → Vercel Production (Supabase
production); `staging` and feature branches → protected Previews
(isolated staging Supabase). Database changes ship as reviewed forward
migrations with a verified recovery point; application rollback is the
previous Ready Vercel deployment. Secrets live in the Vercel dashboard
and protected local files — never in Git, docs, chat, or logs.

## 1. Severity model

- SEV-0 / CRITICAL — immediate risk to private data, account security,
  malicious application routing, or unauthorized production mutation
  (exposed talent data, compromised production credential, live scam
  apply link, RLS bypass, deletion hitting another user). Contain
  immediately; pause the affected feature or service if needed.
- SEV-1 / HIGH — core trust/security function broken, no confirmed
  broad exposure (wrong authoritative eligibility/deadline causing
  harm, broken auth flow, report triage down during an active issue,
  deletion unavailable).
- SEV-2 / MEDIUM — meaningful reliability/UX problem, no immediate
  privacy/security danger.
- SEV-3 / LOW — cosmetic or minor operational issue.

## 2. Universal flow (every incident, in order)

1. DETECT — name what is observed, not assumed.
2. RECORD — open an incident log (§12) with facts only.
3. CONTAIN — stop further harm first (unpublish, disable, rotate,
   pause — never investigate on a live exposure path).
4. VERIFY SCOPE — confirm environment (production vs staging), affected
   rows/users/routes; do not rewrite history or evidence to do it.
5. FIX / MITIGATE — smallest safe change through the normal gates.
6. VERIFY RECOVERY — re-prove the exact failure is gone.
7. COMMUNICATE IF APPROPRIATE — factual, minimal (§10).
8. DOCUMENT LESSONS — close the log with root cause + follow-up.

## 3. Playbooks (capability-grounded)

A. ACCOUNT COMPROMISE — force a password reset via the recovery flow;
   sign the user out everywhere (Supabase dashboard session revocation
   if needed); inspect the user's saves/activity for tampering; rotate
   nothing else unless a second secret is implicated. SEV-0 if another
   user's data was reachable, else SEV-1.
B. SECRET EXPOSURE — §4, always. Severity follows the secret's power
   (production DB/service-role = SEV-0; analytics-less staging key =
   SEV-1; committed-but-unpushed local value = SEV-2 after cleanup).
C. PRIVACY INCIDENT — §7. Stop the exposure path (unpublish, gate, or
   disable the surface); scope rows/users; verify RLS/auth boundaries
   with the protected catalog (never disable RLS to debug, never
   broaden service-role access as a workaround); contact affected users
   via the owner channel when appropriate.
D. MALICIOUS / FRAUDULENT LISTING — a report NEVER auto-mutates state.
   Verify against the canonical source and the real organization;
   unpublish/reject/re-review through the existing authorized
   moderation actions with a verbatim reason; confirm the listing left
   the public shelf; check whether signed-in trackers need a warning.
   SEV-0 for live scam apply links, SEV-1 otherwise.
E. INCORRECT TRUST DATA (wrong eligibility/deadline/geography/stale
   source) — re-review through the existing staff flow, never silent
   mutation where the workflow requires attribution; SEV-1 if users
   were harmed, SEV-2 otherwise.
F. ACCOUNT DELETION FAILURE — never report success on failure; keep
   account state honest; determine partial deletion via row counts
   (profile/saves/activity/alerts/reports) before any retry; no
   repeated destructive retries until state is known; privacy-contact
   fallback; complete only through the supported deletion path. Never
   restore intentionally deleted private data unless clearly requested
   and technically/legally permissible.
G. PRODUCTION DEPLOYMENT FAILURE — no random production edits. Inspect
   the Vercel deployment, identify the last known-good SHA (previous
   Ready deployment is the code rollback point), establish root cause
   from build/runtime evidence, then roll back via Vercel's documented
   instant rollback or fix forward through staging. Never force-push
   as a first response; never touch the production DB unless the DB is
   the proven cause.
H. DATABASE / RLS INCIDENT — stop the affected write/exposure path;
   confirm production vs staging; inspect policies/grants against the
   0021 contract + migration files; smallest safe fix + cross-user
   isolation regression test; RLS stays on throughout.
I. AI INCIDENT — production AI is OFF, so any AI traffic in production
   is itself the incident: set `AI_OPPORTUNITY_INTELLIGENCE_ENABLED`,
   `SPEND_MODE`, and `PROVIDER_CHAIN` to the fail-closed values and
   redeploy; the deterministic product keeps working. On staging:
   disable first, then investigate (validator, allowlist, provider).
   Never weaken eligibility/trust gates to restore AI output.
J. DISCOVERY / SCHEDULER INCIDENT — publication stays human-gated no
   matter what. Pause the GitHub workflow or Cloudflare schedule if
   needed; inspect source/candidate output; preserve the pending queue
   (no bulk delete, no auto-reject); re-enable only after a clean
   observed run.

## 4. Secret exposure procedure (rotation-loop-proof)

If a real secret is printed, pasted, committed, pushed, or shared:
1. Name the secret TYPE (e.g. "Supabase service-role key") without
   reproducing the value — never paste it again, not even to revoke it.
2. Determine the environment (production vs staging vs local-only).
3. Rotate/revoke ONCE in the provider console; place the replacement in
   the legitimate protected location (Vercel dashboard env /
   protected local file) and redeploy where required.
4. Verify the replacement works; verify the old credential is dead only
   where safely testable without touching production data.
5. Search Git history/working tree for the value's pattern; purge or
   rotate-acknowledge as appropriate.
6. Record the incident (type, environment, rotation completed).
7. STOP. Do NOT rotate again without a NEW exposure — repeated
   rotation without new evidence was a past failure mode and is
   explicitly forbidden.
Real secrets never belong in `.env.example`, docs, chat, Git history,
or logs. Placeholders or empty values only.

## 5. Privacy incident response

Contain → scope (which rows, whose, which environment) → preserve
minimal evidence → verify RLS/auth → fix → verify → communicate.
Do not share affected user details in broad channels. Contact affected
users factually when appropriate via the owner-approved channel. Do NOT
invent statutory notification deadlines; where notification duties may
apply, record "seek appropriate legal guidance based on the incident
and affected users." Incidents involving younger users get heightened
review (direct minimal necessary disclosure, guardian involvement
considered) without inventing age-law requirements.

## 6. Vendor escalation map (actual processors only)

- Supabase (auth/database/user data) — involve for suspected
  platform-side breach, auth outage, or RLS engine doubt. Never send:
  user passwords, raw private rows beyond the minimum case sample.
- Vercel (hosting/runtime/logs) — involve for deployment, edge, or
  log-retention issues. Never send: secrets, private user data.
- GitHub (source/CI) — involve for repo/secret-scanning matters.
  Never send: credentials.
- Cloudflare (discovery scheduler infra) — involve for cron/worker
  misbehavior. Sends no user data; keep it that way.
- Gemini/Groq (AI — production OFF, staging/eval only) — involve for
  provider-side failures or data-use questions. Never send: anything
  beyond the existing allowlisted input, and never production user data.
No premium support channels are assumed; use each vendor's standard
support and status pages.

## 7. Communication principles

Approved public contact: WhatsApp +255 624 295 705 (link
`https://wa.me/255624295705`). Be factual; acknowledge known impact;
no speculation; no unnecessary technical detail; never expose user
identities; no promises before verification. No corporate PR templates.

## 8. One-page quick response

- SECRET LEAK → name type → ROTATE ONCE → update protected location →
  verify → document. No second rotation without new exposure.
- MALICIOUS LISTING → verify source → human unpublish/reject with
  reason → confirm shelf removal → impact check → document.
- PRIVATE DATA EXPOSED → contain → scope rows/users/env → fix →
  verify RLS → communicate / legal review if needed → document.
- PRODUCTION BROKEN → contain → last known-good SHA → root cause →
  Vercel rollback or staged fix-forward → verify → document.
- AI INCIDENT → AI OFF (fail-closed vars + redeploy) → deterministic
  product continues → investigate → document.

## 9. Incident log template

Incident ID: ___ · Detected at (UTC): ___ · Detected by: ___ ·
Environment (production/staging): ___ · Severity (SEV-0..3): ___ ·
Affected feature: ___ · What happened (facts): ___ · Known affected
users/data (ids only, no contents): ___ · Initial evidence (links to
protected artifacts, never secrets): ___ · Containment action + time:
___ · Root cause: ___ · Fix + fixing SHA/PR: ___ · Recovery
verification (exact re-proof): ___ · User communication required?
(what/when/channel): ___ · Vendor involved? (who/what sent): ___ ·
Follow-up items: ___ · Closed at (UTC): ___ · Closed by: ___.

## 10. Document control

Incident records live outside Git with the other protected
operational artifacts (same ACL discipline as recovery material).
This runbook is versioned in Git; incident contents never are.
