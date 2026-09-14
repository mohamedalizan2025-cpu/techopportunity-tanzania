# Engineering rules

These rules are permanent unless the owner explicitly replaces them. Milestone
briefs may narrow scope but do not weaken these boundaries.

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
   protected data.
2. Prove the exact environment before every external mutation. Production is
   `jltuufukcwztugvojwjd`; staging is `pumzofcwfjqswkiwfqty`. Fail closed if the
   target is ambiguous or the two resolve to the same project.
3. `.env.local` is production-only in this repository and must not be loaded for a
   staging operation. Use separately protected target-specific credentials.
4. Never copy production identities, sessions, profiles, saves, preferences,
   alerts, or private rows to staging. Staging evidence uses synthetic data.
5. RLS is the authorization boundary. Browser-visible keys are acceptable only
   because RLS constrains them. Service-role access is server/worker-only and kept
   to the smallest privileged operation.
6. External database, deployment, DNS, provider, schedule, registry, or secret
   changes require explicit bounded authorization. Read-only inspection does not
   imply permission to mutate.
7. Keep the product online. Use isolated staging before risky production changes,
   then promote only the verified bounded change.

## Data and product integrity

1. `UI -> lib/data/* -> Supabase` is the application data path. UI modules do not
   query Supabase directly.
2. Discovery and public submissions create `pending` records only. A human staff
   decision is the sole path to `published`.
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

## Database and recovery

1. Inspect the live target before planning DDL; historical migration files do not
   prove live state.
2. Use forward, reviewed, bounded migrations with a verified recovery point,
   target guard, input hash, failure-stop transaction, and post-change proof.
3. Do not run broad `db push`, replay 0001–0012, or repair/normalize migration
   history. Production intentionally lacks normalized migration history.
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
4. Start from a known Git state; preserve unrelated user work. A milestone ends with
   an intentional diff, no generated or secret artifacts, and a clean worktree.
5. Run the standard and change-triggered gates in
   [VERIFICATION_CONTRACT.md](VERIFICATION_CONTRACT.md). When a gate cannot run,
   report the exact cause and the strongest evidence actually obtained.
6. Correlate production proof to the exact commit, deployment, environment, action,
   and observable result. A configured schedule, successful build, or old run is not
   proof of current behavior.
7. Never claim a migration, deployment, test, recovery, user flow, or production
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
Provider activation requires explicit approval plus corpus readiness, privacy,
grounding, evaluation, fallback, rate-limit, kill-switch, and cost controls.

## Closure rule

`implementation + proportional verification + repository hygiene + online proof
where relevant + current documentation + clean Git state = milestone closure`

Documentation must distinguish current contracts, active plans, and historical
evidence. Documentation and implementation must agree; when they conflict, inspect
the actual implementation and correct the stale record. The handoff names exactly
one next task and does not restart closed work.
