# Tech Opportunity - Authoritative Engineering Continuity

Updated: 2026-09-09. Read this document FIRST when continuing development.
This is the single authoritative engineering continuity record. Architecture and
milestone documents provide supporting detail and historical evidence; older
operational instructions do not override this checkpoint or current owner instructions.
Earlier contents of this handoff remain available in Git history.

## 1. Exact checkpoint and session boundary

- Product name: **Tech Opportunity**. Historical repository/package/resource names
  such as TechOpportunity Tanzania and events finder-copilot remain unchanged.
- Branch at the resumed staging-preparation start: `main`.
- Verified starting HEAD, local origin/main and network-reported remote main:
  `af6a51b8948d0b42add91d0841f1da01933ac35f` -
  `Document M31 staging baseline`; ahead/behind `0/0`, working tree clean.
- This resumed session remains BLOCKED before database access. The required host
  directory `C:\Users\hp\.tech-opportunity-secrets` was absent, so neither protected
  credential file nor its project reference could be validated. No database connection
  was built and no production or staging SQL was executed. See the
  [M31 staging runbook](M31_STAGING_RUNBOOK.md).
- Latest completed code milestone: `4910d14b337601fe29bb1554b41cff38ec455baf` -
  `Polish Tech Opportunity UI and responsive UX`.
- Verified before the previous documentation close: HEAD and locally recorded origin/main
  both equal that SHA, ahead/behind `0/0`, working tree clean.
- This change is documentation only. Its commit follows the prior documentation checkpoint;
  obtain the actual latest documentation HEAD and remote relationship from Git.
  Do not reset valid documentation to return to the code SHA.
- No staging project was created, no Supabase/environment configuration changed,
  and no migration, database mutation or deployment was executed. Tooling setup
  created and then removed its sole untracked `supabase/.temp/cli-latest` marker;
  no tracked application file was removed.
- The UI commit was pushed. A GitHub deployment record labeled Production for that
  SHA was observed during preparation. This is not a new runtime/security attestation.

Status vocabulary matters: **implemented**, **verified locally**, **verified live**,
**deployed**, **owner action required**, and **planned/future** are distinct claims.

## 2. Established architecture and functioning implementation

The current application is responsive web software built with Next.js App Router,
React, TypeScript, Tailwind, Supabase PostgreSQL/Auth/RLS, and Vercel hosting.
The application boundary is `UI -> lib/data/* -> Supabase`. Database access and
security-sensitive server actions remain outside presentation components.

The trusted discovery architecture is:

`source -> controlled fetch -> normalize -> deterministic qualification -> evidence
-> dedupe -> pending -> human moderation -> published`

- Acquisition crosses `scripts/discovery/fetch.ts` (`fetchPage`), with scheme/host,
  SSRF, redirect, timeout and response-size protections. Source-specific acquisition,
  structured feeds, detail evidence, normalization and deduplication are implemented.
- Qualification is deterministic and evidence-based. Discovery never automatically
  publishes; qualifying inserts are pending. Source identity is not organizer identity.
- Public homepage, opportunity details, keyword search, category/deadline/city/region
  filters, sorting, result feedback, shareable GET URL state and return-to-results exist.
- Accounts provide signup/sign-in, session-aware navigation, safe internal destinations,
  Supabase confirmation callback handling and sign-out. Staff access remains guarded.
- Saved opportunities are owner-scoped, with a protected `/saved` route and suppression
  of unavailable/private opportunity details.
- M30 implements deadline precision/evidence, deadline state derivation, restricted
  change history, private alert preferences and generated in-app alert events.
  Alerts are not email delivery. The alert worker is separately gated and scheduled.
- Discovery health, retained reports, schedule observations, verification classification,
  permanent security boundaries and credential-free milestone CI are implemented.
- M31 trust columns/migration, application mapping, deterministic qualification evidence,
  reference persistence and rollout gates exist in code. Runtime activation is separate.
- AI-related scaffolding/kill-switch code exists, but operational AI and personalization
  remain NO-GO. Presence of code or a passing test is not permission to activate it.

### Repository milestone anchors

