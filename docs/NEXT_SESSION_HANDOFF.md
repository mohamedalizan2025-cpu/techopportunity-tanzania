# Tech Opportunity - Authoritative Engineering Continuity

Updated: 2026-09-08. Read this document FIRST when continuing development.
This is the single authoritative engineering continuity record. Architecture and
milestone documents provide supporting detail and historical evidence; older
operational instructions do not override this checkpoint or current owner instructions.
Earlier contents of this handoff remain available in Git history.

## 1. Exact checkpoint and session boundary

- Product name: **Tech Opportunity**. Historical repository/package/resource names
  such as TechOpportunity Tanzania and events finder-copilot remain unchanged.
- Branch at closing-task start: `main`.
- Latest completed code milestone: `4910d14b337601fe29bb1554b41cff38ec455baf` -
  `Polish Tech Opportunity UI and responsive UX`.
- Verified before this documentation edit: HEAD and locally recorded origin/main
  both equal that SHA, ahead/behind `0/0`, working tree clean.
- This closing change is documentation only. Its commit follows the code checkpoint;
  obtain the actual latest documentation HEAD and remote relationship from Git.
  Do not reset valid documentation to return to the code SHA.
- No staging project was created, no Supabase/environment configuration changed,
  and no migration, database mutation, cleanup or deployment was executed during
  staging preparation or this closing task.
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

## 6. Exact stopping point: no safely established staging target

Latest investigation classification:

**NO TRUSTWORTHY STAGING ENVIRONMENT**

**STAGING TARGET NOT SAFELY IDENTIFIED**

One local Supabase target was configured, but no separate staging/preview env file,
Supabase project link/config, Vercel project link or staging-specific workflow was
found. Returned GitHub deployment records were labeled Production. Historical docs
call the development project tto-staging, while later records describe the operational
application/corpus as production. Neither a project name nor `.env.local` proves identity.
The existing Supabase environment must remain untouched until separation is established.
No secrets or local project credentials belong in this record.

Owner-provided constraint: Supabase Free tier. Intended solution: a **second isolated
free Supabase project**, named **Tech Opportunity Staging**, rather than changing or
repurposing the existing production project. This project has not been created or
configured in this session. Do not assume free-project quota or availability; the owner
must confirm it in their account, with no unapproved paid upgrade.

No staging backup/restore, actual catalog audit, migration, flag activation, deployment,
public/anonymous/security requests, A/B account sessions, moderator writes or trust-field
round trips were completed. Local preparation tests passed: 17 M31, 91 account/saved,
and 53 deadline/alert tests. Those are local source/behavior tests, not live RLS proof.
A remote follow-up identity lookup was blocked by automatic approval review's account
usage limit. That tool limitation does not prove anything about infrastructure state.

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

The next session begins with the OWNER's environment identity work, not code changes:

1. Identify the existing production Supabase project reference and operational targets.
2. Create/identify a separate **Tech Opportunity Staging** Supabase Free project.
3. Record its nonsecret staging project reference.
4. Confirm production and staging references are different; verify hosting/worker scopes.
5. Keep service-role keys, database passwords, tokens and other secrets out of documentation
   and chat. Supply any needed access through securely scoped environment configuration.
6. Establish a recoverable staging baseline and demonstrate the recovery procedure.
7. Only then continue M31 staging compatibility checks and the migration process.

After identity/recovery gates, audit actual staging schema and data compatibility. Apply
ONLY unchanged `0013_m31_data_trust.sql` through the supported owner SQL procedure if all
prerequisites pass; never replay 0005-0009 or use a blanket migrate/reset operation.
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

At this boundary: no new milestone, staging provisioning, migration, production mutation,
corpus cleanup, schedule change, geographic grouping, domain/hosting work or AI is authorized.
Stop after documenting/committing the close; the next action is the owner identity gate above.
