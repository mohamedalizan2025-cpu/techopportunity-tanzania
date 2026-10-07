# Engineering rules

These rules are permanent unless the owner explicitly replaces them. Milestone
briefs may narrow scope but do not weaken these boundaries. Current checkpoint
and owner gates live in [NEXT_SESSION_HANDOFF.md](NEXT_SESSION_HANDOFF.md);
this file states the durable contract. Verification lives in
[VERIFICATION_CONTRACT.md](VERIFICATION_CONTRACT.md).

## Branch, worktree, and writer isolation

1. One writer per branch. Never edit the same branch from two sessions,
   machines, or worktrees at the same time. If another agent owns a branch
   or worktree (for example unfinished visual/photography work), do not
   touch that branch, its worktree, or its files.
2. Start from a known Git state; preserve unrelated user work. Each milestone
   works on its own branch and/or isolated worktree created from the agreed
   base (normally `origin/main`).
3. A milestone ends with an intentional diff, no generated or secret
   artifacts, and a clean worktree. Never commit, push, or merge another
   branch's work. Never force-push, rewrite history, or merge blindly.
4. Commit and push only the assigned branch. Production deploys only from
   `main` via Vercel; no other branch or worktree is a release path.

## Production owner gates

These actions require explicit, bounded owner authorization and stop at the
gate when it is absent. An agent must never work around them with SQL,
service-role, direct RPC, dashboard clicks, or credential handling:

1. Granting, rotating, or applying production credentials, keys, or sessions.
2. Approving or applying any production migration or RLS/grant change.
3. Approving destructive cleanup, historical-record rewrites, bulk deletion,
   or corpus resets.
4. Approving a live source-registry mutation, new external integration,
   schedule/cadence change, or Cloudflare change.
5. Approving AI activation in any environment, any new outbound personal
   data, or any production AI change (staging approval never auto-satisfies
   production; see AI boundary below).
6. Vercel dashboard actions, manually dispatching workflows when the
   repository path is blocked, and any production data mutation for proof.

When authorization is required, stop at the gate, request the exact
authorization, and resume in a new turn.

## Engineering simplicity

1. Prefer the simplest safe implementation and reuse the existing architecture
   before creating a new abstraction.
2. Do not over-engineer, speculate about future requirements, or add dependencies,
   services, infrastructure, or configuration without a present measured need.
3. Fewer clear lines are better than unnecessary complexity. Technology must serve
   a product or safety outcome, not exist because it sounds impressive.

## Security and environment boundaries

1. Never commit, print, paste, or document secret values. Treat service-role keys,
   database passwords, session material, private rows, and raw security catalogs as
   protected data. Real secrets never belong in `.env.example`, docs, chat, Git
   history, or logs — placeholders or empty values only.
2. Prove the exact environment before every external mutation. Production is
   `jltuufukcwztugvojwjd`; staging is `pumzofcwfjqswkiwfqty`. Fail closed if the
   target is ambiguous or the two resolve to the same project.
3. `.env.local` is production-only in this repository and must not be loaded for a
   staging operation. Use separately protected target-specific credentials.
4. Never copy production identities, sessions, profiles, saves, preferences,
   alerts, or private rows to staging. Staging evidence uses synthetic data.
5. RLS is the authorization boundary. Browser-visible keys are acceptable only
   because RLS constrains them. Service-role access is server/worker-only and kept
   to the smallest privileged operation. Never disable RLS to debug; never
   broaden service-role access as a workaround.
6. External database, deployment, DNS, provider, schedule, registry, or secret
   changes require explicit bounded authorization. Read-only inspection does not
   imply permission to mutate.
7. Keep the product online. Use isolated staging before risky production changes,
   then promote only the verified bounded change.
8. Secret exposure procedure is rotation-loop-proof: name the secret TYPE without
   reproducing the value, determine the environment, rotate/revoke ONCE in the
   provider console, place the replacement in the legitimate protected location
   (Vercel dashboard env / protected local file), redeploy where required, verify
   the replacement works, record the incident — then STOP. Do NOT rotate again
   without a NEW exposure. Repeated rotation without new evidence is forbidden.
   Full procedure: [INCIDENT_RESPONSE_RUNBOOK.md](INCIDENT_RESPONSE_RUNBOOK.md) §4.

