# Tech Opportunity architecture

Status: current system architecture. Operational state belongs in
[NEXT_SESSION_HANDOFF.md](NEXT_SESSION_HANDOFF.md); product sequencing belongs in
[PRODUCT_ROADMAP.md](PRODUCT_ROADMAP.md).

## System context

Tech Opportunity is a responsive, web-first opportunity directory for Tanzanian
users. It is a read-heavy Next.js application backed by Supabase and deployed on
Vercel. A scheduled discovery worker proposes records; human moderators remain the
only publication authority.

```text
GitHub -> Vercel -> Next.js UI and server logic
                         |
                         v
                  lib/data/* boundary
                         |
                         v
              Supabase PostgreSQL/Auth/RLS

approved sources -> discovery worker -> pending queue -> moderator -> public listing
```

There is no separate API service. Next.js Server Components, Route Handlers, and
Server Actions provide server-side behavior. PostgreSQL policies and functions
enforce data-level authorization.

## Code boundaries

| Area | Responsibility |
|---|---|
| `app/` | Routes, rendering, request handling, and server actions |
| `components/` | Reusable presentation and interaction components |
| `lib/data/` | All application reads and writes to Supabase |
| `lib/` | Domain types, lifecycle, trust, presentation, and validation rules |
| `scripts/discovery/` | Source acquisition, extraction, qualification, dedupe, insertion, and health |
| `scripts/alerts/` | Deadline alert evaluation |
| `scripts/verification/` | Change classification and permanent boundary enforcement |
| `supabase/migrations/` | Forward schema definitions and RLS contracts |

The central application rule is:

```text
UI -> lib/data/* -> Supabase
```

UI code must not import a database client or construct database queries directly.
This keeps security review concentrated, gives all callers consistent domain types,
and leaves room for a future service boundary without rewriting the UI.

## Environments and delivery

- GitHub is the source of truth. Vercel deploys the Next.js application.
- Production Supabase ref: `jltuufukcwztugvojwjd`.
- Isolated staging Supabase ref: `pumzofcwfjqswkiwfqty`.
- Local values live only in ignored `.env.local`; cloud values live in scoped
  provider configuration.
- `NEXT_PUBLIC_*` values are browser-visible. Their safety depends on RLS.
- `SUPABASE_SERVICE_ROLE_KEY` is privileged, server/worker-only, and must never
  enter browser code, logs, documentation values, or Git.
- Database or provider mutations require explicit target proof and bounded
  authorization. See [ENGINEERING_RULES.md](ENGINEERING_RULES.md).

The repository's migration history is not normalized to the live database.
Migrations 0013 and 0014 were deliberately applied through guarded, checksummed,
failure-stopping transactions. Broad `db push`, replay of 0001–0012, or migration
history repair is unsafe without a separately reviewed plan.

## Public product and identity

Public visitors can browse, search, filter, and inspect published opportunities.
Authenticated users can save opportunities and manage private deadline-alert
preferences. Staff-only routes provide moderation and reversible unpublication.

Supabase Auth issues the identity used by server-side clients. RLS is the hard
authorization boundary; route checks improve UX but never replace database policy.
Public reads expose published records only. Saves, preferences, and alert events are
private to their owner. Staff role membership is stored in `profiles` and is not
self-service.

## Opportunity lifecycle and trust

The durable lifecycle is `pending`, `published`, or `rejected`. Discovery and public
submission can create only `pending` records. Only a staff decision can publish.
Unpublication is a reversible `published -> rejected` transition; routine product
operations do not delete opportunity history.

An opportunity's deadline state is derived as one of `upcoming`, `closed`,
`rolling`, or `unknown`. Missing or malformed evidence is `unknown`, never inferred
as rolling. Country, eligibility, relevance, deadline, and attribution are separate
facts; absence of evidence never supplies a value.

M31 makes evidence explicit:

- each opportunity has one canonical reference and may have additional evidence
  references;
- historical country values remain data but start unverified;
- qualification and moderation evidence are stored separately from display text;
- publication requires explicit relevance and Tanzanian-eligibility evidence;
- the country enrichment audit accepts the bounded M31 field set added by 0014;
- the reference-sync trigger preserves canonical-reference coverage.

M31 is active in production and staging. Its implementation and rollout evidence
are preserved in [MILESTONE_31_DATA_TRUST.md](MILESTONE_31_DATA_TRUST.md) and
[M31_STAGING_RUNBOOK.md](M31_STAGING_RUNBOOK.md).

## Discovery pipeline

