# AI Opportunity Intelligence V2

Status (2026-10-04): **V2 AUTHORIZED AS CURRENT MILESTONE · ARCHITECTURE REUSED,
NOT REBUILT · EXTERNAL PROVIDERS DISABLED · DETERMINISTIC FALLBACK LIVE ·
PRODUCTION AI OFF UNTIL EVALUATION/PRIVACY/BILLING GATES PASS**

This document is the authoritative product + technical design for AI V2. The
5–10-user pilot remains pending and valuable, but implementation priority is
AI V2. Nothing here records that the pilot happened, and the pilot protocol
is unchanged.

## 1. Product purpose

Turn verified opportunity data plus the user's own profile into plain,
actionable guidance: why a listing may fit, what is verified, what is
unknown, and what to do next. AI explains and plans; it never decides.

## 2. Why AI exists in Tech Opportunity

The core jobs (discover → verify → prioritize → track → apply) stall at
"is this for me, and what do I do first?" Deterministic matching already
orders and labels fit; AI adds readable explanations and ordered readiness
plans over the same verified evidence, reducing time-to-action without
replacing human judgment or the official source.

## 3. Why this is not a ChatGPT wrapper

ChatGPT answers from the open web with no memory of our corpus, no
publication gate, no deadline lifecycle, and no Tanzania-access evidence.
This system operates ONLY on our moderated corpus, reuses deterministic
trust/eligibility/deadline authority, sends a strict allowlist (never
identity, activity, CVs, or essays), validates every model output against a
versioned schema, and fails closed to deterministic guidance. The moat
remains the corpus + workflow, never the model.

## 4. Deterministic authority vs AI responsibility

Deterministic eligibility comes BEFORE AI, in this fixed order: stored
eligibility decision + evidence (`unknown` / `tanzanians_eligible` /
`tanzanians_not_eligible`, evidence required for any non-unknown value) is
read from the moderated record and rendered as the eligibility snapshot;
only then may AI add bounded readiness observations around it. AI never
decides, overrides, or rephrases eligibility, and unknown stays unknown.

Deterministic code is SOLE authority for: publication/active/trust status,
type, sector, geography, eligibility decision and evidence, deadline and
urgency, `explainMatch` reasons, and all moderation/database state. A
provider may add ONLY: readiness observations, missing/unclear information,
suggested next actions, and bounded confidence plus evidence limitations.
The provider schema has no eligibility, geography, trust, publication,
deadline, fit, score, or percentage fields — extra keys invalidate the whole
response. Valid additions merge around deterministic facts, never over them.
The provider has no database client and no write path.

## 5. User-facing AI surfaces

- **AI Match "Why this fits you" (route `/for-you`)**: deterministic reasons
  always visible; an on-demand per-card AI explanation (same endpoint, same
  contract) adds bounded why-fit/readiness/next-action detail. Never
  auto-fetched on list render; never a percentage or score.
- **Detail "Opportunity Intelligence" brief**: plain summary of what the
  call is, why it may fit, eligibility snapshot, what is known, what is NOT
  known, suggested next steps, official source. Labeled "AI-assisted
  explanation based on verified opportunity data" — never "AI verified this
  opportunity."
- **Readiness planner** (signed-in users with Interested/Applying status):
  ordered application plan (review eligibility → confirm deadline/timezone
  → check each required document at the source → submit early). A document
  is listed as REQUIRED only when stored evidence supports it; otherwise
  the step reads "Check whether the official application requires …".
  Planning assistance only — never automatic submission.