| Commit | Established work | Evidence/status limit |
|---|---|---|
| `3276bf6` | M23 permanent milestone verification | See VERIFICATION_CONTRACT.md and verification scripts |
| `485b000` | M24 discovery reliability/health | Implemented reporting; retained observations establish live health |
| `6c17bef` | M25 six-hour discovery cadence | Current workflow remains six-hour |
| `6c1e422` | M26 evidence-accounting corrections | Historical audit did not manufacture scheduled evidence |
| `a7aff39` | M27 public product experience | Homepage, discovery and public presentation |
| `8e17c5d` | M28 search/filter/detail experience | Shared query semantics and URL-state behavior |
| `8bbb553` | M29 accounts and saved opportunities | Auth and owner-scoped saved implementation |
| `122fd39` | M29 auth redirect configuration fix | Explicit canonical origin and safe callback destinations |
| `88373fd` | M30 deadline intelligence and alerts | Implementation complete; current live state is not reprobed here |
| `56e2b26` | M31 evidence-first trust implementation | Rollout remains OPEN |
| `5ade6f1` | M31 legacy publication re-review gate | Tool exists; remediation was not performed |
| `fcfc514` | Country-only trust mapping fix | Completed, tested and pushed |
| `4910d14` | UI/UX product polish | Completed, tested and pushed |

The historical [M26 audit](MILESTONE_26_EVIDENCE_CLOSURE.md) records
NOT_YET_PROVEN schedule readiness at its cutoff. Do not infer current repeatability
from a commit title, cron declaration, or stale counts. Current configured discovery
cron is `0 3/6 * * *` (03:00, 09:00, 15:00, 21:00 UTC). Do not change it now.

## 3. Country-only mapping defect and resolution

Completed commit: `fcfc514145fc21bc7b631eb8b779246cc06826e0` -
`M31 fix country-only trust mapping`.

A row containing only a stored country could lose its location because country
was excluded from the mapper's location-presence check. The shared mapper in
`lib/data/opportunities.ts` now preserves that location. The readiness script uses
the shared mapping path instead of a divergent copy; regression coverage is in
`tests/m31-data-trust.test.ts`.

**A stored country may be preserved as location data, but country text alone must
never become proof of Tanzania eligibility or verified Tanzania accessibility.**
Verified Tanzania requires the corresponding verification state and evidence;
eligibility remains a separate evidence-backed decision. No city/address/venue/
coordinates are required merely to retain a valid country-only location.

## 4. Completed UI/UX milestone

Completed commit: `4910d14b337601fe29bb1554b41cff38ec455baf` -
`Polish Tech Opportunity UI and responsive UX`.

Applied Jakob's Law through familiar navigation, prominent search, grouped filters,
bookmark states, account modes and source-focused detail actions. Improved mobile
responsiveness, information hierarchy, honest trust/uncertainty presentation,
keyboard/focus behavior, contrast and recovery states. Used existing technologies,
CSS and inline SVG without new application dependencies or heavy decorative assets.
No backend/security rules, migration, M31 logic or activation state changed.

Verification reported for that milestone:

- Full suite, TypeScript, lint, 29 permanent boundary checks, diff check and production
  build passed. No expensive suites are being repeated for this documentation close.
- Local production-build browser smoke checks passed; `tests/ui-smoke.mjs` retains
  repeatable checks using external QA-only Playwright tooling, not a project dependency.
- Representative widths: 360, 390, 430, 768 and 1440px; detail also checked at 950px.
- Saved/unavailable/empty/loading/error visual states used isolated local fixtures.
- No authenticated production save/alert mutation or full screen-reader audit was claimed.
- The path-based verification planner requested deployed auth/alert evidence; local
  tests and fixture screenshots do not complete that live evidence requirement.

## 5. M31 remains OPEN - owner-controlled rollout not completed

- `supabase/migrations/0013_m31_data_trust.sql` has NOT been applied to production
  as part of this rollout. Staging application of it has not occurred in this session.
- `M31_TRUST_SCHEMA_ENABLED` has NOT been intentionally enabled for this rollout.
  It was absent from inspected local configuration; remote staging flag state is unknown.
- Corpus remediation, public test-artifact quarantine and legacy requeue were NOT performed.
- Authenticated staging A-versus-B isolation, moderator persistence and controlled
  staging discovery insertion were NOT completed.
- AI remains **NO-GO**. No AI-readiness run against production is authorized now.
- Production activation is **NOT READY**. M31 code being deployed does not mean its
  database schema, feature flag, evidence completeness or security tests are activated.

