# Current engineering handoff

Updated: 2026-09-12. Read [ENGINEERING_RULES.md](ENGINEERING_RULES.md) before acting.

## Current verified state

- Production runtime code is `070c32fb07f147a79626d9e7988767c5f476f373`
  (`main`/`origin/main` before this closure-only documentation commit).
- Production Supabase: `jltuufukcwztugvojwjd`; isolated staging Supabase:
  `pumzofcwfjqswkiwfqty`.
- M31 is closed; migrations 0013/0014 and the M31 flag remain active. AI remains
  operationally disabled.
- Product Quality & Differentiation planning, Corpus Cleanup Batch 1, and read-only
  Batch 2A legacy-publication triage are complete.
- Batch 2B1 reached its production pre-write gate on 2026-09-12 and stopped
  fail-closed; neither authorized row was mutated. The missing attributable
  published-record re-review capability has now been implemented, verified on
  isolated staging, and promoted to production without a corpus write.
- Sources, discovery cadence, taxonomy, geography logic, schema, migrations, Auth,
  Vercel configuration, and unrelated infrastructure were not changed.

## Batch 1 verified result

At `2026-09-11T19:49:31Z`, the authorized deterministic test-artifact quarantine
was independently verified:

- eight exact records changed status only: three pending and five published became
  rejected;
- opportunity status counts changed from 247 pending / 19 published / 5 rejected to
  244 pending / 14 published / 13 rejected;
- all 271 opportunity IDs and all 501 complete reference rows were preserved;
- all non-status/non-automatic-`updated_at` opportunity fields were unchanged;
- all 263 non-target statuses were unchanged;
- all 10 known deterministic test artifacts are now rejected; and
- production returned HTTP 200 with no quarantined marker rendered on the homepage.

The exact IDs/titles, before/after hashes, transparent verifier correction, recovery
path, and checksums are in [CORPUS_QUALITY_PLAN.md](CORPUS_QUALITY_PLAN.md).