- **Ask Tech Opportunity** (bounded Q&A over published listings only;
  `app/api/assistant/ask/route.ts`): opportunity-first questions execute a
  deterministic-or-AI plan against published rows only. Contract: kill switch
  `ASSISTANT_ENABLED` (default disabled — disabled returns a browse-guidance
  response with no search and no provider call); ≤200-char questions;
  per-client rate limit; `isNonOpportunityQuery` out-of-scope guard returns a
  product-boundary response with no search, no provider call, and no news
  retrieval (uncertain questions are treated as opportunity queries);
  unconfigured provider uses the deterministic `fallbackPlan` (the provider
  never sees database content); execution runs published-only queries with
  explicit caps. Same posture as the insight surfaces: deterministic-first,
  fail-closed, production OFF until separately approved. Any thin Ask page is
  a client over this same contract, never a second authority.
- Future **Application Copilot** (CV review, drafting, interview prep) is
  explicitly deferred: it needs a separate privacy/consent milestone before
  any CV, essay, or identifying content may leave the device boundary.

## 5b. What AI is NOT

- **No general-purpose chatbot.** Both the insight surfaces and Ask answer
  ONLY from the moderated corpus plus the allowlisted profile (§6). Open-web
  questions, news retrieval, memory of private data beyond the allowlist, and
  follow-up reasoning outside the fixed readiness task are out of scope —
  out-of-scope input gets a boundary response, not an attempted answer.
- **No autonomous applications.** The platform records Interested / Applying /
  Applied progress but never submits on the user's behalf, never proves a
  provider received an application, and never auto-fills external forms.

## 6. Privacy/data boundary

The profile allowlist is EXACTLY the sanitized matching input — nothing else
may leave the boundary:

- Allowed profile fields: career/education level, field/discipline,
  sectors/interests, preferred opportunity types, skills, region, experience
  level. Goals are never sent.
- Allowed opportunity evidence: bounded type/sector/geography/description
  (≤3,500 chars), eligibility decision + evidence, deadline value/precision +
  evidence (≤1,000 chars), deterministic reasons/urgency, evidence catalog.

External input is exactly `SanitizedOpportunityIntelligenceInput`: bounded
opportunity type/sector/geography/description/eligibility/deadline evidence,
selected profile fields (level, field, sectors, types, skills, region,
experience), deterministic reasons/urgency, and an evidence catalog.
NEVER sent: name, email, phone, auth/user ID, display name, database IDs,
activity history, saved/funnel states, goals, CVs, essays, documents,
organization-private metadata, or source URLs. Free-text identifiers are
redacted; description ≤3,500 chars, evidence ≤1,000. Rate-limit keys are
one-way hashes never sent externally. Responses are `private, no-store`.
V2 adds no new outbound field.

## 7. Provider architecture

`OpportunityIntelligenceProvider.generate(input, signal)`; exact chain
Gemini primary → Groq backup → deterministic fallback, selected ONLY when
enabled + free-quota spend mode + exact `gemini,groq` chain string + both
credentials + all four owner attestations. Partial config cannot promote the
backup: any missing link fails closed to the deterministic insight with a
machine-readable `availabilityReason`. Azure is a
reserved ID only; mock is code/test-injectable only, never env-selected.
One attempt per provider per uncached insight, shared 8s budget split
across remaining attempts, provider output budgets (Groq 1600 completion
tokens with low reasoning effort — verified minimum for valid strict JSON
from gpt-oss-20b; Gemini 700 max output tokens), 64 KiB response ceiling,
no retries, no SDK. Defaults ship hard zero-spend (`ENABLED=false`,
`SPEND_MODE=zero`, chain `none`).

## 8. Failure/fallback architecture

Every failure path — disabled, zero-spend, unconfigured, unavailable,
quota, timeout, invalid JSON/schema, unsafe output — returns the
deterministic insight with a machine-readable `availabilityReason` and an
honest UI label. Explore, For You, detail, Save, and Activity work fully
without any provider. No stack traces, no fake percentages, no provider
names exposed to normal users (UI shows "AI-assisted result" only by mode).

## 9. Evaluation strategy

