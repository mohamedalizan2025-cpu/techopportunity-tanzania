# AI Opportunity Intelligence V1

Status: **IMPLEMENTED · EXTERNAL PROVIDER DISABLED · DETERMINISTIC FALLBACK LIVE IN CODE**

This milestone adds an optional, grounded assistance layer for one trusted
opportunity and one authenticated user's existing `MatchingInput`. It does not
change Discovery, moderation, publication, geography, eligibility, ranking, or
the Explore/For You product boundary. No schema or migration is added.

## Architecture

```text
trusted published opportunity + owner-only talent profile
  -> existing deterministic matching and evidence derivation
  -> strict privacy allowlist / bounded AI context
  -> selected server-only provider (optional)
  -> strict response validation
  -> deterministic facts + validated readiness additions
  -> escaped React rendering
```

The implementation is split by responsibility:

- `lib/opportunity-intelligence/contract.ts` owns the privacy allowlist,
  deterministic evidence preparation, structured result, strict provider-output
  validation, and merge rule.
- `lib/opportunity-intelligence/provider.ts` owns the provider interface, exact
  provider selection, fixed prompt-injection boundary, test provider, and the
  disabled-by-default Groq adapter.
- `lib/opportunity-intelligence/service.ts` owns timeout, bounded in-memory
  response caching, provider error handling, and fail-closed fallback.
- `app/api/opportunity-insight/route.ts` is authenticated, rate-limited, resolves
  the opportunity/profile server-side, and accepts only an opportunity slug.
- `components/opportunity-insight.tsx` renders structured text only. It does not
  use raw HTML and contains no provider configuration or credential.

The established natural-language discovery assistant is a different bounded
use case documented in [AI_ASSISTANT_DESIGN.md](AI_ASSISTANT_DESIGN.md). It
interprets search filters and remains disabled. Opportunity Intelligence never
routes through that query planner.

## Deterministic versus AI responsibility

Deterministic code remains authoritative for:

- whether a record is published, active, and trusted enough for AI context;
- opportunity type, sector, geography, eligibility decision/evidence, deadline,
  and deadline urgency;
- the existing human-readable `explainMatch` reasons;
- all moderation, trust, admission, and canonical database state.

The provider may add only readiness observations, missing or unclear
information, suggested next actions, and a bounded confidence level plus
evidence limitations.

The provider schema deliberately has no eligibility, geography, trust,
publication, moderation, deadline-urgency, or deterministic-fit fields. Extra
keys invalidate the complete response. Valid additions are merged around the
deterministic result, never over it. The provider has no database client and no
write path.

## Privacy contract

The model input is an explicit allowlist:

- profile: career/study level, field/discipline, selected sectors, preferred
  opportunity types, selected skills, region, and experience level;
- opportunity: type, derived sector/geography, bounded verified description,
  authoritative eligibility decision/evidence, and deadline/evidence;
- deterministic fit reasons and deadline urgency; and
- a bounded evidence catalog used to validate provider citations.

The model input cannot contain name, email, phone, auth/user ID, display name,
database IDs, activity history, saved/application state, goals, CV content,
organization-private metadata, source URLs, or unrelated profile fields.
Direct email/phone/UUID/URL patterns in allowed free text are redacted. The
description is capped at 3,500 characters, evidence at 1,000 characters, and
skills/arrays retain the existing profile bounds.

The API receives only a slug, then resolves the authenticated user's owner-only
profile under existing RLS. The local rate-limit key is a one-way hash of the
auth ID and is never sent to a provider. Responses use `private, no-store`.

## Grounded result contract

`OpportunityInsight` contains `whyFit[]`, `eligibilityAssessment`,
`readiness[]`, `missingOrUnclear[]`, `nextActions[]`, deterministic
`deadlineUrgency`, and confidence plus evidence limitations.

Every item is labeled `verified_fact`, `profile_observation`, or `unknown`.
Provider evidence references must exist in the prepared catalog and match their
basis. Unknown items cannot cite evidence. Output is bounded, rejects control
characters/HTML delimiters, and is rendered as React text. Unknown eligibility
stays unknown; verified Tanzania access is never presented as proof that the
individual meets every other requirement.

## Prompt-injection boundary