Protected Batch 1 evidence is outside Git at
`C:\Users\hp\.tech-opportunity-backups\20260911T194524Z-pqd-batch1\`. ACL
inheritance is disabled. The pre-change manifest supports exact status rollback;
do not copy it into Git or an unprotected location.

## Batch 2A verified read-only result

On 2026-09-12, a target-guarded anonymous production SELECT confirmed the same 14
published legacy rows. All remain `unreviewed`; stored eligibility and country
verification are unknown, qualification/verification/attribution fields are null,
and no row has M31 deadline evidence. Organizer pages, official documents,
application destinations, deadlines, and eligibility language were inspected. No
production record, status, trust field, reference, schema, or configuration changed.
The closure snapshot was 246 pending / 14 published / 13 rejected = 273
opportunities and 503 references. The two-row/two-reference increase since Batch 1
was independent discovery growth; the 14 published IDs and their 27 references
remained the same.

The exact per-ID findings and evidence links are in
[CORPUS_QUALITY_PLAN.md](CORPUS_QUALITY_PLAN.md). Summary:

- two high-confidence current candidates should be re-reviewed first: Sahara
  CodeSwitch Africa Challenge and the 16th AAS Scientific Conference;
- the other 12 should be withheld unless/until their documented evidence gaps are
  resolved: six decisive non-opportunity/excluded records, three expired calls,
  and three evidence-acquisition records;
- eligibility is supported for three, excluded for two, unsupported for seven, and
  still unknown for two;
- recommendation confidence is high for 11 and medium for three; and
- no duplicate identity was established among the 14.

These are triage recommendations, not moderation decisions. All 14 are still
published and every future write requires exact authorization.

## Batch 2B1 fail-closed pre-write result

At `2026-09-12T03:30:12Z`, a target-guarded service SELECT and an independent
anonymous SELECT verified production ref `jltuufukcwztugvojwjd`, both exact target
IDs, and their still-published state. Production remained 246 pending / 14 published
/ 13 rejected / 0 expired = 273 opportunities with 503 references. Both records
remain in their legacy unreviewed/unknown/unattributed state with null qualification,
verification, and deadline-evidence fields; each retains two references. The other
12 published rows were not touched.

Current primary evidence still supports the planned trust decisions: the official
Intron challenge page explicitly opens Sahara to builders across Africa and the
diaspora, requires a voice-AI build/benchmark submission, and gives 15 September
2026; the official AAS event site and SUZA-hosted circular support the science,
technology and innovation scope, Tanzanian/African participation, Dar es Salaam
venue, official registration/abstract routes, and 30 September 2026 abstract
deadline. Neither target yet satisfies the M31 publication contract because none of
those findings has been written through an attributable Moderator decision.

The write was refused for two independent safety reasons:

- the implemented protected unpublish path is `published → rejected` and status
  only, whereas M31 approval accepts only `pending`; the previously documented
  `published → pending → approve` transition does not exist; and
- exactly one production Moderator profile exists, but no controlled authenticated
  Moderator session was available. The in-app browser had no browser surface and
  Windows Computer Use could not connect to its native helper. Using the service
  role to stamp that Moderator's ID would be impersonation, not valid attribution.

No production write, reference change, schema/configuration change, rollback, or
backup artifact occurred. The recovery baseline remains intact. Temporary read-only
preflight tooling was removed. Production homepage and both exact public detail
routes returned HTTP 200.

## Published re-review blocker resolution

Commit `558e41d` on `staging` adds the smallest permanent transition that was
missing: an authenticated Moderator can reopen the existing review form for one
currently published row, submit the same evidence fields and parser used by pending
approval, and save only when the complete current M31 publication predicate passes.
The write remains `published → published`, is guarded by exact ID, current
`published` status, and prior `decided_at`, and records the authenticated user's ID
plus one decision/verification timestamp. Existing reference and provenance fields
are not part of the payload. Pending approval and protected unpublish remain
separate actions.

No migration, table, role, dependency, service-role shortcut, or second moderation
system was added. The page and action both use `getModerationAccess()` and the
request-scoped Supabase Auth/RLS client. Ordinary authenticated users see the
existing restricted page; anonymous users are redirected to sign-in; both were
also refused when the re-review action itself was submitted.

The exact commit deployed successfully to isolated staging as Vercel deployment
`dpl_HDB1kESr5Wbir5JgcjGmJoLb2tsX`. A staging-only live matrix used three disposable
local-domain Auth identities and five disposable opportunities. It proved:

- Moderator access returned 200; anonymous access redirected with 307 and ordinary
  user access rendered the restricted page;
- incomplete eligibility evidence caused no write;
- an evidence-complete published re-review remained published and persisted M31
  relevance, Tanzanian eligibility, verified geography, deadline/application
  evidence, qualification version, the exact Moderator ID, and paired
  `decided_at`/`last_verified_at` values;
- six applicable `moderator-review` enrichment rows persisted (venue, address,
  city, region, country, and deadline) and the canonical reference count stayed one;
- the pending approval path still published and attributed its disposable row;
- the existing published-management page remained staff-only and available, and
  the protected unpublish status payload/RLS transition still changed only
  `status` (plus automatic `updated_at`) while retaining audit data;
- User A/User B isolation remained intact: User A saw one own save while
  User B saw zero; ordinary/anonymous direct opportunity writes returned zero rows;
  and an unrelated sentinel row was byte-for-byte unchanged.

All disposable staging rows, references, enrichment rows, saves, Auth users,
profiles, and the temporary category were removed. The staging baseline returned
to 6 opportunities / 9 references / 0 Auth users / 0 profiles / 0 saves; opportunity
hash `ab054f0594a72fce6eea4823feb3625a` and reference hash
`585a8bd3bf8f39fcc11e00f67d596b3b` matched their pre-test values. Generated
build/link/rule files, transient credentials, and verification scripts were removed.
The established recovery artifacts were not changed.

## Published re-review production promotion

The staging-to-production audit proved that all scoped runtime/test/boundary files
were identical between production `45283545f466a0a4470d5cc9fc6e03e0f38cdbec`
and the parent of staging capability commit `558e41d`. Cherry-picking that one commit
therefore produced the exact production capability commit
`070c32fb07f147a79626d9e7988767c5f476f373` with only these nine files:

- `app/moderation/[id]/page.tsx`, `app/moderation/decision-form.tsx`, and
  `app/published-management/page.tsx`;
- `lib/data/moderation-actions.ts` and `lib/data/moderation-review.ts`;
- `tests/moderation-review.test.ts`, `tests/published-rereview.test.ts`, and
  `scripts/verification/boundaries.ts`; and
- the test-command registration in `package.json`.

No staging-only verifier, generated artifact, dependency/lockfile change, migration,
schema/RLS change, workflow, source/discovery change, or corpus data accompanied the
promotion. `verify:ci` passed locally, including every test suite, typecheck, lint,
29/29 boundaries, and the planned moderation-auth gate. The production build passed
after the sandbox-only Google Fonts network restriction was removed. GitHub
Milestone verification run `34691899295` passed for the exact runtime SHA.

Vercel completed GitHub production deployment `6409251328` at
`2026-09-12T11:46:23Z`; its immutable URL is
`https://techopportunity-tanzania-rhkwdllft-techopportunity.vercel.app`, and the
canonical production alias serves the same successful deployment. The prior Ready
deployment `dpl_DesgGyWGsQqVEF9hJiqLPRJwki8p` remains the application rollback point;
the protected database recovery baselines and verified manifest were not modified.

