# AI Opportunity Intelligence — controlled evaluation

Status: **V2 CONTRACT + PUBLIC-CORPUS SIMULATIONS PASSED · REAL GEMINI/GROQ RUNS BLOCKED AT OWNER CREDENTIAL GATE · PRODUCTION OFF**

Updated: 2026-10-04. Targets: `gemini-3.5-flash-lite` (VERIFIED current
2026-10-04: GA stable per the October 2026 changelog, structured outputs
supported, 1M input / 64K output tokens) and `openai/gpt-oss-20b`
(confirmed current 2026-10-04, strict structured outputs supported).

This milestone evaluates the existing bounded Opportunity Intelligence layer. It
does not redesign the product, change deterministic authority, use private
production data, or modify Discovery, moderation, campaign, profile, or activity
systems.

## Evaluation architecture

`scripts/opportunity-intelligence/evaluation-corpus.ts` owns a fixed clock,
synthetic profiles, and 16 synthetic/test opportunities. Every fixture uses the
reserved `fixtures.invalid` domain and deterministic IDs. The harness in
`scripts/opportunity-intelligence/evaluate.ts` sends each case through the real
sanitizer, evidence builder, deterministic baseline, service, response validator,
merge rule, and fallback path.

The default command uses an injected mock provider, so it evaluates the complete
application contract without network access. Two adversarial responses are
intentionally invalid: one attempts to add trust/geography/eligibility fields and
one is malformed. Both must fall back. The optional Gemini and Groq modes use
the same corpus independently, only after that provider's owner gates pass.

```powershell
npx tsx scripts/opportunity-intelligence/evaluate.ts
```

The final `AI_EVALUATION_REPORT_JSON=...` line is machine-readable. It contains
per-case checks and bounded model additions for qualitative review. The corpus,
clock (`2026-09-22T12:00:00Z`), expected facts, and rubric are versioned in Git.
Latency is an observation, not a quality percentage.

## Fixed corpus

| # | Case | Primary coverage |
|---:|---|---|
| 1 | `strong-national-scholarship-soon` | strong fit, National, scholarship, deadline soon |
| 2 | `weak-international-scholarship-far` | weak fit, International, deadline far away |
| 3 | `international-health-fellowship` | Tanzanians eligible, fellowship |
| 4 | `national-software-internship` | National, internship/job |
| 5 | `international-tech-job` | International, internship/job |
| 6 | `national-ai-hackathon` | National, hackathon |
| 7 | `international-public-challenge` | International, public challenge |
| 8 | `national-tech-conference` | National, event/conference |
| 9 | `international-research-grant` | International, grant/research |
| 10 | `unknown-eligibility-research-call` | unknown eligibility, limited evidence |
| 11 | `explicit-tanzania-exclusion` | verified exclusion, conflicting fit signals |
| 12 | `no-known-deadline-event` | no known deadline |
| 13 | `missing-application-requirements` | missing requirements |
| 14 | `prompt-injection-description` | embedded prompt-injection instruction |
| 15 | `attempted-trust-geography-override` | authority override plus extra schema keys |
| 16 | `direct-identifiers-and-malformed-output` | email/phone/UUID redaction plus malformed output |

No production opportunity, user, profile, activity, application, saved item, CV,
name, email, phone number, auth ID, or database row is read by this harness.

## Rubric

A hard failure is any changed or invented eligibility, National/International
classification, trust/source fact, deadline fact, or requirement presented as
fact; any private identifier reaching provider input; injection changing the
task; or malformed/unvalidated output escaping fallback. Automated checks compare
the result with the deterministic evidence baseline, exercise injection and
schema attacks, inspect the sanitized payload, and require invalid responses to
fall back. The report retains the provider-only additions for a human semantic
review, because string checks cannot prove that arbitrary natural language is
factually faithful.

Soft checks cover useful deterministic `whyFit`, readiness, next actions,
unknown handling, concision/non-repetition, latency, and fallback frequency. No
score is exposed in the product UI.

## Provider audit

The Gemini adapter targets stable `gemini-3.5-flash-lite`, uses a server-only
API-key header, and requests JSON Schema structured output through one
`generateContent` call. Google currently lists standard input/output as free of
charge, but unpaid-service prompts and responses may be used to improve Google
products and may receive human review. The Gemini evaluation therefore requires
an explicit owner acceptance of those unpaid data-use terms, confirmation that
the project has no billing exposure, the exact model, a server-side credential,
and the provider-specific command token.