The [M31 production checkpoint](MILESTONE_31_PRODUCTION_CHECKPOINT.json) records a
historical schema-readiness error `42703` and NO_GO status. Its corpus counts are
historical observations, not a current census. See [M31 design](MILESTONE_31_DATA_TRUST.md)
for the forward-only migration and evidence contract; this handoff governs the next action.

## 6. Exact stopping point: identities supplied, database access/recovery blocked

**STAGING BASELINE NOT ESTABLISHED - OWNER ACTION REQUIRED**

The owner's immutable identities supersede older ambiguous project names:

- **PRODUCTION = `jltuufukcwztugvojwjd`**. Read-only audit/export only in this task.
- **STAGING = `pumzofcwfjqswkiwfqty`**, Tech Opportunity Staging. Owner reports a
  newly created isolated Free project. This session did not create or configure it.
- Both projects are Free per owner. No managed backup availability is assumed.

The owner-specified protected credential directory was absent at its exact host path
on 2026-09-09. Consequently `production-db.env` and `staging-db.env` were unavailable,
and their `TECHOPP_PROJECT_REF` and password-presence gates could not run. The owner-
supplied immutable refs below remain the control values, but they are not a substitute
for credential-file and live-connection identity proof. The sole actual local
application environment points to PRODUCTION. No CLI link was found or created.
Encountering production in a proposed staging operation is an immediate stop.
Owner-supplied staging identity is authoritative but live connection identity,
emptiness and schema have not been independently verified. Production hosting and
worker settings were not reconfigured or independently re-audited this session.

A production read-only REST metadata/aggregate audit succeeded at 2026-09-09 05:46 UTC
after network escalation. URL and credential ref were checked before GET requests;
no RPC or mutation was issued, no secrets printed and no raw rows persisted.
Observed 261 opportunities: 237 pending, 19 published, 5 rejected; 29 known and
232 null deadlines; all 261 have country text. One duplicated opportunity URL
group has one excess row; this alone does not violate per-opportunity reference
uniqueness. Canonical/source URL length and non-null trimmed deadline-evidence
length conflict counts were zero. This is a point-in-time API observation, not a
transactionally consistent SQL audit or current future census.

REST metadata exposes provenance, profiles/saves and M30 history/preferences/events;
country is API-required with default Tanzania. No M31-added columns or
opportunity_references are exposed. Their actual catalog absence is NOT established.
RLS flags/policy bodies, grants, constraints/index definitions, function bodies,
triggers, Auth integration and migration history remain unverified. Missing trust
columns prevented complete evidence/attribution conflict checks. No complete green
compatibility result or actual code blocker was established.

Recovery is OWNER-BLOCKED by the absent protected files. Database tooling is now
ready without application dependency changes: Supabase CLI `2.117.0` works through
one-shot `npx`; Docker client/server `29.7.2` is running; and the official
`postgres:17-bookworm` image is pinned locally at digest
`sha256:051f7b7b3abdd564d5d1bd1e8c4b9c1b6e77087d1dd22020ede611c096a272e0`,
providing PostgreSQL `17.11` psql/pg_dump/pg_restore. Both direct database DNS names
published one AAAA record and no A record from this machine, so the next session
should prefer each Dashboard-provided Session Pooler endpoint unless verified IPv6
connectivity makes direct mode usable. Never guess a pooler region or hostname.
No backup was created or verified; no restore rehearsal occurred.

Selected provisional baseline method: reviewed actual production schema export plus
synthetic staging fixtures (Option A), not migration-history replay. No production
private users/profiles/saves/preferences/alerts were copied, and no fixtures or
staging identities were created. Full catalog/conflict and recovery gates must
precede baseline restore. The runbook preserves the reusable staging target guard,
audit procedure, scope limitations, fixture strategy and verification gates.

No new database-level production catalog/conflict counts were obtained because the
credential gate failed. The 261-row REST observations above remain historical partial
evidence only. No staging backup/restore, full catalog audit, migration, flag
activation, deployment, A/B sessions, moderator writes or trust-field round trips
were completed. Prior
preparation tests (17 M31, 91 account/saved, 53 deadline/alert) remain historical
local evidence; they were not repeated for this documentation-only checkpoint.

### Preparation findings to carry forward

- Require independent immutable project-reference identity for production hosting AND
  production discovery/alert workers; staging must match none of those production refs.