Opportunity description and evidence are untrusted data. The provider always
receives a fixed system instruction before a separate serialized data message.
The fixed instruction says embedded instructions are data, limits the task to
readiness assistance, forbids invented requirements, and forbids changing
trust/eligibility/geography/publication/moderation. Prompt-like source text is
preserved as data so the boundary is testable; it is never concatenated into
the system instruction.

## Provider abstraction and activation

`OpportunityIntelligenceProvider` exposes one bounded `generate(input, signal)`
method. Provider IDs reserve `groq`, `gemini`, and `azure`; only Groq has a real
adapter in V1. Gemini and Azure AI / Foundry can be added behind the same
interface without changing privacy, grounding, route, cache, or UI contracts.
The mock adapter is injectable only by code/tests and never selected from
production environment configuration.

The Groq adapter uses one server-side HTTPS request, a JSON Schema response
format, an 8-second timeout, a 64 KiB response ceiling, and no SDK dependency.
The response is still locally validated because provider-side structured output
does not replace the application contract. Reference:
[Groq structured outputs](https://console.groq.com/docs/structured-outputs) and
[Groq API reference](https://console.groq.com/docs/api-reference).

Exact server-only configuration for a future, separately approved activation:

```dotenv
AI_OPPORTUNITY_INTELLIGENCE_ENABLED=true
AI_OPPORTUNITY_INTELLIGENCE_SPEND_MODE=free-quota
AI_OPPORTUNITY_INTELLIGENCE_PROVIDER=groq
AI_OPPORTUNITY_INTELLIGENCE_MODEL=openai/gpt-oss-20b
GROQ_API_KEY=<server-only secret>
```

No key may use a `NEXT_PUBLIC_` prefix. Activation also requires the owner to
verify that the provider account cannot bill beyond free quota; repository
configuration cannot prove an external account's billing state.

## Zero-spend and failure policy

Defaults are:

```dotenv
AI_OPPORTUNITY_INTELLIGENCE_ENABLED=false
AI_OPPORTUNITY_INTELLIGENCE_SPEND_MODE=zero
AI_OPPORTUNITY_INTELLIGENCE_PROVIDER=none
```

`zero` blocks every external call even if a credential exists. Provider
selection is exact: there is no automatic vendor fallback and therefore no
silent fallthrough to a paid API. `free-quota` permits only the explicitly
selected adapter. Missing configuration, unsupported adapter, timeout, HTTP
failure, quota exhaustion, oversized response, malformed JSON, schema failure,
or evidence-reference failure returns deterministic guidance.

Cost controls are one call per uncached insight, an 8-request/minute per-user
route limit, bounded input/output, an 8-second timeout, a 200-entry/6-hour
in-memory cache keyed only by sanitized context plus provider/model, and no
retry loop. The cache is intentionally instance-local at current scale; it
cannot expose one user's result to another because responses are keyed by the
complete sanitized profile context and never use shared HTTP caching.

## UX and fallback

Trusted opportunity detail pages expose **AI Opportunity Insight**. For You
adds a small link to that section without changing deterministic ranking or
cards. Anonymous users are asked to sign in because profile data is owner-only.
The panel shows Why this fits, Eligibility and readiness, What is unclear,
Suggested next actions, Deadline urgency, and Evidence limitations.

The UI clearly labels `AI-assisted` versus `Deterministic guidance`. When AI is
disabled or unavailable, the same action returns deterministic matching,
eligibility, urgency, limitations, and next steps. Explore, For You, detail,
Save, and Activity remain usable without a provider. No percentage or numeric
match score is shown.

## Current activation state

No supported provider credential was found during implementation. External AI
is not production-live, no provider account or billing was changed, and the
repository ships in hard zero-spend mode. Deterministic guidance is the active
fallback in code. Production activation is an owner-gated external-provider
change under `ENGINEERING_RULES.md`.

## Future provider options

- Add a Gemini adapter only after separately reviewing its current structured
  output API, free-quota/billing controls, and data-use terms.
- Add an Azure AI / Foundry adapter only after separately reviewing endpoint,
  deployment identity, student/free credits, hard budget controls, and data-use
  terms.
- Add durable caching only after traffic proves the instance-local cache is
  insufficient; do not add a database table merely for speculation.
- Evaluate usefulness and factual error rate against the deterministic baseline
  before enabling any provider in production.
