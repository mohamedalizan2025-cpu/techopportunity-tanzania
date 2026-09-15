# Current engineering handoff

Updated: 2026-09-15. Read [ENGINEERING_RULES.md](ENGINEERING_RULES.md) before acting.

## Current verified state

- The last pushed documentation closure before this disposition is
  `f8d531d` on `origin/main`. The runtime source SHA remains exact capability
  commit `1645973`, with
  exact-SHA Milestone verification run `34944048614` (success), push Discovery
  sync run `34944048646` (success, 18/18 sources, `insertedPending: 5`),
  Deadline alert evaluation run `34944048667` (success), and GitHub Production
  deployment `6454270624` (immutable URL
  `https://techopportunity-tanzania-ldfkpt53l-techopportunity.vercel.app`,
  state success at `2026-09-15T07:54:09Z`) all correlated to it. Discovery
  schedule health run `34944048624` for the same push failed with a
  missed-slot signal (nominal `2026-09-14T21:00Z` slot, 8.21h observed gap);
  it is recorded below as a schedule-delivery health signal, not a promotion
  defect. The prior runtime source SHA was exact capability commit `71f4a33`
  (GitHub Production deployment `6445415606`, immutable URL
  `https://techopportunity-tanzania-74yru14iv-techopportunity.vercel.app`,
  state success at `2026-09-14T20:06:17Z`), which remains the preserved
  application rollback point. No migration was involved, so no database
  rollback was introduced; the fresh pre-0016 recovery set plus the immutable
  pre-0015 archive and the two-record-resolution manifests remain the
  fallback. This disposition changes no runtime source, deployment, migration,
  workflow, source, or schedule.
- Production Supabase: `jltuufukcwztugvojwjd`; isolated staging Supabase:
  `pumzofcwfjqswkiwfqty`.
- M31 is closed; migrations 0013/0014 and the M31 flag remain active. AI remains
  operationally disabled.
- Product Quality & Differentiation planning, Corpus Cleanup Batch 1, read-only
  Batch 2A legacy-publication triage, and the two-record Batch 2B1 production
  re-review are complete.
- Sahara and AAS now satisfy the current M31 publication contract through the
  authenticated production Moderator path and remain published.
- Batch 2B2 stopped fail-closed when a concurrent six-row unpublish sequence
  included three authorized records and three explicitly out-of-scope records.
  The three-record incident is now resolved by an owner-authorized acceptance of
  their current withheld state after record-specific review; resolution performed
  no production mutation.
- Immediately before production migration 0015, the fresh baseline was 250 pending /
  8 published / 19 rejected / 0 expired = 277 opportunities, with 509 references
  and 8 enrichment-audit rows. Migration and application deployment preserved every
  one of those rows and references exactly.
- Published Unpublish Attribution Hardening is promoted in production. The push also
  triggered existing Discovery sync run `34841308578`, which added exactly two
  pending rows and two references. Read-only reconciliation found both unsuitable
  for retention. Their subsequently authorized resolution stopped before the first
  mutation because the existing pending-rejection path cannot persist a reason.
  Current production is therefore 252 pending /
  8 published / 19 rejected / 0 expired = 279 opportunities, 511 references, and
  8 enrichment rows; no status audit exists because no production unpublish ran.
  Scheduled Discovery sync run `34863515551` (2026-09-14T15:38:42Z) later added
  four pending rows and four references. The 0016 preflight compared every live
  row against the protected deployment snapshot and found zero removals, zero
  status or timestamp changes, both pending targets intact, and both published
  controls intact. Accepted pre-0016 production was therefore 256 pending /
  8 published / 19 rejected / 0 expired = 283 opportunities, 515 references, and
  8 enrichment rows.
- Pending Rejection Attribution Hardening is promoted in production: canonical
  migration 0016, SHA-256
  `7260729EB034098A032042EFAB25D22DB00B83EA4AF01D142AE7DDB8DDC76725`,
  applied to independently guarded production ref `jltuufukcwztugvojwjd` at
  `2026-09-14T20:02:37Z`, and exact capability commit `71f4a33` deployed as
  GitHub Production deployment `6445415606` (immutable URL
  `https://techopportunity-tanzania-74yru14iv-techopportunity.vercel.app`).
  Post-promotion proof found 283 opportunities / 515 references / 8 enrichments
  with zero added, removed, or changed rows versus the pre-change snapshot, zero
  status audits, the exact 0015 function definitions unchanged, and the
  `anon=false` / `authenticated=true` / `service_role=false` grant matrix on
  both RPCs. The push-triggered Discovery sync run `34890838498` succeeded at
  the exact SHA with 18/18 sources and `insertedPending: 0` (11 qualified
  candidates, all duplicates skipped; one duplicate-rate health warning only).
  Both real pending production targets were then rejected with full attribution
  in the Two-Record Resolution below; at that checkpoint production held
  254 pending / 8 published / 21 rejected / 0 expired = 283 opportunities,
  515 references,
  10 enrichments, and 2 status audits.
- The five-row push delta from Discovery run `34944048646` was reconciled
  read-only. Under separate explicit authorization, only Nordic Baltic Youth
  Summit 2026 (`7f4e1806-f041-4960-8525-acd13229fa95`) was rejected through the
  authenticated production Moderator path because its current eligibility is
  restricted to Nordic/Baltic residents and excludes Tanzania. Production is
  now 258 pending / 8 published / 22 rejected / 0 expired = 288 opportunities,
  521 references, 11 enrichments, and 3 status audits. The other four push-delta
  records are untouched; Sahara and AAS remain published and M31-compliant.
- Sources, discovery cadence, taxonomy, geography logic, production Auth, and
  unrelated infrastructure were not changed.

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

## Batch 2B2 fail-closed production result

The pre-write manifest at `2026-09-12T21:55:30Z` verified the production project,
authenticated sole-Moderator browser session, all six exact authorized IDs still
published, 273 opportunity IDs, 505 reference rows, and counts of 246 pending / 14
published / 13 rejected / 0 expired. Fresh official/current evidence remained
decisive for all six; the evidence matrix is in
[CORPUS_QUALITY_PLAN.md](CORPUS_QUALITY_PLAN.md).

Immediately before the automated first unpublish click could execute, the page
refreshed from 14 to 8 live records. Read-only database checks found exactly six
status transitions between `22:08:43Z` and `22:08:54Z`:

- authorized and now rejected: `98559cb8-183e-482f-972e-ad3b7b3636ba` (SUZA HEET
  news), `f6a0f5eb-5fcb-4692-a3b0-f9d621013d73` (UDSM homepage), and
  `3710047a-e8b9-4a9f-a17d-cf39e304ee89` (FSD Tanzania article);
- explicitly out of scope and now rejected:
  `22222c92-9790-4cc6-8f11-66a18d50038e` (IEM),
  `14c76d7b-8d70-4a4a-9131-0ab91697e2c9` (ERASMUS+ KA171), and
  `21dae9a3-991b-48a6-8ab4-7448d1bdc883` (VETA 2027 intake); and
- untouched and still published: `fdfe3e70-848a-4ceb-a1b8-4cb949826aca`
  (Ogilvy), `9d967b53-ed32-49f8-a7c5-46f389299d78` (AIJC), and
  `1b3649a0-b694-4475-8ed8-2ce0582482e6` (30-job aggregate).

Execution stopped before any further UI mutation. All 273 opportunity IDs and all
505 full reference rows remain intact; authorized-target references/audits are
unchanged; Sahara and AAS remain exact, published M31 controls. The six hidden
routes return 404. The remaining Batch 2B2 routes, Sahara, AAS, and the homepage
return 200. The existing unpublish workflow changes only status plus automatic
`updated_at`; it creates no enrichment audit and stores no row-level actor, so the
signed-in Moderator page does not prove who initiated the concurrent actions.