- An empty new project is not a compatible pre-M31 baseline. Establish an approved
  baseline and demonstrated recovery procedure without replaying migrations 0005-0009.
- Inspect actual tables/columns/types, constraints, indexes, policies, grants, functions
  and triggers; migration filenames and IF NOT EXISTS are not compatibility evidence.
- Direct 0013 dependencies include opportunities identity/URL/status/country/deadline,
  discovery provenance including source_id/source_url/discovery_method, deadline_evidence,
  auth.users/auth.uid(), public.is_staff(), and compatible UUID generation.
  Also verify profiles/auth integration, saved tables and M30 history/preferences/events.
- Historical 0006 uses an enum reference source_type; 0013 supplies text expressions and
  leaves an existing reference table unchanged. Treat an enum-backed existing table as
  a compatibility review stop. No actual staging incompatibility has yet been demonstrated.
- Check existing evidence validity, attribution pairs/FKs, duplicate URL pairs/canonical
  references, country defaults/nullability and same-named policy/index/function conflicts.
- Preserve pre/post opportunity ID sets and counts, historical baseline records, reference
  backfill evidence and an auditable staging-only recovery/fixture cleanup path.
- Explicit staging NEXT_PUBLIC_SITE_URL is essential: `lib/auth-redirect.ts` otherwise
  prefers VERCEL_PROJECT_PRODUCTION_URL over VERCEL_URL. Configure the staging Supabase
  Site URL and callback allowlist consistently; never alter production while staging.
- No dedicated target-guarded staging discovery workflow exists. The worker consumes its
  environment; do not inherit production credentials or dispatch the production workflow.
- Preparation SQL/runbook files were written outside the repo to temporary storage and
  were not executed. Do not depend on those temporary files for continuity or treat them
  as certified checks; the required review and gates are preserved here.

## 7. Exact next owner action and subsequent gated sequence

**Owner creates the missing `C:\Users\hp\.tech-opportunity-secrets` directory and
places `production-db.env` and `staging-db.env` at the exact documented paths, with
the existing database passwords and corresponding `TECHOPP_PROJECT_REF` values.**
Do not recreate or reidentify either Supabase project, reset either password, or put
passwords, connection strings, service-role keys or tokens in chat/Git.
The owner may instead perform the production audit/exports on a trusted machine
and supply protected local artifacts. Do not pretend either alternative is complete.

After access exists, the agent can use the prepared isolated tooling, independently
verify the credential files and endpoints, complete read-only production catalog/
conflict audits, create and check protected external recovery artifacts, and construct a reviewed schema-only staging
derivative with synthetic fixtures. Recheck the exact staging target before every
consequential operation. Demonstrate staging recovery and compare relevant catalogs;
record intentional fixture/environment differences. Never copy real production Auth
users or private user data into staging. Follow [M31_STAGING_RUNBOOK.md](M31_STAGING_RUNBOOK.md).

The default task endpoint remains **baseline plus compatibility evidence, then STOP**.
Current recommendation is **NOT READY TO APPLY 0013**. After all owner-listed gates
pass and execution authority is unambiguous, a subsequent migration step may apply
ONLY unchanged `0013_m31_data_trust.sql` through the supported owner SQL procedure;
never replay 0005-0009 or use a blanket migrate/reset operation.
Verify fields, constraints, canonical references/backfill, functions/triggers, RLS/grants
and preservation of rows before enabling the staging flag. Deploy the intended verified
code checkpoint with staging-only variables and explicit staging auth origin.

Then collect genuine staging evidence for public routes and schema reads; anonymous
published-only access; two distinct ordinary user sessions A/B for saves/preferences/
alerts/profiles and cross-user denial; a separate staff identity for moderation and
attribution; M31 persistence/evidence constraints; country-only mapping; controlled
pending discovery insertion; M30 behavior; and representative desktop/mobile UI.
Use staging-only identities/fixtures, not real production users. A/B tests require real
authenticated sessions; an HTTP success with zero affected rows is not a successful
cross-user deletion, so independently verify the protected row survives.

Any actual code/migration incompatibility requires a separately authorized fix before
implementation. Accepted staging evidence permits planning production activation only;
production remains a separate explicit owner-controlled decision.

## 8. Planned post-M31 roadmap - none of this is completed

### 1. Corpus cleanup