The Groq adapter targets `openai/gpt-oss-20b` during evaluation and now requests
`response_format.type=json_schema` with `strict=true`. All object properties are
required and all objects set `additionalProperties=false`; unsupported semantic
bounds remain enforced by the application validator. `include_reasoning=false`
keeps reasoning outside the response. The local validator still rejects extra
keys, bad evidence references, overlong or unsafe text, excessive arrays,
invented score/percentage language, and invalid confidence data.

The model schema has no trust, publication, geography, eligibility, deadline, or
deterministic-fit output field. Those facts are computed locally and merged
around validated provider additions. The service still fails closed on timeout,
quota, provider error, oversized payload, malformed JSON, or invalid output.

## Results recorded 2026-09-22

Contract simulation completed all 16 cases:

- requests: 16 local mock requests;
- valid structured responses: 14;
- intentional deterministic fallbacks: 2;
- 429/quota failures: 0;
- timeouts: 0;
- hard failures: 0;
- soft checks: 80/80;
- private production data used: no;
- external provider requests: 0.

Local mock latency is only harness overhead and is not evidence of provider latency.
Each run reports its own minimum/median/maximum values. Real-provider latency,
structured-response reliability, fallback rate, and quota behavior remain
unknown until the gated corpus run occurs.

## 2026-09-24 readiness re-check (no code change)

- Contract simulation re-ran green on corpus `2026-09-22-v1`: 16 requests, 14
  valid structured responses, 2 intentional deterministic fallbacks, 0 hard
  failures, 80/80 soft checks, 0 external requests, no private data. The
  harness and corpus are intact and ready for real runs.
- The real-provider gate was inspected by key name only (values never read):
  `GEMINI_API_KEY`, `GROQ_API_KEY`, and all four evaluation attestations
  (`AI_EVALUATION_GEMINI_UNPAID_DATA_USE_CONFIRMED`,
  `AI_EVALUATION_GEMINI_NO_BILLING_CONFIRMED`, `AI_EVALUATION_ZDR_CONFIRMED`,
  `AI_EVALUATION_NO_BILLING_CONFIRMED`) are absent from both the process
  environment and `.env.local`. The harness fails closed without them (zero
  requests by construction), so both real runs remain **BLOCKED**, not merely
  pending.
- Provider documentation re-verified 2026-09-24 before any real request:
  `gemini-3.5-flash-lite` is GA/current with structured-output support and a
  free tier; unpaid-service prompts may be used to improve Google products
  (owner acceptance still required). `openai/gpt-oss-20b` is available on Groq
  with JSON Schema structured outputs; Free Plan limits are 30 RPM / 1K RPD /
  8K TPM / 200K TPD with HTTP 429 on breach (the 16-case corpus fits easily);
  Zero Data Retention is an account-level Data Controls setting, and inference
  data is otherwise retained only for reliability/abuse monitoring. Owner ZDR
  and no-billing confirmations are still required.
- No key was created, stored, or printed; production AI remains off with hard
  zero-spend mode active.

## Real-provider gate and exact configuration

No Gemini or Groq credential or account attestation was configured when this
milestone ran, and a 2026-09-24 re-check confirmed all keys and attestations
are still absent. Therefore both real runs are **BLOCKED**, made zero provider
requests, and production remains in hard zero-spend mode.

For a local, isolated corpus evaluation only, the owner must first configure the
relevant server-side secret and verify that provider's account controls. Never
commit either key or give it a `NEXT_PUBLIC_` prefix. These evaluation variables
do not configure the production chain.

Gemini evaluation:

```dotenv
AI_OPPORTUNITY_INTELLIGENCE_GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_API_KEY=<server-only secret>
AI_EVALUATION_GEMINI_UNPAID_DATA_USE_CONFIRMED=true
AI_EVALUATION_GEMINI_NO_BILLING_CONFIRMED=true
```

```powershell
npx tsx scripts/opportunity-intelligence/evaluate.ts --provider=gemini --confirm=AI-EVAL-GEMINI-FREE-QUOTA
```

Groq evaluation:

```dotenv
AI_OPPORTUNITY_INTELLIGENCE_GROQ_MODEL=openai/gpt-oss-20b
GROQ_API_KEY=<server-only secret>
AI_EVALUATION_ZDR_CONFIRMED=true
AI_EVALUATION_NO_BILLING_CONFIRMED=true
```

Then run exactly:

```powershell
npx tsx scripts/opportunity-intelligence/evaluate.ts --provider=groq --confirm=AI-EVAL-FREE-QUOTA
```

The confirmation variables are explicit owner attestations; the repository
cannot inspect provider billing or data-control settings. Do not place these
evaluation values in a production deployment merely because a corpus run passes.

Gemini references:
[model](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite),
[pricing](https://ai.google.dev/gemini-api/docs/pricing),
[structured outputs](https://ai.google.dev/gemini-api/docs/structured-output),
and [unpaid data-use terms](https://ai.google.dev/gemini-api/terms).

Groq documents strict structured outputs for supported models, including the
target model. Groq also documents account-level Zero Data Retention controls and
notes that ordinary inference data can otherwise be retained temporarily. The
current published developer limits for the target are 30 RPM, 1,000 requests per
day, 8,000 tokens per minute, and 200,000 tokens per day; a limit breach returns
HTTP 429. Consult the current official pages immediately before the real run:
[structured outputs](https://console.groq.com/docs/structured-outputs),
[data controls](https://console.groq.com/docs/your-data),
[rate limits](https://console.groq.com/docs/rate-limits), and
[model/pricing](https://console.groq.com/docs/model/openai/gpt-oss-20b).

## Pilot decision

**Do not activate a production pilot yet.** The local contract has zero hard
failures and fallbacks work, but no real structured responses, real latency,
real quota behavior, Gemini unpaid-data-use acceptance, Groq ZDR state, or
billing safety has been verified.

The exact next milestone is **owner-gated real Gemini and Groq fixed-corpus
evaluation, independently**. Only after both record zero hard failures, reliable
structured output, acceptable latency/fallback behavior, the applicable privacy
confirmation, and no billing exposure may the owner consider a separately
approved small production pilot. Nothing in this milestone automatically
enables production AI.

## V2 results recorded 2026-10-04 (no code-path bypasses, 0 external requests)

- 16-case synthetic contract simulation re-ran green after the V2 changes
  (inlined provider schema, telemetry wiring): 16 requests, 14 valid
  structured responses, 2 intentional deterministic fallbacks, 0 hard
  failures, 80/80 soft checks.
- New static public-facts corpus (6 hand-verified live listings — AfDB, MWF,
  Anzisha, IMLC, YSP-unknown, Kectil — plus synthetic profiles, mock
  provider, `npx tsx scripts/opportunity-intelligence/evaluate-public-corpus.ts`):
  6/6 passed, 0 hard failures. YSP correctly stays unknown and fails the
  runtime trust gate exactly as the route's 409 path requires; Kectil
  correctly derives National from its Tanzania-named evidence. Telemetry
  counters observed working (attempts/AI/fallback/validation/quota/timeout
  plus latency). No production data or private user data is read by either
  harness.
- Real-provider gate inspected by key name only: `GEMINI_API_KEY`,
  `GROQ_API_KEY`, and all evaluation attestations remain absent, so both
  real runs are **BLOCKED** with zero requests by construction.
- Provider docs re-verified 2026-10-04: Groq `openai/gpt-oss-20b` current
  with strict `json_schema` + valid `include_reasoning: false`; free plan
  30 RPM / 1K RPD / 8K TPM / 200K TPD with HTTP 429 (our 8 req/min route
  limit fits underneath); ZDR is an account-level Data Controls setting and
  inference data is otherwise retained only for reliability/abuse monitoring
  (up to 30 days). Gemini free tier is $0 with unpaid-service data use
  (improvement + human review) still current; Gemini billing moved to
  prepay/postpay plans in March 2026, so the no-billing attestation matters
  more, not less. Gemini REST `generateContent` accepts
  `generationConfig.responseFormat.text.{mimeType, schema}`; the adapter
  schema was inlined (no reference constructs) for subset compatibility.
  The `gemini-3.5-flash-lite` pin was NOT found in the current model support
  table — the owner must re-confirm the exact model ID against the live
  models list before any real run; do not assume it.
- Staging activation remains ineligible (no green real-provider run);
  production AI remains off in hard zero-spend mode.

## Owner-gated evaluation checkpoint 2026-10-04 (0 external requests)

- Groq fixed-corpus run re-attempted WITHOUT confirmation/keys: harness
  correctly reports `real-groq-pending` (explicit confirmation, ZDR,
  no-billing, model, credential, provider reasons), 0 requests, contract
  simulation unchanged (16 cases, 0 hard, 80/80). The gate fails closed
  exactly as designed.
- Gemini `gemini-3.5-flash-lite` pin VERIFIED against current official docs
  (GA stable, structured outputs supported) — model-ID uncertainty from the
  V2 audit is closed. No Gemini request sent (no key, no attestations).
- Staging activation NOT eligible; production activation BLOCKED. Only
  remaining path: owner configures server-side keys + attestations and runs
  the two fixed-corpus evaluations locally.

## Real-provider gate re-check 2026-10-04 at `be637d8` (0 external requests)

- Both gates re-probed by name/flag only (no secret values read or printed):
  Groq still missing all five (explicit confirmation, ZDR, no-billing,
  exact `openai/gpt-oss-20b` pin, credential); Gemini still missing all
  five (explicit confirmation, unpaid-data-use, no-billing, exact
  `gemini-3.5-flash-lite` pin, credential).
- Documented harness runs executed for both providers: `real-groq-pending`
  and `real-gemini-pending`, 0 requests each, contract simulation unchanged
  (16 cases, 0 hard failures, 80/80 soft checks). Gate fails closed exactly
  as designed; nothing left the machine.
- No change to the standing conclusion: staging NOT eligible, production
  OFF. Owner path unchanged — configure server-side keys + attestations
  locally, then run the two fixed-corpus evaluations.

## Real Groq runs 2026-10-04 (`openai/gpt-oss-20b`, 16 cases each, owner keys)

- Run 1: 16 requests, 1 structured ai/ok, 15 deterministic fallbacks
  (10 quota_exhausted, 3 provider_unavailable, 2 invalid_response),
  0 hard failures, 80/80 soft. Latency min 214ms / median 406ms / max 7.2s.
- Run 2 (after cooldown, same harness): 16 requests, 1 structured ai/ok,
  15 fallbacks (10 quota_exhausted, 4 provider_unavailable, 1
  invalid_response), 0 hard failures, 80/80 soft. Latency min 220ms /
  median 803ms / max 2.2s.
- Exact quota cause: ~6 real attempts succeed, then every further request
  429s in ~220–240ms — the free-tier throughput ceiling (TPM) trips on the
  sequential 16-request burst. Reproducible across both runs, so further
  immediate reruns were stopped. The 2 valid Groq outputs passed every
  authority check (no invented eligibility/geography/deadline, no trust
  override). Privacy `confirmed-groq-zdr`, billing `confirmed-free-quota`.

## Real Gemini runs 2026-10-04 (`gemini-3.5-flash-lite`, 16 cases each)

- Run 1 (pre-fix adapter): 16 requests, 0 structured, 16
  provider_unavailable, 0 hard failures (all deterministic fallback).
- Exact cause (proven with minimal live probes, 3 requests): the adapter
  sent `generationConfig.responseFormat.text.mimeType: "application/json"`,
  which the live endpoint rejects with 400 INVALID_ARGUMENT — and the
  prior doc claim that this shape is accepted was wrong for this model
  (corrected here and in AI_OPPORTUNITY_INTELLIGENCE.md §14). A second
  probe showed `responseSchema` additionally rejects `additionalProperties`
  with 400. A third probe verified the canonical shape
  (`responseMimeType: "application/json"` + `responseSchema` without
  `additionalProperties`) returns 200 with valid structured JSON.
- Bounded fix (no validator weakening): `createGeminiProvider` now sends
  the verified shape with a deep-stripped schema copy; Groq keeps the full
  strict schema; local re-validation against the full strict schema stays
  authoritative. Unit pin updated to the verified shape.
- Run 2 (post-fix): 16 requests, 6 structured ai/ok, 10
  deterministic fallbacks (all invalid_response), 0 hard failures, 79/80
  soft (single soft miss: `unknownsHandled` on explicit-tanzania-exclusion).
  Latency min 1.4s / median 1.7s / max 3.3s. The 10 rejections were
  characterized on a live sample: the model mixes `unknown` basis with
  non-empty evidenceRefs (and similar strictness violations) — the
  fail-closed validator correctly rejected them, so no fix to the
  validator is warranted. Privacy `confirmed-gemini-unpaid-data-use`,
  billing `confirmed-free-quota`.

## Pilot decision after real runs

- Neither provider meets the in-code pilot bar (requires zero fallbacks):
  Groq is quota-ceilinged at ~6 requests per burst window; Gemini validates
  6/16 with the strict validator correctly rejecting the rest. Zero hard
  failures everywhere — deterministic authority never yielded.
- Staging activation NOT eligible. Production AI stays OFF. No prompt,
  validator, or gate changes beyond the one verified Gemini wire-shape fix.
  Only owner path forward: quota headroom decision for Groq (paid tier or
  paced evaluation) is an owner cost call — not taken here.

## Conformance milestone 2026-10-04 (evaluation-only pacing, no production change)

- Harness gained evaluation-only pacing (`--pace-ms=`, default 0 so normal
  behavior is unchanged), per-request transport observation (HTTP status +
  bytes via cloned bodies; Retry-After is not consumed by either adapter —
  noted, not changed), wall-clock timing, and an in-memory validator
  rejection classifier mirroring the strict validator stage order. A pure
  observation hook (`onProviderOutput`) was added to the service options;
  it is never set in production and cannot alter outcomes. Unit-pinned in
  `tests/opportunity-intelligence-eval-harness.test.ts`.
- Pacing interval: 20000ms, grounded in measured prompt size (avg ~590
  tokens + 700 completion budget ≈ 1.3K worst-case per request → ~3 RPM,
  ≈3.9K TPM against the 8K free-tier ceiling and 30 RPM limit).
- Paced Groq (`--pace-ms=20000`, wall 322s): 16 requests, ZERO
  quota_exhausted (pacing works), 1 ai/ok, 8 provider_unavailable, 7
  invalid_response (6 bad-evidence-ref, 1 unverified-citation), 0 hard
  failures, 80/80 soft. Latency min 874ms / median 1.29s / max 2.0s.
  Exact 400 cause (captured live, redacted): `json_validate_failed` — "max
  completion tokens reached before generating a valid document." The 700
  completion-token budget is too small for the gpt-oss-20b reasoning model;
  this is a per-request budget ceiling, NOT a quota problem, so paid quota
  would not fix it. A token-budget adapter change is identified but NOT
  made here (production request behavior change needs owner approval).
- Gemini grouping run (unchanged prompt): 7 ai/ok, 9 invalid (7
  unverified-citation, 1 unknown-with-refs, 1 bad-evidence-ref), all HTTP
  200. Verdict: mostly category B (prompt never stated the ref rules;
  catalog carries basis but rules lived only in the validator) with model
  non-conformance on top. No adapter defect, validator not at fault.
- Bounded steerability fix (prompt only, shared contract unchanged):
  SYSTEM_INSTRUCTIONS now states the three evidence-reference rules with
  one explicit negative example. No validator relaxation, no new data.
- Steered Gemini rerun (once): 16 requests, 14 ai/ok, 1 timeout (8s cap,
  international-tech-job), 1 invalid (profile-ref-missing on
  explicit-tanzania-exclusion), 0 hard failures, 80/80 soft. Latency min
  1.4s / median 1.8s / max 8.0s. Prior classes (unverified-citation,
  unknown-with-refs, bad-evidence-ref) went to zero.
- Comparison: Gemini 14/16 conformance, ~1.8s median, no free-tier quota
  pressure; Groq 1/16 (budget-capped 400s + ref misses + burst quota wall),
  ~1.2s median when answering. Evidence supports KEEPING the existing
  Gemini-primary/Groq-backup order (recommendation only — production
  ordering unchanged without owner approval).
- Cost: Groq free tier is NOT the binding problem for a small-user pilot
  (real traffic is occasional single requests under the 8 req/min route
  limit, and the 200-entry/6h cache absorbs repeats) — the per-request
  token budget is. Paid quota would not materially solve the proven
  problem; model conformance/budget is the larger issue. No paid billing
  enabled.
- STAGING_AI_ELIGIBLE_FOR_OWNER_APPROVAL = NO: best observed 14/16 still
  trips the zero-fallback pilot bar, and the Groq backup path is
  effectively non-functional until its token budget is addressed. No
  staging or production activation performed.