## Production vs staging

1. Exactly ONE public product URL exists:
   `https://techopportunity-tanzania.vercel.app`. Never document, link, or
   promote any other deployment as the product.
2. ONE Vercel project. Production (`VERCEL_ENV=production`) uses production
   Supabase only. Staging is the protected branch Preview of the same project
   with branch-scoped staging Supabase vars — internal and testing-only,
   Vercel-Authentication-gated, noindexed, never shared as a product link.
   `app/robots.ts` disallows indexing on every non-production deployment.
3. Production and staging Supabase projects are never merged. Staging uses
   synthetic data only; production data is never touched while developing
   features. A staging result is not production proof, and staging approval
   never auto-satisfies a production gate.
4. Application rollback is the previous Ready Vercel deployment. Database
   changes roll forward as reviewed migrations with a verified recovery point;
   never use a backup to erase later legitimate rows without separate,
   record-specific owner authorization. Follow
   [DATABASE_RECOVERY.md](DATABASE_RECOVERY.md).

## Data and product integrity

1. `UI -> lib/data/* -> Supabase` is the application data path. UI modules do not
   query Supabase directly.
2. Discovery, public submissions, and user reports create `pending` (or report)
   records only. A human staff decision through the authorized moderation action
   is the sole path to `published`, `rejected`, or `unpublished`. Blind
   auto-publish, auto-reject, auto-quarantine, bulk automated moderation, and any
   report-driven auto-mutation are NOT allowed — reports never mutate listings.
3. Do not delete opportunity history for routine cleanup. Reject or unpublish with
   an auditable status transition unless deletion is separately authorized.
4. Unknown evidence remains unknown. Do not infer country, eligibility, relevance,
   deadline, identity, source authority, or publication fitness from absence.
5. Preserve source evidence and provenance. Dedupe may act automatically only on a
   deterministic identity rule; ambiguous matches go to human review.
6. Treat fetched content as untrusted. Enforce the shared URL, redirect, SSRF,
   timeout, and response-size policy. Never bypass access controls, robots/terms
   restrictions, authentication, or platform protections.
7. Source activation and extraction expansion require representative evidence and
   fixtures. Row volume is not a quality metric.
8. Tech Opportunity is organization-first and opportunity-only. Authority belongs
   to the genuine organization/channel, not only to its website: official
   organization/programme sites, official application portals, government/
   ministry/agency channels, universities/research institutions, companies/
   foundations/NGOs/hubs, verified or demonstrably official LinkedIn/Instagram/
   Facebook/X accounts, and official forms those organizations link. Do not ingest
   general news. An item is an opportunity only when it carries a concrete user
   action (apply, register, compete, submit, pitch, attend, train, receive
   funding, research, intern, work, exhibit). Aggregators, reposts, unofficial
   accounts and secondary news are discovery leads only, never authority.

## Database and recovery

1. Inspect the live target before planning DDL; historical migration files do not
   prove live state. Staging-first for every migration; production applies only
   under the Production owner gates above.
2. Use forward, reviewed, bounded migrations with a verified recovery point,
   target guard, input hash, failure-stop transaction, and post-change proof.
   Every `supabase/migrations/**` change triggers explicit migration review and
   the production owner gate — automated tests never substitute for it.
3. Do not run broad `db push`, replay early migrations, or repair/normalize migration
   history. Production intentionally lacks normalized migration history.
4. RLS/grant changes ship only as reviewed migrations with cross-user isolation
   regression proof. `authenticated`/`anon`/`service_role` scopes are explicit;
   privileged paths derive identity from `auth.uid()` inside the database, never
   from client-supplied actor identifiers.
4. Backups, dumps, manifests containing private inventory, and raw security exports
   stay outside Git with restrictive ACLs. Follow
   [DATABASE_RECOVERY.md](DATABASE_RECOVERY.md).

## Implementation and verification