Protected evidence is outside Git at
`C:\Users\hp\.tech-opportunity-backups\20260912T215416Z-pqd-batch2b2\`; ACL
inheritance is disabled. Manifest SHA-256:
`A0610EFDB39DFC885D19A77DEE378A7954AAE88CDBF28B757C78F206C595E7BB`.
Incident-report SHA-256:
`04888C90DAE743CA77F035D53241502E94D915A4C9D3FE9FDC93B1F7F1250C71`.

## Batch 2B2 fail-closed incident resolution

The owner's 2026-09-14 instruction to complete this exact milestone autonomously,
while forbidding further production unpublishes, delegated the bounded disposition
decision for the three out-of-scope records. After a fresh record-specific review,
the accepted outcome is to retain their current withheld state. No restore,
unpublish, status update, audit insertion, schema change, or other production write
was performed.

- `22222c92-9790-4cc6-8f11-66a18d50038e` — the stored
  [NM-AIST course page](https://nm-aist.ac.tz/courses/master-of-innovation-and-entrepreneurship-management-iem/)
  is a standing programme page, not a bounded current call. A separately found
  [official 2026/2027 call](https://nm-aist.ac.tz/event/call-for-applications/)
  included IEM but closed on 10 September 2026; its EAC scholarship is restricted
  to citizens of EAC partner states other than Tanzania. The legacy row still lacks
  current deadline/application evidence and all M31 moderation fields.
- `14c76d7b-8d70-4a4a-9131-0ab91697e2c9` — the
  [official SUZA notice](https://suza.ac.tz/?p=19005) is the real 2026/2027 KA171
  student-mobility call, but its previously verified 24 April 2026 deadline is
  passed, technology scope is not established, and all M31 moderation fields remain
  absent.
- `21dae9a3-991b-48a6-8ab4-7448d1bdc883` — the stored
  [official VETA URL](https://www.veta.go.tz/news/tangazo-la-kujiunga-na-kozi-za-muda-mrefu-veta-kwa-mwaka-wa-masomo-unaoanza-januari-2027)
  was unavailable during the fresh check. The row still has no deadline, deadline
  evidence, direct application destination, or M31 moderation fields and combines
  technical with non-technical courses. Evidence remains insufficient for
  publication.

At `2026-09-14T06:13:36.838Z`, a target-guarded, service-role SELECT independently
bound to production ref `jltuufukcwztugvojwjd` and verified:

- all three incident IDs remain `rejected` with the exact incident `updated_at`
  timestamps;
- their six references remain present and they still have zero enrichment-audit
  rows;
- production remains 273 opportunities / 505 references / 8 enrichment rows with
  246 pending / 8 published / 19 rejected / 0 expired;
- opportunity ID-set hash
  `e83809e7c360328e848afb145064f3ab4ea12c2a976fd6d28110278da1c98b12`
  still matches the pre-incident baseline; the new full opportunity-row hash is
  `d2a2677d390cb177872be9e4bbb23c9cf08c8ccaa937d7aab428ecaec588d525`
  and reference-row hash is
  `b62911b492d5f14f6b8cc1ed1aff6924cdd2764586fdd24dca3a255615eab51d`;
- Sahara and AAS remain published controls, while Ogilvy, AIJC, and the 30-job
  aggregate remain published with their pre-incident timestamps; and
- public HTTP checks returned 404 for all three incident routes and 200 for the
  homepage, both controls, and all three untouched Batch 2B2 routes.

The original pre-change manifest and incident report remain unchanged. The
resolution re-baseline is protected outside Git at
`C:\Users\hp\.tech-opportunity-backups\20260914T060843Z-pqd-batch2b2-resolution\`;
ACL inheritance is disabled and its sole report has SHA-256
`5F2C223E857E3519989BDC031CB4D866AA3525E34314DE9AC09B85A068E6AA9C`.
Temporary read-only tooling was removed.

## Published Unpublish Attribution Hardening — staging verified

Migration [0015](../supabase/migrations/0015_published_unpublish_attribution.sql),
SHA-256
`c6929aac5cb627a370448cadbf171e8ccd35b9aeb8c0a2f6f9365d06395ece14`,
extends the existing `opportunity_enrichments` audit with nullable `actor_id` and
`reason`, permits a constrained `status` audit entry, and installs one
`SECURITY INVOKER` authenticated RPC plus a transaction-bound trigger. The
application uses its request-scoped Moderator client; it never accepts an actor
from the form and never uses a service-role credential.

The exact staging target `pumzofcwfjqswkiwfqty` was guarded independently from
production. A PostgreSQL 17 pre-change schema/data recovery set was created before
the transaction. Migration 0015 committed without changing the six baseline
opportunities. On Ready Preview deployment
`dpl_6rC6Nwt6swTWSVMUDEKEe9KBKbxa`, the live matrix proved:

- anonymous, ordinary authenticated, and service-role RPC calls were each denied
  with PostgreSQL `42501`;
- one authenticated Moderator UI unpublish changed only exact synthetic target
  `f0010000-0000-4000-8000-000000000001` from `published` to `rejected`;
- exactly one audit row recorded that ID, the Moderator UUID, previous/resulting
  statuses, exact reason, and decision time within the measured action window;
- the unrelated published fixture and pending fixture retained their original
  statuses and `updated_at`; a direct unattributed update was rejected and rolled
  back;
- rollback-only live checks confirmed pending rejection and published re-review
  still execute without entering the new transition branch; and
- the exact deployment had zero error- or warning-level runtime logs.

All three tagged opportunities and both tagged Auth users were removed. Final
staging returned to six opportunities (3 pending / 2 published / 1 rejected), nine
references, zero audit rows, zero Auth users/profiles/saves, and zero tagged
fixtures. Temporary credentials, Vercel/Supabase link state, and test tooling were
removed. `npm run verify` passed at exact staging HEAD; the complete local battery
is 723 tests, TypeScript, ESLint, 30 permanent boundaries, and a successful
production build. The initial sandboxed build alone could not fetch Google fonts;
the approved network rerun passed.

The protected recovery/evidence directory is
`C:\Users\hp\.tech-opportunity-backups\20260914T065506Z-published-unpublish-attribution-staging\`.
Its post-cleanup manifest SHA-256 is
`4D55C8C19A5DEB92C7E6D568F3E1B2ADA81FBF58ACFD2A6756820A85A4F4F414`.
No credential pattern was retained. Production ref `jltuufukcwztugvojwjd` was not
mutated, no production corpus cleanup resumed, and no production unpublish ran.

## Published Unpublish Attribution Hardening — production promoted, fail-closed corpus delta

The owner explicitly authorized only the staging-verified production promotion.
Canonical migration 0015, SHA-256
`c6929aac5cb627a370448cadbf171e8ccd35b9aeb8c0a2f6f9365d06395ece14`,
was applied in its existing transaction to independently guarded production ref
`jltuufukcwztugvojwjd`. The production code SHA is
`07b6f407561b9539cdceccc626a5759a47693824`: capability commit `45508956` plus the
legitimate staging documentation commit `07b6f40`. Staging and production capability
trees are identical. Exact runtime-promotion deployment
`dpl_34M1uWRtSBUtGZ5uPF6CL9Wi4k4W` is Ready at immutable URL
`https://techopportunity-tanzania-del1vn8dr-techopportunity.vercel.app` and serves
the verified capability. Repository documentation closure
`06d14f2356eaf61b668c76cfcd02685034c7f621` started no GitHub Actions or Discovery
sync, but Vercel produced runtime-identical Ready deployment
`dpl_6CiJ5sauLKo3YCA7e9no8TN6g6N3` at
`https://techopportunity-tanzania-2ztwf5y5l-techopportunity.vercel.app`; it now
serves the canonical aliases. Pre-capability Ready deployment
`dpl_Fge7BQuuVoGcT3jSRKzqtHKN1cHg` is the application rollback point.