Three layers, all versioned in Git: (a) 16-case synthetic contract corpus
(adversarial overrides, injection, redaction, malformed output) via mock
provider — must stay green with 0 hard failures; (b) static public-facts
corpus (hand-verified live listings + synthetic profiles, mock provider)
covering fit explanation, unknown handling, Tanzania eligibility, deadline
handling, source/requirements fidelity, injection resistance, next-action
usefulness — AI may paraphrase, never invent; (c) gated real-provider runs
(Gemini, Groq independently) requiring credentials + privacy/billing
attestations + explicit confirmation. Zero hard failures required before
any staging activation, let alone production.

## 10. Staging rollout (owner-approved 2026-10-04; activation pending secret config)

STAGING BAR (distinct from production): zero hard authority failures,
zero private-data leakage, deterministic fallback proven, primary ≥80%
valid AI responses on the fixed corpus (Gemini measured 14/16 = 87.5%),
backup materially functional (Groq measured 9/16 with zero quota errors
after pacing — exercisable, weaker), bounded latency, no uncontrolled
retries, no uncontrolled billing. Current evidence satisfies this bar;
the earlier zero-fallback requirement applies to production, not staging.
Activation is staging-environment variables ONLY (protected branch Preview
deployment, isolated staging Supabase, synthetic users) — no code change
is needed: with the variables below set, the chain selects automatically;
without them every surface falls back to deterministic behavior.
Required staging variable NAMES (values set by owner in the deployment
environment, never in code/docs/chat):
AI_OPPORTUNITY_INTELLIGENCE_ENABLED, AI_OPPORTUNITY_INTELLIGENCE_SPEND_MODE
(=free-quota), AI_OPPORTUNITY_INTELLIGENCE_PROVIDER_CHAIN (=gemini,groq),
GEMINI_API_KEY, GROQ_API_KEY,
AI_OPPORTUNITY_INTELLIGENCE_GEMINI_UNPAID_DATA_USE_CONFIRMED,
AI_OPPORTUNITY_INTELLIGENCE_GEMINI_NO_BILLING_CONFIRMED,
AI_OPPORTUNITY_INTELLIGENCE_GROQ_ZDR_CONFIRMED,
AI_OPPORTUNITY_INTELLIGENCE_GROQ_NO_BILLING_CONFIRMED
(optional model pins AI_OPPORTUNITY_INTELLIGENCE_GEMINI_MODEL /
AI_OPPORTUNITY_INTELLIGENCE_GROQ_MODEL; code defaults apply otherwise).
STATUS: STAGING AI = APPROVED, PENDING SECRET CONFIG (not yet active).
Then verify anonymous, signed-in, incomplete/full profile, National,
International, unknown eligibility, deadline-soon, provider-failure, and
fallback paths at 390px and 1366/1440px. Production stays OFF.

## 11. Production rollout gates (separate; NOT satisfied by staging approval)

Separate explicit owner decision AFTER: successful staging behavior, real
UI smoke tests, acceptable observed fallback rate, acceptable provider
latency, no privacy or authority regression, and a fresh owner cost/privacy
decision. Staging evidence informs but never auto-satisfies this gate.
Report is exactly one of BLOCKED / READY_FOR_OWNER_APPROVAL / ACTIVE —
never ACTIVE without verified owner-authorized activation. Current state:
PRODUCTION AI = OFF. Full evidence template:
[PRODUCTION_AI_DECISION_CHECKLIST.md](PRODUCTION_AI_DECISION_CHECKLIST.md).
Emergency kill switch (production, if ever activated): set
`AI_OPPORTUNITY_INTELLIGENCE_ENABLED=false` in the production env, redeploy,
and verify all surfaces deterministic with no external calls. The Ask surface
has its own independent kill switch (`ASSISTANT_ENABLED`); disabling either
surface never affects the other's deterministic fallback.

## 12. Telemetry

Privacy-safe in-memory counters only: provider attempted, AI success,
deterministic fallback, validation failures, quota/timeout counts, latency
observations. No raw prompts, no provider responses containing user context,
no persistence, no per-user tracking. Counters feed the evaluation report;
no telemetry endpoint exists.