After safe M31 closure, review the historical corpus with real evidence. Remove/reject
ambiguity through approved processes; keep unknown eligibility unknown. No cleanup,
quarantine, requeue, bulk deletion or human moderation was performed in this close.

### 2. National / International geography

Planned main user-facing grouping:

- **National:** opportunities occurring primarily in Tanzania / intended for Tanzania.
  Zanzibar, Dar es Salaam, Arusha and other city/region details remain metadata/filters.
- **International:** global/foreign opportunities with genuine evidence that Tanzanians
  can apply, participate or access them. Calling something international is insufficient.

Location grouping must not replace applicant eligibility evidence. This model is not implemented.

### 3. Opportunity taxonomy

Future source/category coverage should address hackathons; climathons/climate innovation
challenges; AI/Data Science challenges; innovation competitions; startup challenges;
fellowships; scholarships; internships; research opportunities; grants; accelerators/
incubators; technology events; conferences; workshops/training; developer programs;
entrepreneurship programs; and selected technology/career opportunities.
These are planned coverage goals, not claims that every category is seeded or operational.

### 4. Discovery sources and authoritative evidence

Potential channels include official websites, government institutions, universities,
companies, NGOs, innovation hubs, event/hackathon platforms, opportunity aggregators,
LinkedIn, Instagram and other legitimate public internet/community sources.

**Where an opportunity is discovered is not necessarily the source trusted for publication.**
Prefer official/authoritative evidence when available. No unauthorized social scraping;
channel aspirations do not activate new sources or authorize acquisition techniques.

After cleanup, establish/update dedicated source and taxonomy documentation covering
source policy/registry, taxonomy, trust/security, National/International classification,
source activation status, evidence requirements and source limitations. Possible files,
only if useful and supported by evidence: SOURCE_POLICY_AND_REGISTRY.md,
OPPORTUNITY_TAXONOMY.md and SECURITY_AND_TRUST.md. They were not fabricated in this close.

### 5. Discovery frequency review

Current cadence remains approximately six hours. Later evaluate approximately two hours
ONLY after M31 closure, proven corpus quality, source rate-limit/cost review, duplicate
handling verification and worker/concurrency review. Source-specific frequencies may be
preferable to fetching every source equally often. No frequency change is authorized now.

### 6. Domain and hosting - mandatory future launch work

A dedicated future milestone must cover final Tech Opportunity domain selection, DNS,
HTTPS, production deployment, Supabase Site URL, /auth/callback, redirect allowlist,
canonical URL, staging/production separation, backup/recovery, monitoring, and hosting
cost/reliability. Preserve low-cost, production-oriented operation. No domain purchase,
connection, hosting migration or launch configuration work occurred during this close.

### 7. Structured profiles, CV context and explainable AI

Only after the trusted corpus is clean, plan education, field of study, skills, interests,
experience, projects and opportunity preferences as structured profile inputs. CV upload
may add context later; it must not be the only source of structured user information.

**trusted opportunities + structured user profile/CV -> explainable personalized recommendations**

AI may help determine usefulness to a particular person. It must not decide that an
uncontrolled internet opportunity is legitimate enough to enter the trusted corpus.
Explainable matching, Opportunity Passport, application readiness, application tracker,
application assistance and institutional distribution remain future work.

## 9. Permanent development and documentation rule

**A meaningful milestone is not closed until implementation, verification, and repository
documentation are consistent.**

Every significant future milestone must update this continuity record. Record completed
implementation, actual verification, deployed evidence, outstanding owner actions and
future plans separately. Never upgrade static tests to live-security proof or planned work
to completion. Preserve exact commits and evidence dates; do not describe old corpus counts
or migration comments as the current live schema.

At session start verify branch/HEAD/origin relationship/working tree and inspect intervening
commits. Read relevant implementation and [verification contract](VERIFICATION_CONTRACT.md).
Use appropriately scoped checks. This documentation-only close requires status/diff review,
link/secret hygiene and `git diff --check`, not an expensive engineering suite.

At this boundary: the current owner request authorized gated pre-M31 staging baseline
preparation, but database access/recovery gates prevented its execution. Stop after
documenting this blocked checkpoint. No migration, production mutation, corpus cleanup,
schedule change, geographic grouping, domain/hosting work or AI activation occurred.
M31 remains OPEN, the staging baseline remains BLOCKED, and AI remains NO-GO.
