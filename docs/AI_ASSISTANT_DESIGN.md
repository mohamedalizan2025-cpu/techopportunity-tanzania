# AI Opportunity Assistant — Architecture Design

Status: **SCAFFOLD IMPLEMENTED · PROVIDER DISABLED** · Prepared 2026-08-27,
status corrected 2026-08-29 after the architecture audit. The route handler,
strict plan contract, grounded execution, fallback, kill switch and rate
limiter are implemented and deployed (disabled by default). No provider,
API key, SDK or vector store exists; none may be added until explicitly
approved per §10:

This document defines how a future natural-language discovery assistant fits
the existing architecture without violating any of its rules:

```
UI → lib/data/* → Supabase          (data access centralized)
RLS authoritative                   (published-only reads for the public)
Discovery moderation-first          (AI never publishes, edits, or moderates)
$0/month target                     (free tier first, hard cost ceilings)
Web-first                           (assistant surfaces in the website)
```

---

## 1. Interaction model

A text (later voice) question box on the public site:

> "Find hackathons in Dar es Salaam." · "What scholarships are open this
> month?" · "Any technology events in Zanzibar?" · "Deadlines coming soon?"

The assistant NEVER returns free-invented listings. Every answer is rendered
from structured query results. If the query returns nothing, the assistant
says so and offers broader filters — it does not guess.

## 2. Data flow (the only permitted shape)

```
Visitor question (client)
        ↓  fetch POST /api/assistant/ask  (rate-limited route handler)
AI interpretation layer          ← server-side ONLY, key in server env
        ↓  emits a JSON "query plan" (strict schema, see §4)
lib/data/assistant-queries.ts    ← NEW module inside the existing data layer
        ↓  Supabase PostgREST queries (anon client, RLS enforced)
published opportunities only
        ↓
Answer builder (server) → returns { summary, items[], filters? }
        ↓
UI renders items with the SAME OpportunityCard/Detail components
```

Key property: the LLM produces *filter parameters*, never result text.
The database remains the source of truth.

## 3. Security boundary

| Rule | Mechanism |
|---|---|
| No direct DB access from browser | Only the route handler touches data, via `lib/data/*` |
| RLS never bypassed | Queries run with the **anon client**; only `status='published'` rows are visible — pending/rejected/registry are structurally unreachable |
| AI cannot publish/moderate | The assistant code path contains no write operations of any kind; it imports only read functions |
| No secrets client-side | Provider key lives in a server-only env var (never `NEXT_PUBLIC_*`), referenced solely inside the route handler |
| Prompt-injection containment | Page content is never fed back to the model; the model only sees the user question and a fixed field dictionary |

## 4. Query-generation strategy (deterministic, tool-calling style)

The model receives a **fixed JSON contract** and must return a plan:

```json
{
  "intent": "search",
  "q": "hackathon",
  "category": "hackathon | null",
  "city": "string | null",
  "region": "string | null",
  "deadline": "soon | upcoming | rolling | null",
  "sort": "deadline | newest",
  "answer_style": "list | count | summary"
}
```

Validation (Zod-style parse) rejects anything outside the contract, then the
plan is executed by `assistant-queries.ts` — the *same* functions the manual
search UI uses. Unknown/ambiguous slots default to null (no invented values).
This reuses every existing filter and keeps behavior auditable: the UI can
display the applied filters ("hackathon · Dar es Salaam · closing soon") next
to results.

## 5. Grounding / anti-hallucination

1. Answers are templates filled from result rows (counts, titles, slugs,
   deadlines, organizers when known) — the model drafts *phrasing* only.
2. Every listed item renders with a link to its internal detail page.
3. Zero-result queries return an explicit "nothing found" message plus
   suggested broader filters (computed from real category/city values).
4. The model is never shown other users' data or any moderation content.

## 6. Fallback behavior

If the provider is unreachable, rate-limited, or returns an invalid plan:
the route handler degrades gracefully to plain keyword search
(`q = raw question minus stopwords`) — the user still gets real results.
No AI response is ever fabricated server-side.

## 7. Cost-control strategy

- Free-tier provider first; hard monthly cap via provider dashboard + route-level rate limiting (per-IP token bucket).
- Cap: 1 interpretation call per question (no chat loops in v1).
- Short system prompt + small schema; no opportunity payloads sent to the model.
- Cached interpretations for repeated identical questions (in-memory LRU at MVP scale).
- Kill switch: env flag `ASSISTANT_ENABLED=false` disables the route entirely.

## 8. Testing strategy

- Contract tests: malformed plans rejected; every valid plan maps to expected PostgREST filter (fixture-based).
- Grounding tests: rendered answer strings must only reference rows returned by the executed query (snapshot diff).
- Security tests: injection attempts in questions never alter SQL beyond whitelisted parameters; anon visibility matrix unchanged (pending=0, rejected=0, registry=0).
- Fallback tests: provider failure ⇒ keyword-search results, 200 response.
- Load sanity: rate limiter blocks burst; cost counters logged server-side (no secrets in logs).

## 9. Future extension points