## 13. Cost controls

Off by default; server-side only; bounded input/output; one call per
provider per uncached insight; 8s shared timeout; 8 req/min per-user route
limit; 200-entry/6h instance-local cache keyed by full sanitized context
(never cross-user); no retries; no background or list-render calls — AI
runs only on explicit user action (detail button, For You explanation,
planner open). No paid resource without owner approval.

## 14. Abuse/injection defenses

Opportunity text is untrusted data in a separate message under fixed
system instructions; injection fixtures prove prompt text stays data and
never enters system instructions. Strict schema (`additionalProperties:
false`) + local re-validation; basis/evidenceRef consistency enforced
(unknown cites nothing; verified_fact cites verified catalog only);
control characters, HTML, percentages, and score language rejected;
oversized payloads, hostile slugs, and bodies rejected at the route;
rate limiting per hashed user. Wire detail (verified live 2026-10-04):
Groq receives the full strict schema; Gemini receives a deep-stripped copy
(`responseMimeType` + `responseSchema`) because the live generateContent
endpoint rejects `additionalProperties` with 400 — local re-validation
against the full strict schema stays authoritative for both, so nothing is
weakened. The system prompt additionally states the evidence-reference rules
explicitly (verified_fact cites verified_fact only, profile_observation
needs a profile_observation ref, unknown cites nothing with a negative
example) — verified live 2026-10-04 to lift Gemini conformance 6/16 to
14/16 with zero hard failures; the validator is unchanged and still
rejects any violation.

## 15. Model replacement strategy

Models are configuration (`*_MODEL` env), never architecture: any
replacement must support JSON-schema structured output, fit the 8s timeout
and its provider output budget (Groq gpt-oss-20b: 1600 completion tokens
with low reasoning effort, verified live 2026-10-04 as the minimum for
valid strict-JSON documents; user-visible text stays validator-capped),
pass the unchanged evaluation corpora with zero hard failures, and carry
fresh owner privacy/billing attestations for its own data-use terms.
The deterministic contract never changes for a model swap.

## 16. V2 scope vs future Application Copilot scope

V2 (this milestone): For You on-demand explanations, detail intelligence
brief (+ required labeling), Interested/Applying readiness planner over
existing contract fields, telemetry counters, public-facts evaluation
corpus, re-verified provider docs, staging readiness — all with production
AI OFF. Explicitly NOT V2: CV/essay/document handling, drafting help,
interview prep, any new outbound data, any production activation. Those
belong to a future Application Copilot milestone gated on its own
privacy/consent design plus this V2 passing evaluation.

## Implementation map (code truth)

- `lib/opportunity-intelligence/contract.ts` — allowlist, evidence prep,
  result type, strict validator, merge rule, deterministic fallback,
  readiness-plan builder.
- `lib/opportunity-intelligence/provider.ts` — interface, exact chain
  selection, fixed injection boundary, Gemini/Groq adapters, mock factory.
- `lib/opportunity-intelligence/service.ts` — timeout, bounded cache,
  fail-closed fallback.
- `lib/opportunity-intelligence/telemetry.ts` — privacy-safe counters.
- `app/api/opportunity-insight/route.ts` — auth, slug/shape/size checks,
  rate limit, published+active+trusted gate, RLS profile, private no-store.
- `app/api/assistant/ask/route.ts` — kill switch, 200-char bound, rate limit,
  out-of-scope guard, deterministic fallback plan, published-only execution.
- `components/opportunity-insight.tsx` — user-triggered fetch, mode labels,
  readiness-plan section for Interested/Applying/Applied states.
- `components/for-you-explanation.tsx` — AI Match on-demand per-card explanation.
- `scripts/opportunity-intelligence/` — 16-case synthetic corpus, static
  public-facts corpus, mock-first harness, independently gated real runs.
