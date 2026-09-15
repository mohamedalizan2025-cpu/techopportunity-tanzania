# Current engineering handoff

Updated: 2026-09-15. Read [ENGINEERING_RULES.md](ENGINEERING_RULES.md) before acting.

## Current verified state

- Local repository `main` is SHA
  `1645973a937981fb4574e1e498a03f57b277c9ba`, in sync with `origin/main`.
  The runtime source SHA is the same exact capability commit `1645973`, with
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
  fallback. This docs-only closure starts no workflow (`[skip ci]`) and
  produces only a runtime-identical Vercel deployment.
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
  in the Two-Record Resolution below; production is now 254 pending /
  8 published / 21 rejected / 0 expired = 283 opportunities, 515 references,
  10 enrichments, and 2 status audits.
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
- Production now holds 259 pending / 8 published / 21 rejected / 0 expired =
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

## Ordered near-term roadmap

The authoritative roadmap is [PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md). Its order is:

1. **Pending Rejection Attribution Hardening** *(promoted and both real pending records resolved with full attribution; closed)*
2. **Bulk Moderator Actions + Ambiguous Queue Cleanup** *(promoted to production as exact `1645973` on 2026-09-15; five-row push delta preserved for reconciliation; real-queue cleanup not started)*
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

## Exact next milestone

**Bulk Moderator Actions promotion-push corpus-delta reconciliation (read-only).**

Inspect the five preserved pending inserts (`6fec5039…`, `7f4e1806…`,
`0d207c0d…`, `a2b70fe1…`, `fb12a207…`, created `2026-09-15T07:55:03Z`) and
their six references without mutation: verify each row is still `pending`
with null attribution, record its source/evidence/duplicate posture, and
recommend per-record retention or rejection for separate owner authorization.
Do not approve, reject, bulk-reject, delete, or restore any record in this
milestone. Do not start Bulk Production Cleanup or later roadmap work.

## Continuing constraints

- Repository `.env.local` is production-only and must never be used for staging.
- Recovery details remain authoritative in [DATABASE_RECOVERY.md](DATABASE_RECOVERY.md).
- Production migration history remains deliberately unnormalized; no broad
  `db push`, replay 0001–0012, or migration repair.
- One production Moderator profile exists. Batch 2B1 proved the authenticated
  browser path; a profile row still never authorizes service-role impersonation.
- `scripts/discovery/inspect-live.ts` performs a reversible insert/delete probe
  despite its old read-only label. Do not use it for a no-write audit.