- Multi-turn refinement (plan patching: "…only Zanzibar" → update last plan).
- Saved searches / digest emails (Phase-3 Supabase Auth + pg_cron, §10 of ARCHITECTURE.md).
- Embedding-based similarity ONLY after Phase-4 approval (pgvector, computed offline by the existing discovery pipeline — never a browser concern).
- Voice input via the same `/api/assistant/ask` contract.
- Worldwide/eligibility questions ("scholarships Tanzanians can apply for",
  "online opportunities", "international fellowships"): the plan contract
  is additive — an optional `eligibility` filter field joins only AFTER
  migration 0005 (revised in the corrective pass: `eligibility` ∈
  {`unknown`, `tanzanians_eligible`, `tanzanians_not_eligible`} +
  `eligibility_evidence`, owner-gated) is applied and moderators have
  populated evidence. The assistant may filter on eligibility ONLY for
  rows where `eligibility != 'unknown'`; it must never derive
  eligibility from location, organizer, source domain, university name,
  URL structure, or wording such as "international". Location questions
  ("in Africa", "online", "worldwide") and eligibility questions
  ("Tanzanians can apply") are SEPARATE plan dimensions and must never
  be answered by conflating them. Hard rule: the LLM NEVER infers
  eligibility or invents opportunities; a question whose answer depends
  on missing evidence returns the honest published-only results it can
  ground, with no guessed facts. "Opportunities in Dar es Salaam" and
  "closing this month" already map onto existing plan fields
  (region/city, deadline).
- Lifecycle claims: per `lib/lifecycle.ts` the product distinguishes
  `active` / `expired` / `rolling` / `unknown`. The assistant may never
  call an opportunity "rolling" — no schema field can prove it today;
  missing or invalid deadlines are `unknown`. The plan-contract value
  `deadline: "rolling"` is a filter label meaning "no deadline listed"
  (deadline IS NULL), not a lifecycle assertion.

## 10. Explicit non-goals until separately approved

No provider account, no API key, no SDK dependency, no vector store, no
paid tier. The scaffold (route handler, plan contract, grounding, fallback,
kill switch, rate limit) IS implemented and stays provider-neutral.
Activation requires: (1) this design's acceptance, (2) a chosen free
provider + key custody plan, (3) owner sign-off on the §3 boundary audit.

## 11. Provider research & recommendation (researched 2026-02, cited)

Evidence gathered from current official documentation reachable from the
project environment (fetch-verified this date):

| Provider | Free tier (current docs) | Structured output | Integration | Notes |
|---|---|---|---|---|
| **Groq** | YES — per-model RPM/RPD/TPM/TPD tables published at console.groq.com/docs/rate-limits (e.g. openai/gpt-oss-20b: 30 RPM / 1,000 RPD / 8K TPM / 200K TPD) | YES — dedicated Structured Outputs docs | OpenAI-compatible `/chat/completions` via plain `fetch` — no SDK | Fastest latency class; server-side key; trivial kill switch |
| Google Gemini API | free tier documented, but ai.google.dev pages TIMED OUT from this environment during research — unverified here | yes (responseSchema) | google-genai SDK or REST | viable alternative; needs separate verification |
| OpenAI | pay-as-you-go; no maintained free tier for API | yes (json_schema) | SDK or fetch | cost fails the $0 target for MVP |

**Recommendation: Groq**, model `openai/gpt-oss-20b` class, via plain
`fetch` to its OpenAI-compatible endpoint with JSON-mode structured output.
Rationale: only provider whose free-tier terms were verifiable from this
environment; no SDK dependency; response shape maps 1:1 onto
`parseAssistantPlan`; 1,000 requests/day comfortably exceeds MVP traffic.

## 12. Opportunity-first behaviour (system-prompt policy, v1)

The assistant is an OPPORTUNITY discovery tool, not a general information
assistant. The fixed system prompt must state:

1. Answer ONLY from published opportunity results returned by the query.
2. If the question is about news, ceremonies, announcements, reports,
   speeches, or institutional information: reply that TechOpportunity
   Tanzania focuses on actionable opportunities and point the user to the
   available category/region/deadline filters. Never summarize news.
3. Never fabricate, complete, or generalize opportunities. Zero results are
   stated as zero.
4. Never mention pending/rejected/registry/audit concepts or any internal
   system detail.

## 13. Provider-specific implementation plan (Groq, activation-gated)

1. Env: `ASSISTANT_PROVIDER_API_KEY` (server-only) +
   `ASSISTANT_PROVIDER_MODEL` (default `openai/gpt-oss-20b`).
2. `lib/assistant/provider.ts` `interpretQuestion()`: single `fetch` POST to
   `https://api.groq.com/openai/v1/chat/completions` with the fixed system
   prompt + field dictionary, `response_format: { type: "json_object" }`.
3. Parse → `parseAssistantPlan` (existing strict validator) → existing
   execution path. Any parse failure → deterministic fallback (already
   implemented).
4. Provider-gated tests to add at activation: malformed provider JSON,
   hallucinated plan fields (dropped by validator), provider 429/5xx/timeout
   → fallback, overlong responses, injection via question echoing.
5. Cost control: 1 call/question, ≤120-char question, fixed prompt, existing
   rate limiter, kill switch unchanged.