Fresh protected pre-change recovery contains PostgreSQL 17 public schema plain and
custom dumps, a custom public-data dump, parseable archive lists, exact migration
input, ordered corpus/reference snapshots, stable security-catalog snapshots, and
post-deployment evidence. Its directory is
`C:\Users\hp\.tech-opportunity-backups\20260914T112422Z-published-unpublish-attribution-production\`.
ACL inheritance is disabled. The 58 retained artifacts total 4,339,424 bytes; the
20,346-byte manifest SHA-256 is
`CC4CA53597F12285CFAB87781CD1BA776B4995E0010B1CC9BBA1A0734982EB83`.
A credential-pattern scan of retained text evidence found zero hits.

Read-only production verification proved:

- two nullable audit columns, two validated new constraints, two `SECURITY INVOKER`
  functions with `search_path=public`, and one enabled trigger are present;
- RPC execution is `anon=false`, `authenticated=true`, and `service_role=false`;
- direct anonymous and service-role calls fail with PostgreSQL `42501`; an
  authenticated synthetic non-staff claim reaches the RPC and fails with
  `Published unpublish requires an authenticated moderator`;
- the function derives `auth.uid()`, requires `is_staff()`, requires a bounded
  reason, and exact-targets only a currently published ID; its trigger makes the
  audit insertion part of the same transaction;
- all pre-existing policies/functions/triggers hash-identically match their
  pre-change snapshot, so pending approval and published re-review remain intact;
- no Moderator unpublish, reject, or re-review was run, and status-audit count is
  zero; and
- the homepage, Sahara, and AAS returned complete HTTP 200 content, while anonymous
  published-management and moderation access redirected to login. One initial AAS
  request logged a transient Supabase gateway timeout while returning 200; a single
  bounded retry returned the expected content.

The migration plus application deployment preserved the 277-opportunity,
509-reference baseline byte-for-byte at 250 pending / 8 published / 19 rejected /
0 expired and 8 enrichment rows. However, pushing `main` matched the repository's
existing Discovery sync path filter and started exact-SHA run `34841308578`. The
successful run independently inserted two new `pending` opportunities and their two
references at `2026-09-14T12:04:20.983846Z`. Final read-only comparison is 279
opportunities / 511 references, with 252 pending / 8 published / 19 rejected /
0 expired and 8 enrichments. All 277 pre-push opportunities and all 509 references
are byte-identical; none was removed or status-changed. Because the milestone
required zero promotion-process corpus delta, this side effect is an incident and
was failed closed: no attempt was made to accept, reject, delete, or restore either
new row.

## Production promotion corpus-delta reconciliation — completed read-only

The two exact rows and their exact canonical RSS references were inspected without
mutation. The delta is **not accepted** as normal legitimate Discovery growth:

- `61ebe91c-2eb4-41e5-a051-f3efc9aa5873` — the CFJ Fellowship is a genuine,
  current legal/human-rights placement, but technology is incidental rather than
  the opportunity's purpose. It is also the same 2027 CFJ Fellowship already held
  in pending row `39aa6b9d-df93-410e-85f3-fa280afe9cc6`, discovered earlier from
  Opportunity Desk with the same 20 October 2026 deadline and materially identical
  host/eligibility facts. Recommendation: reject the newly inserted duplicate as
  out-of-scope noise.
- `f821f312-18f3-4a0a-8436-e541a9884db3` — the stored OFA article conflates two
  genuine AWARD programs. Its title identifies the 2027 Emerging African Women in
  Science program, while its 6 November 2026 deadline and latter eligibility text
  belong to the separate Women in Agriculture Leadership Program Fellowship. The
  official latter call is restricted to Egypt, Morocco, Ghana, Nigeria, Sierra
  Leone, and Senegal; Tanzania is excluded. Recommendation: reject this ambiguous,
  identity-incoherent record rather than moderate it as either real program.

Both insertions followed the implementation's mechanical pending-only path: one
row, one canonical RSS reference, extracted action/deadline evidence, and no public
visibility. They did not satisfy the intended semantic discovery contract. CFJ's
incidental `technology` wording passed the positive-scope regex and conservative
cross-source dedupe did not equate its materially different title; AWARD's `science`
and application wording passed qualification even though the source article merged
two calls. These are findings only; discovery logic, registry, cadence, and both
pending rows remain unchanged.

At `2026-09-14T14:19:16.375Z`, a production-bound SELECT compared all live rows to
the protected final deployment snapshot. Production remained 279 opportunities /
511 references / 8 enrichments, with 252 pending / 8 published / 19 rejected / 0
expired and zero status audits. There were zero added, removed, or changed
opportunity or reference rows versus that final baseline. The two targets retain
their exact `2026-09-14T12:04:20.983846Z` create/update timestamp and one reference
each. Selecting the new audit columns succeeded; the retained production promotion
evidence still proves the two functions, constraints, trigger, grants, denial
matrix, and unchanged legacy moderation paths. Fresh public checks returned 200
for the homepage, Sahara, and AAS and 307-to-login for anonymous moderation and
published management. No RPC or production mutation was used in this milestone.

## Production promotion corpus-delta resolution — stopped before mutation

The owner explicitly authorized rejection of only
`61ebe91c-2eb4-41e5-a051-f3efc9aa5873` and
`f821f312-18f3-4a0a-8436-e541a9884db3`, one at a time through the authenticated
Moderator path, with an attributable reason for each. Preflight at
`2026-09-14T14:43:10.965Z` independently bound to production ref
`jltuufukcwztugvojwjd` and confirmed both remain `pending`, with null
`decided_by`/`decided_at`, no audit rows, their exact original timestamps, and one
preserved reference each. The older CFJ duplicate remains pending; Sahara and AAS
remain published and M31-compliant. All 279 opportunity rows and 511 reference rows
were byte-identical to the protected final deployment snapshot.

Execution stopped before the first action because the deployed pending-rejection
contract cannot satisfy the owner's required reason audit:

- `decideOpportunityAction` accepts only ID plus approve/reject intent for a
  rejection and writes `status`, `decided_by`, and `decided_at`; it accepts and
  persists no rejection reason;
- the deployed Moderator form exposes no rejection-reason control; and
- migration 0015's reason-bearing status audit is deliberately constrained to
  `published → rejected` with method `moderator-unpublish`, so it cannot truthfully
  represent a `pending → rejected` decision.

Using the current UI would record actor/time but silently discard the owner's exact
reason. Reusing the published-unpublish audit would violate its database constraint
and semantics. No service-role impersonation or alternate write path was used. No
production row, reference, audit, schema, configuration, or recovery artifact was
changed. The existing protected recovery set remains intact, and temporary
read-only tooling plus the agent-created browser tab were removed. Its manifest
still hashes to
`CC4CA53597F12285CFAB87781CD1BA776B4995E0010B1CC9BBA1A0734982EB83` and ACL
inheritance remains disabled. Fresh homepage, Sahara, and AAS checks each returned
HTTP 200.

## Pending Rejection Attribution Hardening — staging verified

Migration [0016](../supabase/migrations/0016_pending_rejection_attribution.sql),
SHA-256
`7260729EB034098A032042EFAB25D22DB00B83EA4AF01D142AE7DDB8DDC76725`,
is the smallest forward extension of the existing audit architecture. It replaces
only the 0015 status-audit shape constraint with a validated two-transition shape,
then adds one `SECURITY INVOKER` `reject_pending_opportunity(uuid,text)` RPC and one
transaction-bound pending-rejection audit trigger. The RPC derives `auth.uid()`,
requires `is_staff()`, validates a trimmed 10–1000 character reason, exact-targets
only a currently pending ID, and writes `status`, `decided_by`, and `decided_at` in
the same transaction whose trigger inserts the status audit. The client cannot
supply an actor or result status. Existing 0015 function definitions and grants are
unchanged.

The exact staging ref `pumzofcwfjqswkiwfqty` was independently distinguished from
production `jltuufukcwztugvojwjd`. Its pre-change baseline was six opportunities
(3 pending / 2 published / 1 rejected), nine references, zero audits, zero Auth
users/profiles/saves, opportunity hash `42b8a2bf3bb5e0d1046e429e6f97d5ab`,
and reference hash `53f01444d043d8b67da835685890e904`. Migration 0016 preserved
every row and both hashes. Ready Preview
`dpl_GHnDVohs4bTtUUcX1cZVG2eW9sKs` served exact capability commit `71f4a33` and
was bound to staging by two exact synthetic public-route fingerprints before any
live mutation. A prior generic Preview failed that guard and performed
no mutation.

The live matrix used two disposable staging Auth users and nine exact synthetic
opportunities. It proved:

- the authenticated Moderator changed only
  `f0160000-0000-4000-8000-000000000001` from pending to rejected with the
  required normalized reason;
- the opportunity and its single status audit recorded the same exact synthetic
  Moderator ID and decision timestamp, plus exact target, previous/resulting status,
  method, and reason;
- missing/short reasons and a direct unattributed Moderator update failed with
  PostgreSQL `22023`, while anonymous, ordinary-user, and service-role RPC calls
  failed with `42501`; all negative targets remained pending with null attribution
  and zero audits;
- pending approval still published and attributed its exact row, published
  re-review remained published under the existing timestamp guard, and the 0015
  RPC still performed an attributed `published → rejected` unpublish;
- ordinary users could not read moderation audits, and an unrelated sentinel row
  plus its complete reference set remained byte-for-byte unchanged; and
- anonymous access to the exact deployed moderation route returned 307 to login;
  runtime error/warning log counts were both zero.

Three fixture-setup verifier mistakes were transparently failed closed and cleaned
before the passing run; none reached a moderation action. Final exact-ID cleanup
returned staging to the same six opportunities, nine references, zero audit/user/
profile/save/tagged rows, and both original hashes. Temporary credentials, query
files, branch movement, Supabase/Vercel link state, and the injected local Vercel
OIDC line were removed. The local `staging` ref was restored to `06155b5`; nothing
was pushed. Protected recovery/evidence is at
`C:\Users\hp\.tech-opportunity-backups\20260914T171728Z-pending-rejection-attribution-staging\`;
its manifest SHA-256 is
`058CEDDFED68003DF53B9AFD7E5A8C0EBF4C1E5AE64D2A5289D0FB6A52C2AA47`.
The post-cleanup consolidated gate passed the complete regression suite, TypeScript,
lint, all 31 permanent boundaries, change classification, and a production build.

Production received no migration, deployment, Auth user, record mutation, audit,
or configuration change. Batch 2B2, the two real pending rejections, bulk moderation,
discovery, taxonomy, registry, cadence, geography, profiles, and AI all remain out
of scope.

## Pending Rejection Attribution Hardening — production promoted, zero corpus delta

The owner explicitly authorized the smallest safe production promotion of the
already-reviewed capability and migration 0016, with failure closure on any
unexpected production drift and no rejection of either real pending record.

Pre-change guard at `2026-09-14T19:40Z` independently bound production ref
`jltuufukcwztugvojwjd` (PostgreSQL 17.6, `server_version_num 170006`) and found
the expected 0015 objects with no 0016 objects. Full ID comparison against the
protected deployment snapshot found zero removals, zero status changes, and four
pending-only additions from scheduled Discovery run `34863515551`, both pending
targets still `pending` with null attribution and original timestamps, and both
published controls M31-compliant. Fresh protected pre-change recovery was created
at `C:\Users\hp\.tech-opportunity-backups\20260914T194854Z-pending-rejection-attribution-production\`:
public-schema plain/custom dumps with parseable archive lists, a full data-only
custom dump plus public plain data dump, ordered 283-opportunity / 515-reference
snapshots with SHA-256 hashes, focused structure/grant evidence, exact migration
input, and a credential scan with zero hits. Its 24 retained artifacts total
1,491,209 bytes; manifest SHA-256 is
`f9adc8ae3251a8ec0f046a7ddc9157f282fa341a94d5b901ddbe7f4953608bd1`.
ACL inheritance is disabled.

Canonical migration 0016 was applied in its existing transaction (plus an outer
failure-stop wrapper) at `2026-09-14T20:02:37Z`; the execution log retains only
the expected transaction notice and the first-apply trigger notice. Post-change
proof found the old status-audit constraint replaced by the validated
two-transition constraint, both new `SECURITY INVOKER` functions and the enabled
trigger present, the exact 0015 function definitions hash-identical
(`b6978138f19f95d57ceec38e5224a6eb` and `181c3a6d581ada094e423cf61ed1483c`),
grants `anon=false` / `authenticated=true` / `service_role=false` on both RPCs,
anonymous and service-role RPC calls denied with PostgreSQL `42501`, a
claim-less authenticated call reaching the RPC denied with
`Pending rejection requires an authenticated moderator`, and corpus counts
identical at 283 / 515 / 8 enrichments with zero status audits.

The docs-only push of `11f100a` started no workflow. The fast-forward push of
exact capability `71f4a33` started four exact-SHA workflows, all successful:
Milestone verification `34890838451`, Discovery sync `34890838498`
(18/18 sources, `insertedPending: 0`, 11 qualified candidates all duplicates
skipped, one duplicate-rate health warning only), Discovery schedule health
`34890838470`, and Deadline alert evaluation `34890838698`. GitHub Production
deployment `6445415606` for the exact SHA is success at
`https://techopportunity-tanzania-74yru14iv-techopportunity.vercel.app`
(the immutable URL is Vercel-SSO-gated; public proof ran on the canonical alias).
Post-promotion comparison found all 283 opportunity IDs and 515 reference IDs
present with zero status or timestamp changes; both pending targets retain null
attribution and one reference each; Sahara and AAS remain published controls.
  HTTP smoke checks returned 200 for the homepage and both controls and 307 to
  login for anonymous moderation and published-management access. No Moderator
  session was used and no production moderation action was attempted then; both
  pending targets were resolved in the next milestone below.

## Pending Rejection Attribution — Two-Record Resolution — completed

  Both records were rejected one at a time through the authenticated production
  Moderator UI (owner browser session; the agent performed read-only
  verification only, with no service-role impersonation and no direct writes),
  each with its exact owner-authorized reason, with the first fully verified
  before the second was touched:

- `61ebe91c-2eb4-41e5-a051-f3efc9aa5873` at `2026-09-14T20:34:56.296352Z` with
  the 164-character duplicate/out-of-scope reason;
