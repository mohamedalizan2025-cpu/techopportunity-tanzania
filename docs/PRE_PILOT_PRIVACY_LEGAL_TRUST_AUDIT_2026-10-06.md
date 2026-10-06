# Pre-pilot privacy, legal & trust readiness audit 2026-10-06 (AUDIT ONLY)

Method: code + migration + doc inspection of the production tree
(`d6b1a43`). No product changes made. Findings cite exact files; nothing
is guessed. Pilot stays PAUSED until the P0 gate in §15 is implemented.

## 1. Executive verdict

The data architecture is unusually pilot-friendly: minimal collection,
no analytics vendor, no tracking, owner-scoped RLS everywhere, AI
allowlisted and OFF in production, honest in-product copy. **The pilot
is blocked not by the engineering but by missing legal surfaces**:
no Privacy Policy, no Terms, no contact/privacy contact, no user
report path, no account-deletion path, no incident runbook. These are
small builds, not redesigns — but real users must not arrive before
them. PILOT_READY_NOW = NO (5 P0 blockers, §15).

## 2. Current data map (verified, not guessed)

| Data | Purpose | Stored | Access | Retention | Delete? | Correct? | Third parties? | Public? | Disclosed? |
|---|---|---|---|---|---|---|---|---|---|
| Auth identity (email, password hash, session, confirmation state) | sign-in/recovery | Supabase Auth (`auth.users`) | self; owner via dashboard/service | until user deleted | NO self-service | password YES; email NO UI | Supabase (processor) | no | NO policy exists |
| Talent profile (level/field/sectors/types/skills/region/experience/goals; all optional; no name/phone) | For You ordering | `talent_profiles`, owner RLS (`0018`) | self only | until user deleted | PARTIAL (clear fields; no row delete) | YES (form) | none | no | NO |
| Saved opportunities (IDs + timestamps) | bookmarks | `saved_opportunities`, owner RLS (`0011`) | self only | until user deleted/unsaved | YES (unsave) | n/a | none | no | NO |
| Activity (Interested/Applying/Applied + timestamps) | progress tracking | `talent_opportunity_activity`, owner RLS (`0019`) | self only | until user deleted/removed | YES (remove) | YES (change state) | none | no | NO |
| Alert prefs + alert events | deadline reminders | `user_alert_preferences`, `deadline_alert_events`, owner RLS (`0012`) | self only | until user deleted | prefs YES (toggle); events NO path | prefs YES | none | no | NO |
| AI telemetry | quality monitoring | in-memory counters only (attempts/AI/fallback/validation/quota/timeout + latency); NO persistence, NO per-user tracking (`lib/opportunity-intelligence/telemetry.ts`, test-pinned) | nobody (process-local) | process lifetime | n/a | n/a | none (no AI calls in prod; providers staging-only) | no | in-product labels only |
| Campaign aggregates | provider reports | counts only via staff RPCs (`0020`); no identities leave the DB | staff only | campaign lifetime | n/a (no personal data) | n/a | none | no | provider-page copy only |
| Moderation audit rows (actor UUID, reason, timestamps) | accountability | opportunity tables + audit fields (`0015`, `0016`) | staff only | permanent (history preserved by rule) | NO (by design) | NO (new decision supersedes) | none | no | NO |
| Server logs (`console.error` messages only, e.g. `[lib/data]`) | debugging | Vercel/Supabase platform logs | owner/platform | platform-controlled, short | NO user path | n/a | Vercel/Supabase | no | NO |
| Session cookies (Supabase SSR, httpOnly) | auth | browser, essential | user device | session/expiry | YES (sign out) | n/a | none | no | NO |
| localStorage `techopportunity-pwa-dismissed` | install-prompt dismissal | browser | user device | until cleared | YES (clear site data) | n/a | none | no | NO |
| SW cache (static shell/icons/offline; APIs/auth/AI network-only, test-pinned) | offline/PWA | browser | user device | until cleared | YES | n/a | none | no | NO |
| Analytics | — | NONE (no gtag/posthog/plausible/segment anywhere in `app/`+`components/`) | — | — | — | — | none | — | n/a (nothing to disclose) |

