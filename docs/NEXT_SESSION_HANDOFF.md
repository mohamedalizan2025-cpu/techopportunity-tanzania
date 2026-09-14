# Current engineering handoff

Updated: 2026-09-14. Read [ENGINEERING_RULES.md](ENGINEERING_RULES.md) before acting.

## Current verified state

- Production application runtime code remains
  `070c32fb07f147a79626d9e7988767c5f476f373`; repository `main` was
  `d524062e881c3a5bfb9508a5454d5d98f0d60729` before this staging-closure
  documentation commit.
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
- The 2026-09-14 production re-baseline is 246 pending / 8 published / 19 rejected /
  0 expired = 273 opportunities, with 505 references and 8 enrichment-audit rows.
- Published Unpublish Attribution Hardening is implemented at capability commit
  `45508956c365911853c3e681e712b0ba53106f23`, deployed on staging commit
  `06155b5eb1c0220e9643572d3de54beef77bfe90`, and verified against isolated
  staging migration 0015. Production code, schema, corpus, and configuration remain
  unchanged.
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

## Ordered near-term roadmap

The authoritative roadmap is [PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md). Its order is:

1. **Published Unpublish Attribution Hardening** *(staging verified; production promotion pending)*
2. **Bulk Moderator Actions + Ambiguous Queue Cleanup**
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

**Published Unpublish Attribution Hardening — Production Promotion.**

Review the exact migration and staging evidence, create a fresh protected production
schema/data recovery artifact, independently bind the target to production ref
`jltuufukcwztugvojwjd`, and promote only capability commit `45508956` plus exact
migration 0015. Production migration and deployment require explicit owner go/no-go.
Use read-only structural/auth checks after promotion; do not unpublish a real
production record merely to prove the path. Do not resume Batch 2B2 cleanup or begin
bulk moderation or any later roadmap priority in that milestone.

## Continuing constraints

- Repository `.env.local` is production-only and must never be used for staging.
- Recovery details remain authoritative in [DATABASE_RECOVERY.md](DATABASE_RECOVERY.md).
- Production migration history remains deliberately unnormalized; no broad
  `db push`, replay 0001–0012, or migration repair.
- One production Moderator profile exists. Batch 2B1 proved the authenticated
  browser path; a profile row still never authorizes service-role impersonation.
- `scripts/discovery/inspect-live.ts` performs a reversible insert/delete probe
  despite its old read-only label. Do not use it for a no-write audit.