```text
allow-listed source
  -> controlled fetch
  -> structured/feed/source-specific extraction
  -> normalization
  -> deterministic scope and eligibility qualification
  -> evidence preservation
  -> conservative dedupe
  -> pending insert
  -> human moderation
```

Acquisition is bounded by scheme, redirect, host/IP, response-size, and timeout
guards. Fetched content is untrusted. The source registry is an allow-list; source
activation requires measured evidence. Generic heading extraction is disabled for
ambiguous institutional source families unless a representative source-specific
fixture proves the boundary. Roundup pages must be decomposed into discrete
opportunities and are not accepted as an undifferentiated listing.

One row represents one actionable opportunity. URL equality is a strong automatic
identity signal. Conservative normalized-title/year matching can flag a duplicate,
but ambiguous matches remain for human judgment. Provenance is retained; dedupe
must not silently merge or discard distinct opportunities.

The worker uses an anonymous client for pending inserts so RLS constrains it. The
service role is limited to privileged worker operations such as registry reads and
source-health updates. A total source failure fails the run; partial source failures
remain isolated and visible in the structured summary.

GitHub Actions schedules discovery four times daily. Schedule, source, and pipeline
health are evidence-based states defined in
[DISCOVERY_HEALTH.md](DISCOVERY_HEALTH.md), not assumptions derived from a deployed
cron expression.

## Verification and observability

Every discovery run emits a machine-readable summary containing attempted and
failed sources, candidate dispositions, inserts, duplicates, category skips,
source-health results, errors, and duration. Comparable scheduled observations feed
the bounded health history. Production claims must correlate the tested commit,
deployment, target, and observable result.

`npm run verify` is the default local gate. The verification planner selects
additional gates from the changed paths; `npm run verify:ci` includes a production
build. Exact rules are in [VERIFICATION_CONTRACT.md](VERIFICATION_CONTRACT.md).

## AI boundary

The assistant route, deterministic query-plan contract, grounding fallback, rate
limit, and kill switch are scaffolded, but no provider, API key, SDK, embeddings, or
vector store is operational. AI cannot acquire, qualify, deduplicate, moderate,
publish, determine eligibility, invent deadlines, or establish identity. Any future
activation must pass corpus/trust readiness, privacy, cost, grounding, evaluation,
fallback, and explicit authorization gates. See
[AI_ASSISTANT_DESIGN.md](AI_ASSISTANT_DESIGN.md).

## Evolution triggers

The current Next.js/Supabase shape remains appropriate until measured requirements
justify more infrastructure. Introduce a separate service only for a concrete need
such as GPU/long-running inference, a public versioned partner API, independently
scaled server workloads, or separate team release cycles. A future native client
may reuse Supabase Auth, storage, RLS, and domain contracts; no mobile framework is
part of the current product.

Maps remain deferred. If built, store provider-neutral address fields and WGS84
coordinates, keep location optional, and put provider-specific rendering behind an
adapter. Near-me search would require a separately verified geospatial design.

## Non-negotiable invariants

1. Human moderation is the only publication authority.
2. RLS is authoritative; UI and route guards are not security boundaries.
3. Application data access stays inside `lib/data/`.
4. Unknown facts remain unknown and visible as such.
5. Evidence and provenance are preserved across normalization and moderation.
6. Discovery inserts pending records only and fails closed on unsafe acquisition.
7. Production and staging identities are proved before mutation and never mixed.
8. Secrets, private backups, and raw security catalogs never enter Git.
9. Schema changes are forward, reviewed, recoverable, and explicitly authorized.
10. Production and milestone claims require exact, reproducible evidence.

## Stable implementation cross-references

These identifiers are retained because code and migration comments cite them. They
are current constraints, not a milestone history.

### §12.1 Queue scale guard

The staff pending queue has an explicit 500-row cap. Reaching it is the measured
trigger to implement server-side queue pagination; silently relying on PostgREST's
implicit row limit is forbidden.

### §12.2 Location and eligibility

Physical location and eligibility are independent. A foreign or missing country does
not decide whether Tanzanians may apply. Eligibility stays unknown until bounded
evidence or a moderator decision establishes it.

### §12.5 Acquisition resolution gate

The current hostname screen blocks obvious local/private/reserved targets and checks
every redirect, but pre-flight string checks cannot prevent DNS rebinding. Before a
major source expansion, add and verify connection-level resolved-IP enforcement at
the shared acquisition boundary.

### §12.6 Dedupe scale guard

Dedupe explicitly pages through opportunity rows. If it reaches the configured
100,000-row cap, move candidate identity/dedupe selection into bounded database-side
queries before increasing the limit.