Structural note in the user's favor: every user table FKs
`auth.users (id) on delete cascade` — deleting the auth identity
removes profile/saves/activity/alerts automatically. The missing piece
is a *path* to trigger it, not the mechanism.

## 3. Privacy gaps

No Privacy Policy page, route, or footer link exists (footer:
Product / For organizations / Trust→evidence-anchor only,
`app/layout.tsx`). Nothing to fix in wording because there is no
wording. P0: write and ship `/privacy` covering the §2 table in plain
language (what/why/who-accesses/retention/deletion/contact), plus the
vendor list (§14) and the AI-off-in-production statement.

## 4. Data-rights gaps

- View: SUPPORTED for profile/saved/activity (own pages); PARTIAL for
  identity (email shown as "Signed in as", no central "your data" view).
- Correct: SUPPORTED (profile form, password reset); PARTIAL (no email
  change UI).
- Delete account: MISSING (schema cascades make it a small owner-side
  or self-service build; currently only possible via owner
  service-role action — undocumented).
- Delete profile/activity data: PARTIAL (unsave/remove/clear fields;
  no row wipe, no alert-event purge).
- Withdraw optional data: SUPPORTED in effect (every profile field
  skippable/emptyable).
- Privacy contact: MISSING (no route, no address).
P0: account-deletion path (self-service or documented owner-assisted
with SLA) + privacy contact. P1: central data view + email change.

## 5. Terms gaps

No Terms exists. Must cover: listings change and the official source
stays authoritative; no selection guarantee; users verify eligibility
before acting; external links leave the platform; acceptable use;
account responsibility; availability as-is (early-stage, no SLA);
submission rules (legitimate open calls only, review required, no
paid-pass); IP (user content license for review/display; platform
content ownership); suspension/termination basics; proportionate
disclaimer. Flag for owner/legal review: disclaimer strength,
governing law/jurisdiction, age/minors language (§12), takedown
wording. Do not copy-paste foreign ToS; write short plain-language
terms matching actual behavior. P0.

## 6. AI disclosure gaps

In-product disclosure is GOOD and must be preserved verbatim in any
redesign: "AI-assisted explanation based on verified opportunity
data", "never submits on your behalf", trust-page "AI never decides
eligibility", deterministic facts rendered outside/above AI panels,
no auto-invocation (test-pinned: no `useEffect`, slug-only posts),
production AI OFF. Gap: no *policy-level* AI disclosure (what is sent:
bounded opportunity evidence + selected profile fields only; what is
never sent: identity/activity/CVs; providers staging-only today).
P0: one AI section inside Privacy/Terms stating exactly this. No new
UI labels needed.

## 7. Cookies / analytics / storage (actual behavior)

Essential auth cookies only (Supabase SSR); zero analytics cookies or
tools; one localStorage dismissal flag; SW caches static assets only
(APIs/auth/AI network-only). Verdict: COOKIE BANNER NOT REQUIRED,
ANALYTICS DISCLOSURE NOT REQUIRED (nothing exists), COOKIE SETTINGS
NOT NEEDED, ESSENTIAL-ONLY CONFIRMED. P1 (not P0): a two-paragraph
cookie note inside `/privacy` for completeness; revisit the day any
analytics tool is added (which would need its own consent design).

## 8. Reporting / support gaps

No user can report a wrong deadline, bad eligibility claim, expired
listing, suspicious source, or broken apply link from the product; no
contact/support/privacy/report route exists anywhere; submit flow has
no contact surface. Smallest safe MVP (P0): authenticated
"Report a problem with this listing" entry on detail → reason select
(wrong deadline / wrong eligibility / expired / suspicious source /
broken link) + optional 500-char note → new `listing_reports` table
(migration, owner-RLS: insert own, staff read) → existing staff queue
pattern for triage (read-only list first; resolution workflow is P1).
Plus a minimal `/contact` page (report + privacy + provider intents,
no SLA claims beyond "reviewed by a human"). Do not build tickets,
chat, or SLAs.

## 9. Moderation + assisted approval (HUMAN GATE PRESERVED)