- `f821f312-18f3-4a0a-8436-e541a9884db3` at `2026-09-14T20:50:56.474222Z` with
  the 177-character ambiguous-evidence reason.

  Each change wrote exactly `status`, `decided_by` (sole Moderator
  `1caee695-3a00-43e7-85a4-79db4067ba0d`), and `decided_at`, plus one
  `moderator-rejection` audit row whose reason matches verbatim and whose
  `created_at` equals `decided_at`. Full 37-column comparison of all 283
  opportunities against the pre-0016 snapshot shows only these two rows changed;
  all 515 reference rows are byte-identical and both references were preserved.
  The older CFJ duplicate remains pending and Sahara/AAS remain published.
  Final production is 254 pending / 8 published / 21 rejected / 0 expired =
  283 opportunities, 515 references, 10 enrichments, and 2 status audits.
  Protected milestone evidence (post-record-1 and post-record-2 snapshots plus
  the verification report) is at
  `C:\Users\hp\.tech-opportunity-backups\20260914T205438Z-pqd-two-record-resolution\`;
  its manifest SHA-256 is
  `9c829cfcf51185117a2e57a3a62e35f0fedbe14bbab6719479307e788419744c`,
  ACL inheritance is disabled, and retained text evidence has zero
  credential-pattern hits. The frozen pre-resolution manifest
  (`2dd4cc9359e0805d9a01a6f3c2e43963ab55ec59d0da301b6e6a8cba79bbf255`)
  remains the exact rollback baseline.

## Bulk Moderator Actions — staging verified, review GO (incorporated)

Exact capability commit `1645973` (parent `3bf8dc1` = pre-promotion `main`)
holds ten files and no migration, workflow, source, discovery, taxonomy,
cadence, geography, profile, or AI change: `app/moderation/page.tsx`,
`app/moderation/queue-bulk-panel.tsx`, `lib/data/moderation-actions.ts`,
`lib/data/moderation.ts`, `lib/staff-form-state.ts`, `lib/triage-bucket.ts`,
`package.json` (bulk test registration only),
`scripts/verification/boundaries.ts`, `tests/bulk-moderation.test.ts`, and
`tests/queue-filter.test.ts` (filter-shape update only). Bulk rejection is a
bounded orchestration over the existing single-record
`reject_pending_opportunity(uuid,text)` RPC: one normalized 10–1000 character
reason fans out to at most 50 visible pending IDs, each re-checked pending
and committed independently with its own Moderator attribution, timestamp,
and trigger-written audit; stale rows fail per-record without rolling back
successes. There is no bulk approve, no set-based RPC, no direct update, and
no service-role application path. Search and `flag=ambiguous` filters are
view-only hints reusing the labeled triage buckets.

Isolated staging Preview `dpl_ADhgUb2ayrWBgVexxmwkBiG6uG2v` (bound to
`pumzofcwfjqswkiwfqty` by public fingerprint before any action; the
production-bound bulk-branch Preview was abandoned before any selection)
proved served search narrowing, Flagged narrowing, select-all-visible scope,
manual multi-select success with one shared reason, one-success/one-stale
partial failure with distinct per-record audits, anonymous/ordinary-user
denial, and unchanged pending-approval, published re-review, and attributed
unpublish paths. Exact-ID cleanup restored the six-opportunity /
nine-reference baseline hashes with zero errors/warnings. Local gates passed:
33/33 boundaries, bulk and queue-filter suites, TypeScript, ESLint, and the
production build. The bounded promotion review returned GO for this exact
delta. No production action was taken during review.

## Bulk Moderator Actions — production promoted, five-row push delta preserved

The owner explicitly authorized promotion of the already-reviewed exact
capability `1645973` only, with no real bulk rejection or queue cleanup.

Pre-promotion guard independently bound production ref `jltuufukcwztugvojwjd`
and found the expected baseline: 254 pending / 8 published / 21 rejected /
0 expired = 283 opportunities, 515 references, 10 enrichments, and 2 status
audits (opportunity ID-set SHA-256
`88ea863e564cb29ac674eb2b05cffa05114f89409e2db12f0e1c3d51be6015b1`,
reference ID-set SHA-256
`02b2477ffd27d1a491322e55e9d11f9f426a0c634e32d6c83c6f9c44112c73ad`).
Exact ancestry `3bf8dc1..1645973` held ten files with zero `supabase/`,
`.github/`, or `scripts/discovery/` changes. Local `verify:boundaries`
(33/33) and `npm run build` (Next.js 16.3.2) passed at the exact SHA before
the fast-forward push of `main` to `1645973`.

Post-promotion proof (read-only; no Moderator session, no bulk or single
moderation action, no fixture):

- GitHub Production deployment `6454270624` for the exact SHA is success
  (immutable URL above; Vercel-SSO-gated, public proof on the canonical
  alias). Prior production deployment `6445415606` (`71f4a33`) is preserved
  as the code rollback point.
- Exact-SHA Milestone verification `34944048614` succeeded (full regression,
  typecheck, lint, boundaries, production build).
- Exact-SHA Discovery sync `34944048646` succeeded: 18/18 sources, 0 failed,
  12 qualified candidates (7 OpportunitiesForAfricans, 5 OpportunityDesk),
  7 duplicates skipped, `insertedPending: 5` (all OpportunityDesk).
- Exact-SHA Deadline alert evaluation `34944048667` succeeded.
- Immediately after the push, production held 259 pending / 8 published /
  21 rejected / 0 expired =
  288 opportunities, 521 references, 10 enrichments, and 2 status audits. The
  five new pending rows (all `pending`, null attribution, created
  `2026-09-15T07:55:03Z`) are `6fec5039-8e0e-40ba-b32e-5eac94a439e9`,
  `7f4e1806-f041-4960-8525-acd13229fa95`,
  `0d207c0d-c3eb-4b42-a029-42f8d2c9445c` (two references),
  `a2b70fe1-bfaa-4c74-9c65-e139a140049e`, and
  `fb12a207-4651-480e-adb7-0a97d8539d1e` (one reference each otherwise).
  All pre-existing rows, both published controls, both prior rejection
  attributions/audits, and all 515 prior references are intact; enrichments
  and status audits are unchanged at 10 and 2. The five inserts are preserved
  untouched for separate reconciliation; they were not moderated here.
- Schedule-health observer `34944048624` reports a missed nominal
  `2026-09-14T21:00Z` slot (8.21h observed gap; latest retained scheduled
  success `34909932133`); the same `scheduled_run_missed` critical anomaly is
  retained in the push Discovery report. This is a schedule-delivery health
  signal predating the push, not a defect of the code change (which touches
  no schedule, workflow, or discovery file). Six-hour repeatability remains
  `NOT_YET_PROVEN`; no cadence change was made and no threshold was weakened.
- HTTP smoke checks on the canonical alias returned 200 for `/` and 307 to
  login for anonymous `/moderation` and `/published-management` access.
  Approval, re-review, pending rejection, and attributed unpublish paths
  remain intact by the exact-SHA regression suite plus unchanged live RPC
  definitions and grants (no DDL ran).

Sources, discovery cadence, taxonomy, National/International, profiles, AI,
and later roadmap work were not changed.

## Five-row push-delta reconciliation — completed read-only

Discovery run `34944048646` (push, exact SHA `1645973`, 18/18 sources,
12 qualified, 7 duplicates skipped) inserted five pending rows with six
canonical references at `2026-09-15T07:55:03Z`. All five were re-read from
production ref `jltuufukcwztugvojwjd` without mutation. At that read-only
checkpoint, each remained `pending` with null `decided_by`/`decided_at` and its
original timestamps; production held 259 pending / 8 published / 21 rejected /
0 expired = 288 opportunities, 521 references, 10 enrichments, and 2 status audits.
Title screens for `Earhart`, `IAIFI`, `Catalyst`, `Nordic`, and `Maple` each
match only the new row itself: no duplicate of any existing corpus record.
All five came through the mechanical pending-only path (one row, canonical
RSS reference, extracted action/deadline evidence, no public visibility).

Disposition matrix (findings only; no approval, rejection, or cleanup ran):

- `6fec5039-8e0e-40ba-b32e-5eac94a439e9` — Digital Science Catalyst Grant
  2026 (up to £25,000). Genuine international tech grant: AI agentic tooling
  for research is the program's purpose, deadline 5 October 2026 is extracted
  with evidence, category `grant`. Unique, actionable bounded call.
  Eligibility and country verification are `unknown`; only the OpportunityDesk
  aggregator page stands as evidence. In broad tech-grant scope, Tanzania
  access unverified. Recommendation: remain pending; needs stronger evidence
  (official organizer page plus eligibility).
- `7f4e1806-f041-4960-8525-acd13229fa95` — Nordic Baltic Youth Summit 2026.
  Genuine event, deadline 20 September 2026 with evidence, category
  `conference`. Unique. But the stored description restricts applicants to
  residents of Denmark, Estonia, the Faroe Islands, Finland, Greenland,
  Iceland, Latvia, Lithuania, Norway, Sweden, and Åland — Tanzania is
  excluded on the face of the evidence, as with the earlier AWARD
  Tanzania-excluding record. Non-actionable for Tanzanians and out of scope.
  Recommendation: reject later with a Tanzania-exclusion reason under
  separate owner authorization.
- `0d207c0d-c3eb-4b42-a029-42f8d2c9445c` — Maple Global Innovation
  Fellowship 2026. Ambiguous identity: the description is the title alone,
  deadline is null/`unknown` with no evidence, eligibility and country are
  `unknown`, and the second reference is the bare OpportunityDesk feed URL
  rather than corroboration. Genuineness, bounds, and currency cannot be
  established from stored evidence. Unique, non-actionable as stored.
  Recommendation: remain pending; needs stronger evidence, otherwise reject
  later as unverifiable noise under separate authorization.
- `a2b70fe1-bfaa-4c74-9c65-e139a140049e` — NSF IAIFI Fellowship 2027–2030
  (MIT). Genuine prestigious AI/physics fellowship, deadline 7 October 2026
  with evidence, full program description, category `fellowship`. Unique,
  actionable bounded call. Tanzania is not excluded on the face of the
  evidence (early-career researchers; J-1 route for outsiders); verification
  remains `unknown` and only the aggregator page stands as evidence. In
  tech scope. Recommendation: remain pending; needs stronger evidence
  (official MIT/IAIFI page).
- `fb12a207-4651-480e-adb7-0a97d8539d1e` — Amelia Earhart Fellowship 2027
  (up to $12,000, Zonta). Genuine long-running fellowship for women PhD
  aerospace researchers of any nationality, deadline 15 November 2026 with
  evidence, category `fellowship`. Unique, actionable bounded call. Tanzania
  is not excluded on the face of the evidence; verification remains
  `unknown` with aggregator-only evidence. In STEM scope. Recommendation:
  remain pending; needs stronger evidence (official Zonta page).

The push delta is **accepted** as legitimate mechanical Discovery growth:
pending-only inserts with intact prior rows, references, attributions, and
audits — no incident, unlike the earlier two-record delta. Acceptance covers
growth mechanics only; no record was accepted as publication-ready and all
five remained pending at that checkpoint. The later Nordic disposition is
documented below. The missed-schedule signal (`34944048624`, nominal
`2026-09-14T21:00Z` slot) is preserved unchanged: this milestone alters no
schedule, workflow, discovery, cadence, or threshold.

## Five-row Discovery delta — Nordic single-record disposition completed

The owner explicitly authorized rejection of only
`7f4e1806-f041-4960-8525-acd13229fa95` (Nordic Baltic Youth Summit 2026) through
the authenticated production Moderator path. Before mutation, independent guards
bound `.env.local`, its service credential, and the served application to production
ref `jltuufukcwztugvojwjd`. The exact row was still pending with null attribution,
one reference, and no status audit; the other four run-`34944048646` rows were also
pending and untouched. Production was 288 opportunities / 521 references /
10 enrichments at 259 pending / 8 published / 21 rejected / 0 expired. Sahara and
AAS were published and satisfied the M31 contract.

The stored description and served review form both restrict applicants to residents
of Denmark, Estonia, the Faroe Islands, Finland, Greenland, Iceland, Latvia,
Lithuania, Norway, Sweden, and Åland. A same-day recheck of the official Nordic
Baltic Youth Summit [application page](https://www.nordicbalticyouthsummit.com/)
returned the same exhaustive residency requirement, so Tanzania remains excluded.
The served exact-title filter showed one of 259 pending;
the record's public detail route returned 404. A protected pre-change snapshot of
all opportunity, reference, and enrichment rows plus the exact target/reference was
created before the action.

The Moderator rejected that one row at
`2026-09-15T08:19:40.930778Z` with this exact 200-character reason:

> Rejected because documented eligibility is limited to residents of Denmark,
> Estonia, the Faroe Islands, Finland, Greenland, Iceland, Latvia, Lithuania,
> Norway, Sweden, and Åland; Tanzania is excluded.

The database derived sole Moderator
`1caee695-3a00-43e7-85a4-79db4067ba0d` and the decision timestamp. Exactly one
`moderator-rejection` audit records the target ID, `pending → rejected`, the same
actor, verbatim reason, and `created_at = decided_at`. The opportunity retained its
complete discovered data and its one reference. Full post-action comparison proves
all other 287 opportunity rows byte-identical (non-target SHA-256 before/after
`ec5869787c2e7feb4c07ae77598716ddad8d7bf49b14959283a974ed805d89a8`)
and all 521 reference rows byte-identical (SHA-256 before/after
`b85647e98289aec783eaf0a70f2533a8238843697d4bd1ee323752ae0b858e24`).
The other four push-delta records remain exactly unchanged and pending. Sahara and
AAS remain byte-identical, published, M31-compliant, and publicly served with HTTP
200. The exact-title queue filter now shows zero of 258 pending and the rejected
record's public route remains 404.

Final production is 288 opportunities / 521 references / 11 enrichments at
258 pending / 8 published / 22 rejected / 0 expired, with three status audits.
Protected pre/post snapshots and the machine-readable comparison are outside Git at
`C:\Users\hp\.tech-opportunity-backups\20260915T081312Z-pqd-nordic-disposition\`.
Its nine files total 1,572,298 bytes; manifest SHA-256 is
`4a77ae46fb2c1be56ec1a1ed796ba481364e446666ed4a3caa7a5ac57753fdd3`,
ACL inheritance is disabled, and its credential-pattern scan found zero hits.
Temporary verification tooling was removed. No bulk action, other queue mutation,
deployment, Auth/configuration change, discovery change, or later roadmap work ran.

## Ordered near-term roadmap

The authoritative roadmap is [PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md). Its order is:

1. **Pending Rejection Attribution Hardening** *(promoted and both real pending records resolved with full attribution; closed)*
2. **Bulk Moderator Actions + Ambiguous Queue Cleanup** *(promoted as exact `1645973`; the authorized Nordic single-record disposition is complete; ambiguous-queue batch planning next)*
   - multi-select
   - select-all-visible
   - bulk reject/withhold
   - rejection reason
   - confirmation
   - per-record attribution/audit
   - safe partial-failure handling
   - filter/flag for likely ambiguous or weak-evidence records
3. **Finish legacy public-corpus cleanup**
4. **Source credibility/source registry**
5. **Discovery quality review and move from ~6-hour cadence toward ~2-hour cadence if verified safe**
6. **National vs International classification**
7. **Opportunity taxonomy improvement**
8. **Showcase readiness for Sahara Sparks and Tech & AI Expo**

## Ambiguous-queue batch planning — completed read-only

Production ref `jltuufukcwztugvojwjd` was censused read-only (SELECT only):
258 pending, zero with any attribution, by category `other` 185 /
`fellowship` 42 / `grant` 20 / `scholarship` 5 / `internship` 3 /
`conference` 2 / `competition` 1; triage buckets 1:27 / 2:70 / 5:1 / 6:2 /
7:152 / 8:6 (158 flagged). Deadlines present on 42 rows, absent on 216;
eligibility `unknown` on 255, `tanzanians_eligible` on 3. No approval,
rejection, bulk action, deployment, or configuration change ran. Broad sector
coverage was never treated as noise: only expiry, face-evidence exclusion,
exact-duplicate page furniture, and non-opportunity identity qualify rows.

Frozen reason-homogeneous batches (each far below the 50-row bulk cap; verify
each fully before touching the next; stop on any drift):

- **Batch 1 — expired calls (6 rows, FIRST).** Every stored deadline is
  corroborated by an explicit in-description deadline sentence, all before
  2026-09-15: `93519585-8b2d-467a-ab1b-d93f45058c3b` AfricaCDC Youth
  Pre-Conference 2026 (13 Sept, 17:00 EAT); `d3ffb857-63f3-4c53-96af-f59d5d8e8788`
  JICE Japan-Africa Youth Program 2026 (8 Sept, system auto-closed);
  `38a7ef5c-be94-4148-9815-4ee477dc86ce` AREF Towards Leadership 2026/2027
  (8 Sept); `8545c0ab-cfef-4da2-a6ab-480111995010` JICE Professionals Japan
  Visit for Co-creation 2026 (8 Sept, system auto-closed);
  `937caef1-8ff3-4b97-9d05-52e20ae508f2` Claude Campus Ambassador 2026
  (12 Sept); `d9b1097c-dd1c-402a-b2db-121a98ed2fe0` African Food Baskets
  Country Researchers 2026 (6 Sept). All `pending`, null attribution, two
  sources (OFA/OD). Proposed shared reason: "Rejected as expired: each
  listed call's stated application deadline has passed (deadlines 6–13
  September 2026), so none remains actionable."
- **Batch 2 — EBID cross-source pair (2 rows).** `346c2d6a-e825-49c6-90e7-f34413216493`
  (OFA) and `e129c166-d20e-4536-a3e4-bc8a95de9763` (OD) hold the same EBID
  Young Professionals Programme 2026 (deadline 30 Oct 2026) from two
  aggregator extractions, and both descriptions require ECOWAS Member State
  citizenship (Benin through Togo), which excludes Tanzanian applicants.
  Proposed shared reason: "Rejected: the programme requires ECOWAS Member
  State citizenship and holds Tanzania-excluding evidence; the same call is
  held twice across two aggregator extractions."
- **Batch 3 — AWARD single (1 row).** `51e23a07-2210-4bf1-9b36-98d707215efa`
  AWARD Women in Agriculture Leadership Program Fellowship 2026 [Cohort 2]
  (deadline 6 Nov 2026, evidenced `date`) limits applicants to six listed
  countries excluding Tanzania. Single-reject through the attributable path
  as with the Nordic precedent. Proposed reason: "Rejected because documented
  eligibility is limited to Egypt, Morocco, Ghana, Nigeria, Sierra Leone, and
  Senegal; Tanzania is excluded."
- **Batch 4 — exact-duplicate page furniture (6 rows).** `db42c5f4`,
  `5314b299`, `db214504`, `7aeda1ce` all titled Quick Links/QUICK LINKS and
  `e6d8f260`, `a53ee125` titled Latest News (descriptions ≤11 chars, no
  deadlines). Site-navigation text, not bounded opportunities. Proposed shared
  reason: "Rejected: the row holds site-navigation or section-header text
  captured from an institutional page, not a bounded opportunity."

Explicitly staying out (evidence uncertain): the 3 `tanzanians_eligible` rows
(`395f5611` ARC-GSSP, `639267c7` ASU Mastercard, `55590933` Leaders of Africa
— positive eligibility decisions already stored); the 3 same-day-deadline rows
(`d8caf136`, `363cc7cb`, `6db9cabc` — intraday expiry uncertain);
`1241a0bd` Schlumberger (Tanzanians plausibly eligible); all future-deadline
actionable rows including Catalyst `6fec5039`, IAIFI `a2b70fe1`, Earhart
`fb12a207`; Maple `0d207c0d` (needs stronger evidence); thin-but-real program
extractions (`8cb3e7a7` World Bank YPP, `b7809dde` EMA Traineeship,
`ea6bcc5d` Kenya AI Accelerator, and similar — extraction truncation is not a
non-opportunity verdict, title-by-title review required); the older CFJ
duplicate `39aa6b9d` (genuine placement under review); bucket-1
actionable-looking rows generally; and the ~108 remaining short-description
institutional rows (candidate pool for later batches, none frozen here).

Per-batch verification/rollback: protected pre-batch read-only snapshot
(exact IDs, pending/null-attribution/timestamps, reference counts, corpus
counts) outside Git with manifest; execute only via the authenticated
Moderator bulk/single path with the exact authorized reason; post-batch prove
each row rejected with sole-Moderator attribution, matching timestamps, one
verbatim `moderator-rejection` audit each, all non-target rows byte-identical,
counts reconciled, and HTTP smoke (homepage 200, rejected routes 404,
anonymous moderation 307). No application rejected→pending path exists, so
rollback is a separate owner-authorized DB-level status restoration from the
pre-batch snapshot plus audit deletion (Batch 1 precedent).

## Bulk Production Cleanup — Batch 2 authorization gate: GO (read-only)

On 2026-09-15 the two frozen EBID rows were independently re-read from
production ref `jltuufukcwztugvojwjd` without mutation. Both remain `pending`
with null `decided_by`/`decided_at`, original 2026-09-02 timestamps, one
canonical reference each, and zero status audits. Production is unchanged at
252 pending / 8 published / 28 rejected / 0 expired = 288 opportunities.

Both rows hold the same underlying programme: EBID Young Professionals
Programme 2026, Lomé HQ, two-year trainee contract with six-month probation,
P1-1 grade, and the same 30 October 2026 deadline — discovered four seconds
apart from OpportunitiesForAfricans (`346c2d6a-e825-49c6-90e7-f34413216493`)
and OpportunityDesk (`e129c166-d20e-4536-a3e4-bc8a95de9763`). Both stored
descriptions require ECOWAS Member State citizenship; the OpportunityDesk
extraction enumerates all fifteen members (Benin through Togo), and Tanzania
— an EAC/SADC member, never ECOWAS — is absent. Same-day third-party
corroboration (OFA, ScholarshipsAndAid, MSME Africa, SmartyAcad, Opportunity
Universe) quotes the identical citizenship requirement against the official
EBID programme page. The call is current (deadline 30 October 2026, future)
and both aggregators are concurring second-hand sources for the same
organizer-published call.

Authorization-ready two-record batch (NOT executed here): reject exactly
`346c2d6a-e825-49c6-90e7-f34413216493` and
`e129c166-d20e-4536-a3e4-bc8a95de9763` in one authenticated Moderator bulk
action with this exact shared reason:

> Rejected: the programme requires ECOWAS Member State citizenship and holds
> Tanzania-excluding evidence; the same call is held twice across two
> aggregator extractions.

The reason is evidence-safe for both rows: each stored description states the
ECOWAS-citizenship requirement and both rows are the same call. Expected
post-mutation proof: both `rejected` with sole-Moderator attribution,
matching timestamps, one verbatim `moderator-rejection` audit each with
`created_at = decided_at`; all other 286 opportunities and all 521 references
byte-identical; 250 pending / 8 published / 30 rejected; homepage 200,
rejected routes 404, anonymous moderation 307. No Batch 3/4 row, stay-out
row, deployment, discovery, or later work is in scope.

## Bulk Production Cleanup — Batch 2 EBID pair completed (recovered closure)

The production bulk rejection already succeeded before the executing session
was interrupted: at `2026-09-15T10:16:28Z` and `2026-09-15T10:16:29Z` the
authenticated Moderator bulk workflow rejected exactly the two frozen EBID
rows with the exact authorized shared reason. No rejection was repeated here.

Codex's protected pre/post evidence at
`C:\Users\hp\.tech-opportunity-backups\20260915T100555Z-pqd-bulk-cleanup-batch2-ebid\`
was preserved byte-for-byte without replacement: pre/post full
opportunity/reference/enrichment snapshots, pre-targets, pre-manifest,
verification report, and manifest (10 files, credential-pattern scan zero
hits). Manifest SHA-256 is
`f30d928384d7334da331c836b734a53a9ab24b6fe1eb020327691b2209ab2e40`;
the pre-manifest already proved both targets pending with null attribution,
one reference each, zero audits, and M31-compliant Sahara/AAS controls.

Independent read-only re-verification on 2026-09-15 confirms the retained
post-report exactly: `346c2d6a-e825-49c6-90e7-f34413216493` and
`e129c166-d20e-4536-a3e4-bc8a95de9763` are `rejected` with sole Moderator
`1caee695-3a00-43e7-85a4-79db4067ba0d`, matching decision timestamps, one
verbatim `moderator-rejection` audit each with `created_at = decided_at`,
and one preserved reference each. Non-target opportunity hash is unchanged
(`f53ee254f172fbfaeabb6401984ba3e1fcb5dc883dcbfe1fdd2e6117b7843fd3`)
and the reference hash is unchanged
(`b85647e98289aec783eaf0a70f2533a8238843697d4bd1ee323752ae0b858e24`).
Production is 288 opportunities / 521 references / 19 enrichments at 250
pending / 8 published / 30 rejected / 0 expired. Sahara and AAS remain
published; retained route health is homepage 200, rejected routes 404,
anonymous moderation 307. The interrupted session's temporary verifier
`.tmp-ebid-batch2-production.mjs` was confirmed temporary (runtime-guarded
pre/post tooling only, no secret values) and removed. No Batch 3 row,
stay-out row, UX-branch, deployment, discovery, or later work was touched.

## Bulk Production Cleanup — Batch 3 authorization gate: GO (read-only)

On 2026-09-15 the frozen AWARD row was independently re-read from production
ref `jltuufukcwztugvojwjd` without mutation. `51e23a07-2210-4bf1-9b36-98d707215efa`
("AWARD Women in Agriculture Leadership Program Fellowship 2026 [Cohort 2]",
category `fellowship`, OpportunityDesk) remains `pending` with null
`decided_by`/`decided_at`, original 2026-09-14 timestamps, one canonical
reference, and zero audits. Production is unchanged at 250 pending /
8 published / 30 rejected / 0 expired = 288 opportunities. The stored
deadline is 6 November 2026 (`date` precision with evidence), so the call is
current. The stored description requires applicants to "be nationals of the
target countries: Egypt, Morocco, Ghana, Nigeria, Sierra Leone, and
Senegal" — Tanzania is excluded on the face of the evidence. Same-day
corroboration from the official AWARD call (awardfellowships.org: second
cohort open until 6 November 2026 for scientists in exactly those six
countries; "be nationals of target countries and residing in Africa")
matches the stored record verbatim, and independent third-party pages quote
the identical country list. This is the clean latter-call record, distinct
from the already-rejected conflated `f821f312` row.

Authorization-ready single-record disposition (NOT executed here): reject
exactly `51e23a07-2210-4bf1-9b36-98d707215efa` through the authenticated
production Moderator path with this exact 134-character reason:

> Rejected because documented eligibility is limited to Egypt, Morocco,
> Ghana, Nigeria, Sierra Leone, and Senegal; Tanzania is excluded.

Expected post-mutation proof: the row `rejected` with sole Moderator
`1caee695-3a00-43e7-85a4-79db4067ba0d`, matching decision timestamps, one
verbatim `moderator-rejection` audit with `created_at = decided_at`, and its
preserved reference; all other 287 opportunities and all 521 references
byte-identical; 249 pending / 8 published / 31 rejected; homepage 200,
rejected route 404, anonymous moderation 307. No Batch 4 row, stay-out row,
UX-branch, deployment, discovery, or later work is in scope.

## High-confidence batch expansion — planned read-only (Batch 5 frozen)

On 2026-09-15 the 250-row pending queue was re-censused read-only from
production ref `jltuufukcwztugvojwjd` (AWARD `51e23a07` still pending, Batch 3
gate undisturbed). No new expired calls (Batch 1 cleared them; three
same-day deadlines stay out on intraday uncertainty), no new exclusion cases
beyond AWARD, and no new exact duplicates beyond the frozen Batch 4 pair.
The expansion freezes one further deterministic cohort only; thin-but-real
program extractions, news headlines, course/programme listings, and all
actionable rows stay out as documented below. No mutation ran.

**Batch 5 — site furniture labels (49 rows, authorization-ready).** Every row
below was individually confirmed still `pending` with null attribution and no
stored deadline; each title is site navigation, a section header, a timetable,
a gallery, a report, or other page furniture that cannot denote a bounded
opportunity under any reading:

- Bank of Tanzania (5): `45dccd01` Monetary Policy; `a180f81f` Payment &
  Settlement systems; `54d3fc00` Financial Markets; `0decada9`
  Advertisements; `080ff4fc` Financial Sector Supervision.
- DIT (3): `ed8d73b9` Campus Life; `f0768d03` Teaching Timetable; `88809190`
  Semester II Examination Timetable 2025/2026.
- HESLB (3): `700d6690` Our Vision; `cb00c030` News & Events; `5d7988c8`
  Shortcut Links.
- ICT Commission (3): `93b0e67a` Contact Us; `eff22f5b` Useful links;
  `ee7be84e` Empowering Tanzania's Digital Future (hero slogan).
- Ifakara (8): `ce3753b6` Publications; `5aa36831` More from Ifakara;
  `180810f6` ISO 9001:2015; `c158b740` Data Repository; `d8a4087e`
  Contribution to New Knowledge; `884ce307` Latest Events; `8f95fa20` Our
  Projects; `25f8276e` Registered-charity badge text.
- JGI (1): `f2f11c24` Ground Breaking Research.
- Ministry of Agriculture (3): `6f468115` related-sites nav; `68eab6c4`
  nearby-pages nav; `1f6e11ef` Social Media.
- SUA (9): `413f7827` Official Map of Tanzania; `29b2a7f3` Announcements;
  `da2a024d` Popular Links; `9db0bc1f` SUA Newsletters; `ef78a11d` Useful
  Information; `98d77e5f` Study Options; `282fe078` About the University;
  `ce08f6a9` Help & Support; `326b480b` Subfooter Menu.
- SUZA (3): `6fda86ee` Top Bar Menu; `fa7205d2` University School;
  `75ad18f3` Other Resources.
- Twaweza (1): `deee5a1d` Annual Report 2024.
- UDSM (3): `f88b4c8b` Main navigation; `298bd61c` Our Quick Links;
  `eecb4ac7` Other Links.
- UDOM (3): `4122a126` Welcome Note; `b3a5ac88` Latest Announcements;
  `11ea54ac` Upcoming Events.
- VETA (1): `c3d1e761` VETA Gallery.
- YUNA (3): `52f72038` Join the community; `3b54200b` Explore our
  involvement; `d0193df8` View our events.

(Full IDs: `45dccd01-08ed-49c1-bd0c-371bc515a7e7`,
`a180f81f-0c4c-46e2-9ca6-b6a40e381950`,
`54d3fc00-2a54-4a05-9663-03740b3b5214`,
`0decada9-2ecc-44b9-bf7d-0f6a94358a02`,
`080ff4fc-f162-45c8-83a8-574ce4c19f0d`,
`ed8d73b9-2cbc-4868-8ce0-c4e36d2cffd7`,
`f0768d03-374a-4cbe-9eb8-2213ba348201`,
`88809190-90ca-4ae5-a82c-f81f33ec1fa0`,
`700d6690-1e12-4871-9f51-cb4e26af7674`,
`cb00c030-9a10-4716-b731-b14aece7b992`,
`5d7988c8-655d-4e41-afd5-4bab055d7e12`,
`93b0e67a-5a3c-4661-ac2f-3062d5f8e8cd`,
`eff22f5b-5c29-4aa1-948e-477074f9adcc`,
`ee7be84e-62a0-4844-97e9-695c75147a3a`,
`ce3753b6-b28c-4d02-aaea-1a1c01f4dc5a`,
`5aa36831-2b4a-4fe1-83db-ca80cac61267`,
`180810f6-44d2-44dc-a697-226b37dd2b33`,
`c158b740-f520-4668-a1b8-bfb17a0d9c95`,
`d8a4087e-5a29-42d0-bb28-0191efa12538`,
`884ce307-cc41-4e3b-b2af-83ff0c095fef`,
`8f95fa20-ade4-4359-8b2d-c2bbab90592e`,
`25f8276e-1c6e-494d-a3e4-4ef296df7b99`,
`f2f11c24-51e8-4b3c-a8b5-cdd5f15489e0`,
`6f468115-bd01-49af-b76f-e3b0f536a7f1`,
`68eab6c4-05dd-4133-b424-67a83b481639`,
`1f6e11ef-125a-4cda-9c8b-d812d91b6174`,
`413f7827-4cad-4fc4-ac82-aa5434721c44`,
`29b2a7f3-81b7-4764-b63b-e5e5d7fd0411`,
`da2a024d-af0a-4ba1-a1ec-59e9f703a485`,
`9db0bc1f-0888-4201-bd46-bf22f302ef3c`,
`ef78a11d-bb43-45dc-a6db-371f8a3ffd69`,
`98d77e5f-7d30-426f-a38e-416567b0a493`,
`282fe078-27f1-4a7a-abfa-4ddbbc968d6b`,
`ce08f6a9-7fd0-42bf-b985-4547347ecdf0`,
`326b480b-b783-4778-a2e5-6fe9f7fadf02`,
`6fda86ee-d012-4886-8cf4-6340b0883e48`,
`fa7205d2-8788-4eec-8ebd-7ee293d9f032`,
`75ad18f3-6ad8-4e11-82d3-e4589417b0b3`,
`deee5a1d-734c-40e4-8780-86be5da5e287`,
`f88b4c8b-e3ba-4b01-815d-b77e76b4e3dd`,
`298bd61c-5ebc-4774-b320-487888bc52c0`,
`eecb4ac7-4aae-484f-bfef-2844a0fe1a09`,
`4122a126-4843-48b6-a830-c29b6599556d`,
`b3a5ac88-9b03-48a4-abd8-e89262a36edf`,
`11ea54ac-5191-4e84-bffc-6e7c9bdbc67a`,
`c3d1e761-7d2b-4af5-b774-e0e614001884`,
`52f72038-b46a-47e4-af67-265401549f0f`,
`3b54200b-3364-45dd-a57d-abc7f59f8f14`,
`d0193df8-0254-4e58-841d-af4f605f9413`.)

49 rows fit one bulk action within the 50-row cap. Exact shared reason:

> Rejected: the row holds site-navigation, section-header, or page-furniture
> text captured from an institutional page, not a bounded opportunity.

Deliberately excluded for insufficient confidence: thin-but-real program
extractions (`8cb3e7a7` World Bank YPP, `b7809dde` EMA Traineeship,
`ea6bcc5d` Kenya AI Accelerator, `3af922a8` Anita Hill, and similar —
truncation is not a verdict); news headlines and event reports (DIT–MIT,
CEBOT showcase, employee/ partnership news, SABASABA thanks); course and
degree-programme listings including all NM-AIST rows (standing pages need
per-record review per the IEM precedent); admissions/transfer notices (WISE
call, DIT transfers, bachelor/diploma applications); procurement and
nomination calls (LearnImpact RFP, Canada Small Business 100); community
joins with opportunity adjacency (Alumni Network, Stanbic internships,
Africans Rising volunteering); FSDT article teasers; Maple `0d207c0d`
(needs evidence); same-day deadlines `d8caf136`, `363cc7cb`, `6db9cabc`;
Schlumberger `1241a0bd`; all future-deadline actionable rows; and the older
CFJ duplicate. Execution order stays Batch 3 → Batch 4 → Batch 5, each with
the protected pre-batch snapshot and per-record verification contract. No
incoherent/misidentified record beyond the already-resolved AWARD conflation
was found.

## Batches 3/4/5 count and overlap reconciliation — verified read-only

On 2026-09-15 the frozen cohorts were audited end to end without mutation.
Document sizes are Batch 3: 1, Batch 4: 6, Batch 5: 49 — 56 IDs total, 56
unique, zero overlaps within or across batches (checked document-level and
live). All 56 are still `pending` with null attribution. Live corpus is
unchanged at 250 pending / 8 published / 30 rejected. Correct arithmetic is
250 − 56 = **194** expected pending after all three batches (an earlier
report draft wrote 196 in chat only; no authoritative doc carried that
number). Expected end state: 194 pending / 8 published / 86 rejected = 288
opportunities, 521 references, 75 enrichments (56 new status audits).

Authorization-ready execution bundle (NOT executed; Batch 3 gate order
first, then 4, then 5; stop on any drift):

1. **Batch 3 — AWARD (1).** `51e23a07-2210-4bf1-9b36-98d707215efa`.
   Reason: "Rejected because documented eligibility is limited to Egypt,
   Morocco, Ghana, Nigeria, Sierra Leone, and Senegal; Tanzania is
   excluded."
2. **Batch 4 — duplicate page furniture (6).**
   `db42c5f4-e5bd-467d-b247-9cba604917be`,
   `5314b299-f05a-4ca2-985e-7e9244f5007c`,
   `db214504-80a2-42da-9eeb-f50ec4c7fb5e`,
   `7aeda1ce-8004-46b2-a4a5-9521fd3191c6` (Quick Links),
   `e6d8f260-0688-44e3-8db1-3fffa2021fed`,
   `a53ee125-beb4-4094-bccd-fcedffb0e52e` (Latest News).
   Reason: "Rejected: the row holds site-navigation or section-header text
   captured from an institutional page, not a bounded opportunity."
3. **Batch 5 — site furniture labels (49).** Full IDs frozen in the expansion
   section above (48 listed plus `88809190-90ca-4ae5-a82c-f81f33ec1fa0`,
   all re-confirmed pending/null/no-deadline live).
   Reason: "Rejected: the row holds site-navigation, section-header, or
   page-furniture text captured from an institutional page, not a bounded
   opportunity."

Each batch keeps the protected pre-batch snapshot and per-record
verification contract. No Batch 3–5 mutation ran here.

## Bulk Production Cleanup — Batch 3 AWARD executed and verified

On 2026-09-15 the owner executed the authorized AWARD single rejection in
the Moderator browser session. Read-only post-verification confirms:
`51e23a07-2210-4bf1-9b36-98d707215efa` changed only
`status`/`decided_by`/`decided_at`/`updated_at`, decided
`2026-09-15T11:09:12Z` by the sole Moderator with the verbatim 134-character
Tanzania-exclusion reason audit (`created_at = decided_at`); its reference
is preserved; all other 287 opportunities and all 521 references are
byte-identical. Production is 288 opportunities / 521 references /
20 enrichments at 249 pending / 8 published / 31 rejected / 0 expired.
Homepage 200, rejected route 404, anonymous moderation 307, Sahara/AAS 200 and published. Post evidence and manifest
(`7e6f3091c118487af15ee219c32e57d34f7348836e9ee586b323f9d69fef691f`)
are sealed in
`C:\Users\hp\.tech-opportunity-backups\20260915T104211Z-pqd-bulk-cleanup-batch3-award\`.
The unused Batch 4 manual-plan pre-snapshot
(`20260915T111700Z-pqd-bulk-cleanup-batch4-furniture`, pre-files only, no
mutation followed) is retained as-is and superseded by the sweep below.

## Filter-driven ambiguous-queue sweep — planned read-only (supersedes B4/B5)

On 2026-09-15 the 249-row pending queue was re-censused read-only (AWARD
rejected, all 55 frozen furniture rows still pending/null, zero new expired,
zero new exclusions, zero new duplicates). The owner will not hunt titles,
so every cohort below is proven to equal EXACTLY one existing UI filter
result (title-substring `q`, exact source, bucket, or `source`+`bucket` AND —
replicated from the served implementation and re-verified live per ID), sized
for `Select all visible` within the 50-row bulk cap. No cohort needs the UX
branch: production already ships select-all-visible plus these filters at
`1645973`; the UX work adds presentation only. Order matters only where
noted; every step re-verifies its served filter result pre-action and stops
on any drift. All furniture cohorts share one evidence-safe reason:

> Rejected: the row holds site-navigation, section-header, or page-furniture
> text captured from an institutional page, not a bounded opportunity.

Tier 1 — pure source+bucket select-alls (14 confirmations, 36 rows): BoT|7
(6), HESLB|7 (2), HESLB|8 (1), ICT|7 (4), Ifakara|1 (1), Ifakara|7 (8),
JGI|7 (1), MINAG|7 (3), SUA|8 (1), Twaweza|8 (1), UDOM|7 (2), UDOM|8 (2),
VETA|8 (1), YUNA|7 (3). Each cell was proven to contain only intended
furniture IDs (complete cell table retained in the planning notes above).

Tier 2 — exact title-substring select-alls on the remainder (6
confirmations, 10 rows, run after Tier 1): q"Quick Links" (2:
`7aeda1ce`, `298bd61c`), q"Timetable" (2), q"Menu" (2: `326b480b`,
`6fda86ee`), q"Announcements" (1: `29b2a7f3`), q"News" (1: `9db0bc1f`),
q"Links" (2: `da2a024d`, `eecb4ac7`).

Tier 3 — exact single-title select-alls (9 confirmations, 9 rows, each term
proven to match exactly its one intended row and nothing else):
q"Campus Life" (`ed8d73b9`), q"University School" (`fa7205d2`),
q"Other Resources" (`75ad18f3`), q"navigation" (`f88b4c8b`),
q"Official Map" (`413f7827`), q"Useful Information" (`ef78a11d`),
q"Study Options" (`98d77e5f`), q"Help" (`ce08f6a9`), q"Gallery"
(`c3d1e761`). (Sibling terms such as Our Vision, Annual Report, and About
were verified pure but are unneeded — Tier 1 cells already take those
rows.)

No UI change is required for any cohort above: every isolation uses filters
already live in production. The one structural gap found is expiry-based
triage — the queue has no deadline-passed view filter, and several 2025
YUNA calls look expired by title year while their stored deadlines are null,
so expiry cannot be asserted without per-record evidence work. If a future
expired sweep is wanted, the smallest improvement is a view-only
deadline-passed filter following the existing `flag=ambiguous` honesty
pattern (hint only, no verdict); it is NOT approved or built here. UX-branch
integration sequence (also not started): land only after the cleanup lanes
close, then rebase, staging matrix with disposable identities, and a
separate owner-gated production promotion.

Deliberately outside the sweep (unchanged stay-out list): thin-but-real
program extractions, news headlines, course/programme listings, admissions
notices, procurement calls, community joins, FSDT teasers, Maple (needs
evidence), Schlumberger, same-day deadlines, older CFJ duplicate, and all
actionable rows. Expected end state after all 29 confirmations: 194 pending
/ 8 published / 86 rejected, barring legitimate concurrent Discovery
growth (reconcile, never force counts).

## Furniture filter — promoted to production (code-only, no mutation)

The owner explicitly authorized the smallest safe promotion of the reviewed
capability at exact commit `2cbba5a`: only the five verified files
(`app/moderation/page.tsx`, `lib/data/moderation.ts`,
`lib/triage-bucket.ts`, `scripts/verification/boundaries.ts`,
`tests/bulk-moderation.test.ts`) at byte-identical content, committed as
`c11a6ba`. No database, schema, RLS, RPC, discovery, source, cadence,
taxonomy, geography, profile, or AI change; no moderation action ran.

Pre-promotion guard bound production ref `jltuufukcwztugvojwjd`: 249 pending
/ 8 published / 31 rejected / 0 expired = 288 opportunities, 521 references,
20 enrichments. Local `tsc`, lint, bulk 10/10, 33/33 boundaries, and the
production build passed on the exact content; no workflow was in progress.
Prior production deployment `6457910546` (`9b9694a`) is preserved as the code
rollback point.

The push started only exact-SHA Milestone verification `34967608673`
(success) — it matches no Discovery-sync path, so no Discovery run started
and zero corpus delta was possible. GitHub Production deployment `6458519326`
for the exact SHA is success (immutable URL
`https://techopportunity-tanzania-qggwyuba8-techopportunity.vercel.app`,
Vercel-SSO-gated; public proof on the canonical alias).