Minimum read-only production smoke checks passed:

- the homepage, Sahara detail, and AAS detail each returned HTTP 200;
- anonymous access to Sahara's `mode=published` moderation route returned 307 to
  sign-in, and anonymous published-management access did the same;
- a target-guarded anonymous SELECT independently bound to production ref
  `jltuufukcwztugvojwjd` found both exact records still `published`, `unreviewed`,
  eligibility/country verification `unknown`, all M31 evidence/decision fields null,
  original `updated_at` values intact, and two references each; and
- no production Moderator action was attempted. Moderator-only execution, normal-user
  and anonymous denial, attribution/audit persistence, pending approval, protected
  unpublish, user isolation, and unrelated-row protection remain proved by the exact
  code's staging live matrix and production-bound automated gates.

The promotion was code-only: Sahara, AAS, the other 12 published rows, and the
pending corpus were not mutated.

## Exact next milestone

**Corpus Cleanup Batch 2B1 — Sahara re-review first, then AAS.**

The milestone remains limited to Sahara
`156b20a2-2cb4-4783-ac9b-518225890ee3` first and AAS
`ef8defbb-80ea-483a-94a3-194d2637177b` second. It still requires a
controlled authenticated production Moderator session, fresh evidence and target
checks, protected recovery evidence, one-row-at-a-time verification, and the existing
explicit two-ID authorization. Never use the service role to impersonate a reviewer.

Do not run the all-legacy requeue path, touch the other 12 triaged rows, reject the
189 likely-noise pending signals, change sources/cadence/taxonomy/geography, or begin
AI. Stop after the two exact records.

## Continuing constraints

- Repository `.env.local` is production-only and must never be used for staging.
- Recovery details remain authoritative in [DATABASE_RECOVERY.md](DATABASE_RECOVERY.md).
- Production migration history remains deliberately unnormalized; no broad
  `db push`, replay 0001–0012, or migration repair.
- One production Moderator profile exists, but no controlled authenticated session
  was available during the Batch 2B1 attempt. A profile row is not authorization to
  impersonate its user through the service role. Batch 2B1 must establish that
  controlled session separately.
- `scripts/discovery/inspect-live.ts` performs a reversible insert/delete probe
  despite its old read-only label. Do not use it for a no-write audit.