Rule (unchanged, `ENGINEERING_RULES.md` + code): Discovery and
submissions create `pending` only; a human decision is the SOLE path to
`published`. Blind auto-publish is NOT allowed — this audit reaffirms
the prohibition. Already deterministic today: source-authority checks,
relevance, eligibility evidence, geography, deadline evidence, dedupe,
qualification completeness, AI-searchable gate, triage buckets,
re-review action, deadline-change history. Safest assisted design
(read-only until the click): per-pending-row "review readiness"
checklist DERIVED from the existing gates (each item pass/fail with
evidence link), surfaced in the queue as "READY FOR REVIEW" only when
all deterministic items pass; approve/reject/unpublish remain human
buttons with verbatim reasons + audit rows. Auto-reject/quarantine:
NOTHING may auto-mutate corpus state — spam stays human-triaged
(triage buckets already route it); quarantine would be a new
visibility state requiring schema + policy review, so P1 at earliest,
default NO.

## 10. Lifecycle gaps

Solid: expired derived + excluded from browse but stored (auditable);
staff re-review action with fail-closed gate; deadline-change history
trigger; moderation queue excludes expired. Gaps (P1): no
stale-verification-age SLA (no trigger re-reviewing records whose
`last_verified_at` is old); no automated broken-source detection
between Discovery passes (relies on user reports — see §8 — and
moderator spot-checks); unknown-deadline records can linger visibly
(by design, honestly labeled — acceptable, monitor). Nothing here
blocks a 5–10 pilot; all three are P1.

## 11. Footer / public trust gaps

Production footer exposes: Explore, For You, Activity, Submit,
Organizations, How-evidence-works. Missing: Privacy, Terms, Contact,
Report-a-problem, AI disclosure anchor, methodology beyond the anchor.
P0 routes: `/privacy`, `/terms`, `/contact` (+ footer links +
`Report a problem` entry on detail per §8). P1: methodology page or
expanded trust section; AI anchor inside Privacy.

## 12. Minors / age

Audience (students, recent graduates, young professionals) plausibly
includes under-18s (school leavers ~17, first-year students). No age
gate, no age field, no parental-consent flow exists. No legal
threshold is asserted here. OWNER/LEGAL REVIEW REQUIRED before broad
use: minimum-age position, whether under-18s may hold accounts, and
what consent wording Terms/Privacy need. P0 = decision + wording, not
necessarily an age gate.

## 13. Incident-response gaps

No incident runbook exists. Scattered coverage only: AI kill switches
(Preview + production env flags), DB recovery docs, generic auth error
handling. P0 (internal doc, not public): one page covering suspected
account compromise (revoke session/reset path), exposed secret
(rotate + redeploy + audit), malicious listing (unpublish + audit +
user notice rule), privacy complaint (log, 30-day response SLA,
deletion path), data-deletion request (cascade procedure + proof),
service incident (status note + rollback point). P1: practice drill.

## 14. Vendor / subprocessor inventory (actual data processors only)

| Vendor | Role | User data? | Status |
|---|---|---|---|
| Supabase | Postgres + Auth (prod `jltu…`, staging `pumz…`) | YES (identity, profiles, saves, activity, alerts) | ACTIVE |
| Vercel | hosting, edge, platform logs | YES (IP/user-agent in logs, short retention) | ACTIVE |
| GitHub | code hosting, Actions | NO user data (build logs may echo test slugs) | INFRASTRUCTURE ONLY |
| Cloudflare Workers | Discovery cron (opportunity data) | NO user data (public listings only) | INFRASTRUCTURE ONLY |
| Google Fonts (`next/font/google`) | build-time font fetch; self-hosted at runtime | NO runtime user data | INFRASTRUCTURE ONLY |
| Gemini / Groq | AI providers | Staging/eval only; ZERO production traffic (AI OFF) | STAGING ONLY, AI OFF IN PRODUCTION |
| Analytics vendor | — | none exists | N/A |

## 15. Pre-pilot release gate (strict)