Post-promotion proof (read-only; no Moderator session, no moderation
action): all 288 opportunity IDs and 521 reference IDs byte-identical
(`b6288c96…`, `a5feb389…`), counts unchanged at 249 / 8 / 31 with 20
enrichments; the promoted predicate and plumbing re-checked live return
exactly the frozen 55 with zero false positives over 249 pending;
`/` returns 200 while anonymous `/moderation`, `/moderation?flag=furniture`,
and `/published-management` each return 307; `BULK_REJECT_MAX_ITEMS` remains
50. Served-HTML confirmation of the 55-row filtered view itself remains for
a Moderator browser session (anonymous access correctly cannot reach it).

TEMPORARY FILTER NOTICE: `flag=furniture` exists only to execute the
documented 55-row furniture cleanup. After those rows are rejected and
verified, remove the flag, chip, and title set — or generalize them through
a separately reviewed milestone. Never extend the frozen set without
record-by-record review.

## Legacy cleanup bounded phase — planned read-only (all remaining cohorts)

On 2026-09-15 the 199-row pending queue was fully triaged read-only
(confirmation 1 already rejected 50 furniture rows: 199 pending / 8
published / 81 rejected). Every cohort below is reason-homogeneous,
evidence-decisive per row, and executable with existing UI filters —
each stated filter was proven to return exactly its listed IDs and nothing
else. Cross-filter ID accumulation inside one shared reason keeps the whole
phase to 8 owner confirmations for 39 rows; the confirm screen (exact title
list) is the per-action proof surface alongside the served counts. No cohort
touches thin-but-plausible, actionable, or evidence-incomplete rows. A full
phase pre-snapshot is sealed in
`C:\Users\hp\.tech-opportunity-backups\20260915T130900Z-pqd-legacy-cleanup-phase\`
(counts 199 / 8 / 81, sole Moderator intact); per-confirmation targeted
checks plus one final full post snapshot close the phase. No mutation ran.

- **G0 — furniture remainder (5, gate already open).** Furniture filter → 5
  (`db42c5f4`, `45dccd01`, `a180f81f`, `54d3fc00`, `88809190`). Furniture
  reason (143 chars, in bounds).
- **G1 — expired corroborated (3).** `d7139a22` Heirs (deadline 4 Sept),
  `38bbb7a1` Kenya AI Accelerator (6 Sept), `31f4de3c` Sasol (13 Sept) —
  each deadline stated in-text. Three exact q-singles, one confirmation.
  Reason: "Rejected as expired: each listed call's stated application
  deadline has passed (deadlines 4–13 September 2026), so none remains
  actionable."
- **G2 — South-African-excluded (2).** `e7c0a1ac` KPMG Supply Chain,
  `65323d20` Sanlam — stored eligibility limits to young South African
  graduates. Two exact q-singles, one confirmation. Reason: "Rejected:
  documented eligibility is limited to young South African graduates;
  Tanzanian applicants are excluded."
- **G3 — Egyptian-excluded (2).** `8b65ce51` + `f507ba2b` Standard Chartered
  Women in Tech Egypt — stored eligibility limits to young Egyptian
  entrepreneurs. One exact q-filter (`Standard Chartered` → both, proven),
  one confirmation. Reason: "Rejected: documented eligibility is limited to
  young Egyptian entrepreneurs; Tanzanian applicants are excluded."
- **G4 — Nigerian-excluded (1).** `43e7fb3c` She Leads Africa BoostHer —
  stored eligibility limits to young Nigerian women entrepreneurs. Exact
  q-single, one confirmation. Reason: "Rejected: documented eligibility is
  limited to young Nigerian women entrepreneurs; Tanzanian applicants are
  excluded."
- **G5 — stale sidebar stubs (7).** `b9fa44b5` Eagles HOPE 2017, `f03870e0`
  Pina Bausch 2018, `5ee5c907` IMF 2023, `58977e5e` Global Health Corps
  2013/14, `2957017e` VINNMER 2015, `3465f88f` WEF 2017, `861aa637` Yale
  2016 — each names a long-past cohort year and its stored content is a
  "Listed in:" sidebar capture describing a different programme. Seven exact
  q-singles, one confirmation. Reason: "Rejected as a stale dated cohort
  captured as a sidebar listing: the named programme year (2013–2023) has
  long passed and the stored content does not describe a current call."
- **G6 — news/event reports (16).** `919939c7` CEBOT showcase, `61962e15`
  DIT–MIT news, `9a719280` Vision-2050 news, `af619ec8` graduates-challenged
  news, `6478b4a1` Nanenane exhibition, `ba525b0e` best-employees news,
  `c10d325e` thesis-congratulations, `aadd93b6` HALOTEL hope, `18b09c22`
  researchers-awards news, `4a63a1d7` BSU4 progress report, `3412c633`
  digitalskills article, `27357b80` SUZASO awards news, `c1464c77` NMB
  partnership, `f543f8cd` MZUMBE meeting, `c2d725f0` hostel meeting,
  `3d92d20b` SABASABA thanks — each title is face-evidence news, none carries
  a bounded call. Sixteen exact q-singles, one confirmation. Reason:
  "Rejected: the row is a news article, event report, or institutional
  announcement — not a bounded opportunity with an actionable call."
- **G7 — VETA admin notices (3).** `2e938d33` + `253cdfc3` selection lists,
  `22c735ef` certificate procedure. Two exact q-filters, one confirmation.
  Reason: "Rejected: the row is an administrative outcome or procedural
  notice (selection list / certificate procedure), not an open opportunity."

Needs-evidence cohort (explicitly NOT rejected — genuine/actionable/plausible
but incomplete): 2025-cycle rows (deadline confirmation required, incl. the
Fuller pair with noted-but-unverified Asian scope and the raw-URL-titled
`3d501f94`); Maple; NAFASI vague row; WISE call; transfers; bachelor/diploma
applications; all NM-AIST programme/research pages (intake-bound review per
IEM precedent); ministry/company/entity pages; Guidelines; Alumni;
LearnImpact RFP; Canada nominations; FSDT analytical teasers; OD thin-but-
real extractions (World Bank, EMA, Kenya AI duplicate note, Anita Hill,
Defra, Tara's Circle, Tech Policy, Big Ten, Cybersafe, IRE, LASR, Chatham,
Jobberman, Civic, Frontier, Leon Levy, NTU, Olympic, Intuit, UMAPS/UBC/
Toronto, Iliad, fai/iaps internships, Nivishe, Democracy, Leaders, Int'l
Affairs, IIH, NALA, APMF, UNEP, ATRIUM, Global Changemaker, Stanbic, CRDB,
Volunteer); OFA big-description actionable rows (KAUST, UNU-WIDER ×2, CIFAR
×2, Leverhulme, Ashoka, Swiss, IRENA, WTO, NALA, ATRIUM, Toronto/ASU/UBC/
Michigan/Princeton/EJS/UCT/EJS-NextGen, UCT doctoral, EJS series); YUNA
actionable rows; SUZA/BSU4 misc actionable; DIT misc; VETA admission notice/
form/short-course list; Schlumberger rows + stubs (probable duplicates of
stay-out full rows — duplicate review at moderation time); same-day
deadlines (`d8caf136`, `363cc7cb`, `6db9cabc`); older CFJ duplicate;
Catalyst/IAIFI/Earhart; ASU/ARC/Leaders eligible rows (review queue, never
cleanup). Expected end state after all 8 confirmations: 160 pending / 8
published / 120 rejected, barring legitimate concurrent Discovery growth
(reconcile, never force counts).

## Authoritative Corpus Reset — planned, Discovery paused (no mutation yet)

On 2026-09-15 the owner ordered an end to record-by-record cleanup: the
legacy corpus leaves active use so the product rebuilds from authoritative
sources. Scheduled Discovery (`discovery.yml`) was disabled first via the
authorized workflow control and reads back `disabled_manually`; no scheduled
worker can run on the old admission logic during the reset (push/manual
dispatch stay naturally unavailable while disabled; the credential-free
schedule observer and deadline alerts are untouched). A full protected
pre-reset snapshot is sealed in
`C:\Users\hp\.tech-opportunity-backups\20260915T133000Z-corpus-reset-pre\`
(all 288 opportunities, 521 references, 75 enrichments, counts 194 pending /
8 published / 86 rejected, sole Moderator intact; manifest + restricted
ACLs). Nothing was deleted and nothing will be: the reset uses only the
existing attributable status transitions, fully restorable from the
snapshot under separate authorization.

Reset scope (Sahara `156b20a2` and AAS `ef8defbb` stay published: both
already satisfy the new authoritative standard today through complete
official-source M31 evidence chains — keeping verified-compliant public
inventory is applying the rule, not grandfathering ambiguity; either can
still be unpublished later by single action):

- **194 pending → rejected** in filter-exact bulk groups (all ≤50):
  source=OFA (49), source=NM-AIST (36), source=OD+bucket 2 (28),
  source=OD+bucket 7 (18), source=DIT (12), source=FSDT (11), source=YUNA
  (11), source=SUZA (10), source=OD+bucket 1 (8), source=VETA (7), plus 4
  single-record rejections (HESLB, SUA, Twaweza, UDSM rows). One shared
  210-character reason for all: "Legacy corpus reset: this record entered
  the active queue before the authoritative-evidence admission standard and
  is withdrawn from active moderation without individual adjudication; full
  history is preserved."
- **6 published → rejected** via the existing single-record unpublish path
  (Consultancy `e0c271f4`, ERASMUS `a6855dd9`, AIJC `9d967b53`, 30-job
  aggregate `1b3649a0`, Ogilvy `fdfe3e70`, YSP `01042eca` — all legacy
  unreviewed, none M31-compliant). One shared 180-character reason reused
  per action: "Legacy corpus reset: this published record predates the
  authoritative-evidence standard and is withdrawn from public use without
  individual adjudication; full history is preserved."
- Expected end state: 0 pending / 2 published / 286 rejected = 288
  opportunities, 521 references, 275 enrichments (200 new status audits),
  barring legitimate concurrent activity (none possible with Discovery
  paused; reconcile, never force counts).
- The `flag=ambiguous` workflow and the temporary `flag=furniture` filter
  are NOT removed in this phase; both stay live until the reset verifies
  clean, then retire in the admission-gate implementation. All prior frozen
  cohorts, stay-out lists, and the needs-evidence pool are superseded by
  this reset (history preserved in prior sections and snapshots).

## Authoritative Corpus Reset — single-operation execution plan (no mutation yet)

The owner replaced the 20-confirmation browser plan with one controlled
database-level operation. Design, constrained by the standing
no-impersonation rule (a profile row never authorizes service-role
impersonation, so actor/timestamps cannot be forged server-side): a bounded
one-time local script drives ONLY the existing moderation RPCs —
`reject_pending_opportunity` (194 frozen pending IDs) then
`unpublish_published_opportunity` (6 frozen published IDs) — over HTTPS as
the authenticated sole Moderator, sequentially with per-call result checks.
Each RPC commits independently, exactly like the served bulk path (whose
partial-failure semantics were staging-proven); a single 200-row atomic
transaction is not achievable without forging auth context, so the script
instead stops fail-closed on the first unexpected result and reports the
exact remaining IDs for an explicit resume. Rollback remains the sealed
pre-reset snapshot plus per-row restore.

Preflight holds: 194 pending / 8 published / 86 rejected, all 200 targets in
expected state, sole Moderator unchanged, Discovery still
`disabled_manually`, no workflow clash. The executor
(`reset-execute.mjs`, temp-only, never committed) enforces: production-URL
binding, token bound to production + `authenticated` + sole-Moderator `sub`
+ 10-minute expiry margin, exact frozen ID counts (194/6), reason-length
bounds, live Gate-0 re-verification (counts, every target state, controls
published, moderator identity), per-row 200-plus-exactly-one-row checks,
timeout ambiguity resolution by truthful re-read (never assume), one retry
only after transport failure, 150 ms pacing, and a token that lives in
memory only — never logged, persisted, or written to evidence. Mock-proven
with dummy credentials against localhost (real-backend contact refused by
construction): 3/3 success with server-side exact-reason assertion, stale
stop with remaining list, HTTP-500 stop with remaining list, and resume of
exactly the remainder. Sahara/AAS stay published (already authoritative);
needs-evidence rows are untouched by the frozen scope.

## Exact next milestone

**Corpus reset execution — ONE owner gate (secure local token prompt).**

The 20-confirmation browser plan is superseded and must not be executed, and
no token is ever pasted into chat. A child-process prompt variant failed
immediately without touching production, so the runner takes the token only
through an in-memory pipe from an owner-shell-native `Read-Host
-AsSecureString` prompt: never in argv, env, disk, history, logs, or chat.
The pipe path is mock-proven end to end (happy path, empty-pipe and TTY
fail-closeds, plus the stale/HTTP-500/resume suite). The owner is asked to
run exactly one local PowerShell command (any directory; nothing secret in
it, safe for history) while signed in as the Moderator, type the token
hidden at the prompt — copy it from the production browser at DevTools →
Application → Local Storage → the `sb-<ref>-auth-token` entry → its
`access_token` value — and let the single scripted RPC run plus its built-in
final verification complete. On the script's DONE line, sign out of the
Moderator account immediately to revoke the session. Residual risk is stated
plainly: the token grants full Moderator power while live; scope is enforced
by frozen IDs, exact reasons, and fail-closed stops. If this handoff is
unacceptable, the fallback is the documented 20-confirmation browser plan,
not service-role impersonation. This handoff authorizes nothing by itself.

## Continuing constraints

- Repository `.env.local` is production-only and must never be used for staging.
- Recovery details remain authoritative in [DATABASE_RECOVERY.md](DATABASE_RECOVERY.md).
- Production migration history remains deliberately unnormalized; no broad
  `db push`, replay 0001–0012, or migration repair.
- One production Moderator profile exists. Batch 2B1 proved the authenticated
  browser path; a profile row still never authorizes service-role impersonation.
- `scripts/discovery/inspect-live.ts` performs a reversible insert/delete probe
  despite its old read-only label. Do not use it for a no-write audit.