1. Keep changes inside the requested milestone. Do not bundle speculative
   infrastructure, schema, provider, AI, source, schedule, or cleanup changes.
2. Prefer deterministic, testable rules and the smallest safe change. Preserve
   established boundaries unless evidence justifies a reviewed architecture change.
3. Do not weaken tests, thresholds, RLS, validation, health semantics, or feature
   flags to manufacture a green result.
4. Run the standard and change-triggered gates in
   [VERIFICATION_CONTRACT.md](VERIFICATION_CONTRACT.md): `npm run verify` (full
   tests + typecheck + lint + boundary assertions + change classifier) and
   `npm run verify:ci` (adds the production build) when runtime, data-layer,
   config, dependency, discovery, moderation/auth, assistant, migration,
   registry, or workflow files change. When a gate cannot run,
   report the exact cause and the strongest evidence actually obtained.
   `git diff --check` stays clean. A dirty worktree is reported, never hidden.
5. Correlate production proof to the exact commit, deployment, environment, action,
   and observable result. A configured schedule, successful build, or old run is not
   proof of current behavior. Scheduled-run evidence is valid only when the
   workflow `head_sha` equals the claimed commit; one run proves one execution,
   never repeatability.
6. Never claim a migration, deployment, test, recovery, user flow, or production
   result that was not directly verified.

## Repository hygiene

Every meaningful milestone reviews dead code, unused imports, redundant branches,
duplicated logic, unnecessary lines, debug output, temporary scripts, generated
junk, stale fixtures, and obsolete files or documentation. Remove an item only when
its references and enduring value have been checked. Never delete useful migrations,
tests, workflows, recovery records, security/audit evidence, or authoritative
documentation merely for aesthetics.

Use proportional verification: focused checks first when appropriate, then the full
contract when the change and risk justify it. Do not repeatedly rerun an expensive
gate without a reason or new input.

## Agent efficiency

Do not keep an agent alive merely to watch an asynchronous external operation. For
GitHub Actions, Vercel, scheduled jobs, and similar systems: trigger the action,
confirm it started, continue independent work, and check again only when its result
becomes a hard gate. If the result is not yet available, report `PENDING` instead of
polling endlessly.

When human or provider authorization is required, stop at the gate, request the
exact authorization, and resume in a new turn. Do not use unrelated work to disguise
or bypass the gate.

## Recovery review

Every meaningful milestone considers Git recoverability, database recovery,
configuration reconstruction, secret custody outside Git, backup integrity, and
future Storage/file recovery. Ask:

> Could Tech Opportunity be rebuilt from another computer using GitHub, protected
> backups, and provider accounts?

Record new recovery gaps without letting unrelated recovery work derail a bounded
product milestone.

## Product-quality test

A feature should improve at least one of trust, user value, reliability, adoption,
revenue potential, institutional usefulness, or competition/showcase strength.
Otherwise, do not add it.

## AI boundary

AI is disabled operationally. It cannot establish factual truth, acquire sources,
qualify or deduplicate opportunities, moderate, publish, or alter canonical data.
Deterministic code is sole authority for publication, trust, eligibility,
geography, deadline, and fit; AI may only add bounded readiness observations
around those facts and fails closed to deterministic guidance. Provider
activation in ANY environment requires explicit approval plus corpus readiness,
privacy, grounding, evaluation, fallback, rate-limit, kill-switch, and cost
controls. Staging approval never activates production; production AI stays OFF
until the separate owner decision in
[AI_OPPORTUNITY_INTELLIGENCE.md](AI_OPPORTUNITY_INTELLIGENCE.md) and
[PRODUCTION_AI_DECISION_CHECKLIST.md](PRODUCTION_AI_DECISION_CHECKLIST.md).
No general-purpose chatbot. No autonomous applications — the platform records
progress but never submits on the user's behalf.

## Closure rule

`implementation + proportional verification + repository hygiene + online proof
where relevant + current documentation + clean Git state = milestone closure`

Documentation must distinguish current contracts, active plans, and historical
evidence. Documentation and implementation must agree; when they conflict, inspect
the actual implementation and correct the stale record. The handoff names exactly
one next task and does not restart closed work.