P0 — MUST COMPLETE BEFORE ANY REAL-USER PILOT (pilot stays paused):
1. `/privacy` shipped + footered (covers §2 table, §14 vendors, AI section, cookie note, retention/deletion/contact).
2. `/terms` shipped + footered (covers §5 list; owner/legal review on disclaimer, jurisdiction, age).
3. `/contact` shipped + footered (report, privacy, provider intents; no SLA claims).
4. Detail "Report a problem" entry → `listing_reports` table → staff triage list (§8).
5. Account-deletion path live (self-service or documented owner-assisted with SLA) + privacy-contact handling (§4).
6. Incident runbook written + owner-read (§13).
7. Minors/age position decided + worded (§12).
P1 — before broader/commercial launch: central data view, email change, alert-event purge, report-resolution workflow, stale-verification SLA, broken-source detection, methodology page, incident drill.
P2 — after pilot: cookie-settings UI (only if analytics ever added), data-export, consent-versioning, quarantine-state review.

## 16. Exact pilot-blocking items

PILOT_READY_NOW = NO. Five blockers: (1) no Privacy Policy,
(2) no Terms, (3) no contact/privacy-contact/report path,
(4) no account-deletion path, (5) no incident runbook — plus the
age-position decision riding with (2). All are small, bounded builds;
none requires re-architecture. Implementation order: Privacy+Terms+
Contact (one milestone, shared footer) → reports table+triage →
deletion path + runbook + age wording → re-run this gate → pilot.

## 17. P0 completion record 2026-10-06 (branch `pre-pilot-trust-readiness`)

Sections 1–16 above are the frozen audit snapshot; this section records
what changed. Reconciled onto the release branch byte-identical from
the local pre-pilot commits (no blind merge, no overwrites).

- P0A COMPLETE: `/privacy` (12 sections, actual data map, vendors,
  AI allowlist, cookies, retention, controls, WhatsApp), `/terms`
  (sources authoritative, no guarantees, providers, as-is),
  `/contact` (owner WhatsApp +255 624 295 705, 7 categories, no SLA),
  footer Trust links, login + profile policy links. Youth wording
  uses the factual form ("designed for students and opportunity
  seekers, including secondary-school and university students") —
  no 18+ gate, no DOB, no invented entity/jurisdiction/SLA.
- P0B COMPLETE: `listing_reports` (migration 0023, reasons 6,
  statuses 4, owner insert/select on published rows, staff triage,
  no anon/provider access, no delete grant) + detail "Report a
  problem" (auth form, anon sign-in + WhatsApp fallback) + `/reports`
  staff queue + privacy/contact copy. Applied to staging with live
  RLS/grant/anon-denial proof, 0 rows. Reports never auto-mutate
  listings (regression-guarded).
- P0C COMPLETE: parameterless `request_own_account_deletion()`
  (SECURITY DEFINER, session-only target, no service-role/admin path)
  + Profile type-DELETE section + login deleted banner + reports
  SET NULL anonymization (migration 0024) + privacy self-service
  wording. Staging cascade proof 16/16 (identity + 5 private tables
  gone, report anonymized, bystander + opportunities intact, zero
  residue). No service-role in app code.
- P0D COMPLETE: `docs/INCIDENT_RESPONSE_RUNBOOK.md` (severity,
  universal flow, 10 playbooks, rotation-once rule, vendor map,
  WhatsApp comms, log template).
- Age position: factual student wording shipped (see P0A); youth/minor
  legal review stays a broader-launch item, not a pilot blocker.
- PILOT verdict: re-evaluated in the final pre-pilot gate (§19 of the
  release task), not here.

## 18. Production migration record 2026-10-06 (target `jltuufukcwztugvojwjd`)

Pre-checks (read-only): `listing_reports` absent, deletion function
absent, 342 opportunities (14 published), 3 auth users, all prereq
tables present. Applied in order: 0023 (sha `DB9F39084371`) then 0024
(sha `D85F639EC050`). Live post-verify PASSED: table + RLS + exactly
the 4 policies + authenticated INSERT/SELECT/UPDATE only, function
present + SECURITY DEFINER, reporter nullable + SET NULL, 0 report
rows, opportunities still 342, users still 3, anon insert + select
both denied live. No other production changes. P0A–D COMPLETE.
