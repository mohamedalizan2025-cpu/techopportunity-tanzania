# Current engineering handoff

Updated: 2026-09-13. Read [ENGINEERING_RULES.md](ENGINEERING_RULES.md) before acting.

## Current verified state

- Production runtime code is `070c32fb07f147a79626d9e7988767c5f476f373`
  (`main`/`origin/main` before this closure-only documentation commit).
- Production Supabase: `jltuufukcwztugvojwjd`; isolated staging Supabase:
  `pumzofcwfjqswkiwfqty`.
- M31 is closed; migrations 0013/0014 and the M31 flag remain active. AI remains
  operationally disabled.
- Product Quality & Differentiation planning, Corpus Cleanup Batch 1, read-only
  Batch 2A legacy-publication triage, and the two-record Batch 2B1 production
  re-review are complete.
- Sahara and AAS now satisfy the current M31 publication contract through the
  authenticated production Moderator path. The other 12 legacy published rows
  remain outside the completed authorization and were not touched.
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

Because the required test registration changed `package.json`, the repository's
existing discovery-sensitive path filter also started production Discovery sync run
`34691899256`. Its retained machine-readable result identifies a `push` event, 18
sources attempted / 17 succeeded / 1 isolated failure, 10 qualified candidates, and
`insertedPending: 0`. The run completed successfully and independently confirms that
the promotion inserted no pending corpus row.

The promotion was code-only: Sahara, AAS, the other 12 published rows, and the
pending corpus were not mutated.

## Batch 2B1 production execution

At `2026-09-12T21:27:22Z`, the authenticated production Moderator re-reviewed
Sahara `156b20a2-2cb4-4783-ac9b-518225890ee3`; an independent protected check
passed before AAS was opened. At `2026-09-12T21:36:17Z`, the same authenticated
Moderator re-reviewed AAS `ef8defbb-80ea-483a-94a3-194d2637177b`. Both remained
`published` only after the complete current M31 contract passed.

- **Sahara:** the unsupported legacy `country = Tanzania` value was cleared.
  Country verification remains `unknown`, all location fields remain null, and no
  country evidence was invented. The official Intron page is now canonical; it
  supports voice-AI build/benchmark relevance, eligibility for builders across
  Africa and the diaspora, and the sourced 15 September 2026 deadline.
- **AAS:** the official AAS event site is now canonical. The official site and
  SUZA-hosted circular support the science/technology/innovation scope, eligibility
  for African participants, JNICC on Shaaban Robert Street in Dar es Salaam,
  verified Tanzania geography, and the 30 September 2026 abstract deadline.
- Both rows store `relevant`, `tanzanians_eligible`, rule
  `m31-2026-09-04-v1`, paired `decided_at`/`last_verified_at`, and exact Moderator
  `decided_by = 1caee695-3a00-43e7-85a4-79db4067ba0d`.
- Seven expected `moderator-review` audit rows persist: Sahara country and deadline;
  AAS venue, address, city, region, and deadline. Their evidence URLs retain the
  pre-review canonical pages by the existing audit contract.
- The M31 reference trigger retained all 503 pre-change rows, demoted each old
  canonical to non-canonical, and appended exactly two official canonical rows,
  both attributed to the Moderator. Final references are 505.

Production remains 273 opportunities: 246 pending / 14 published / 13 rejected /
0 expired. The opportunity-ID-set hash remains
`e83809e7c360328e848afb145064f3ab4ea12c2a976fd6d28110278da1c98b12`; all 271
non-target opportunity rows retain hash
`831736c7c61dec1415c401b983fafe3af797267bf623ef06a047edeec7c01f02`.
No row or reference was deleted and no unrelated opportunity changed.

Protected recovery and verification evidence is outside Git at
`C:\Users\hp\.tech-opportunity-backups\20260912T210306Z-pqd-batch2b1\`.
It contains the full pre-change manifest and post-Sahara/final verification reports.
ACL inheritance remains disabled; do not copy these artifacts into Git or an
unprotected location. The previous Ready application deployment remains the code
rollback point; the database manifest preserves the exact pre-change target state.
The protected manifest SHA-256 is
`0BF0CA1F9B32637F1D9F52B9859456F7D4E40D6FAC6A7F49E9EF27684685F28F`; the
final verification SHA-256 is
`7229DA562485C517F6B5BCF6386884A362A2C5FBF1F42746C22DC89F53348911`.

Final read-only HTTP smoke checks returned 200 for the homepage and both exact public
detail routes. Anonymous access to the Sahara published re-review route returned 307
to `/login`; the authenticated Moderator boundary remains required.

## Exact next milestone

**Corpus Cleanup Batch 2B2 — Decisive Legacy-Publication Withhold Cohort.**

This is the bounded six-record cohort already classified with high confidence as
non-opportunities, explicitly excluded, or otherwise decisively unsuitable. It
requires fresh exact-ID production mutation authorization before any status change:

- `98559cb8-183e-482f-972e-ad3b7b3636ba`
- `fdfe3e70-848a-4ceb-a1b8-4cb949826aca`
- `9d967b53-ed32-49f8-a7c5-46f389299d78`
- `f6a0f5eb-5fcb-4692-a3b0-f9d621013d73`
- `1b3649a0-b694-4475-8ed8-2ce0582482e6`
- `3710047a-e8b9-4a9f-a17d-cf39e304ee89`

Do not include the three expired-call rows, the three evidence-acquisition rows,
or any pending row. Do not begin Batch 2B2 without that explicit authorization.

## Continuing constraints

- Repository `.env.local` is production-only and must never be used for staging.
- Recovery details remain authoritative in [DATABASE_RECOVERY.md](DATABASE_RECOVERY.md).
- Production migration history remains deliberately unnormalized; no broad
  `db push`, replay 0001–0012, or migration repair.
- One production Moderator profile exists. Batch 2B1 proved the authenticated
  browser path; a profile row still never authorizes service-role impersonation.
- `scripts/discovery/inspect-live.ts` performs a reversible insert/delete probe
  despite its old read-only label. Do not use it for a no-write audit.
