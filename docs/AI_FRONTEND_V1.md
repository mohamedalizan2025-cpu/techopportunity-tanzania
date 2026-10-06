# AI Frontend V1 (branch `ai-frontend-v1`; production AI OFF)

Status 2026-10-06: implemented on Preview/staging only. Production
(main) is untouched and AI-free. This document is the build + evidence
record for owner approval. Pilot: TECHNICALLY READY BUT OWNER DEFERRED
until AI Frontend V1 is approved, real photography is restored, and
final owner QA passes.

## 1. Product purpose

Make AI VISIBLE without making it AUTHORITY. Two surfaces share one
authority spine — verified data → deterministic eligibility → profile →
deterministic ranking/grounding → AI phrasing → user action:

- **AI Match** (`/for-you`, alias `/ai-match`, nav "AI Match"):
  eligible-match workspace with profile summary and explicit AI
  explanations.
- **Ask Tech Opportunity** (`/ask`, nav "Ask"): curated help plus
  grounded opportunity Q&A. No chatbot bubble, no chat history.

AI can never invent eligibility, deadlines, geography, requirements,
publication/trust state, selection probability, or submissions.

## 2. AI Match architecture

Same published corpus as Explore (`getPublicBrowseData`), same
deterministic `rankForYou()` ordering, same `ForYouExplanation`
explicit-trigger contract. New: `hasVerifiedTanzanianAccess()` gate
(decision + non-blank evidence) partitions ranked entries into "Your
eligible matches" vs "Explore other relevant opportunities" (labeled
"eligibility is not yet verified", never counted eligible).
`getForYouData()` additionally returns the normalized `MatchingInput`
for the "Your matching profile" summary; incomplete profiles get
"Improve your matches" with the exact missing fields. No percentages,
no auto-fetch, no new storage.

## 3. Ask architecture

`lib/ask/`: `knowledge.ts` (12 curated FAQ entries + allowlisted
source routes + deterministic classifier with injection/out-of-scope
refusals), `contract.ts` (question sanitizer 4–500 chars with
identifier redaction, strict output validator, deterministic
composers), `providers.ts` (Gemini/Groq adapters over the shared
transport helpers from `provider.ts`, Ask strict schema),
`service.ts` (sanitize → classify → deterministic fast paths with
ZERO provider spend → grounded provider attempts, one per provider
inside a shared 8s budget → fail-closed fallback), `telemetry.ts`
(aggregate counters only; raw conversations never persisted
anywhere — no table exists).
`app/api/ask/route.ts`: auth-required custom questions (401
otherwise), 2KB body cap, hashed-user rate limit, private no-store.
`/ask` page serves FAQ deterministically with no load-time provider
call; `AskForm` fetches on submit only and posts the question text.

## 4. Profile allowlist

AI Match sends the existing sanitized matching input only
(level, field, sectors, types, skills, region, experience — no name,
email, phone, UUIDs, saves, activity, goals, CVs). Ask sends NO
profile data at all: sanitized question + grounded public opportunity
facts + matched public FAQ text.

## 5. Authority boundaries

Eligibility, deadlines, geography, trust, publication, and ranking are
deterministic-only. Provider schemas have no such fields; validators
reject extra keys, invented refs, HTML, percentages, scores, and
authority claims ("eligible", "guaranteed", "best chance",
"probability", acceptance predictions). Unknown stays unknown.

## 6. Privacy

Ask: no profile transmitted, no conversation stored, aggregate
telemetry only. Current `/privacy` AI section ("may be enabled
separately") stays accurate while production AI is OFF — no policy
edit in this milestone. REQUIRED BEFORE ACTIVATION: flip the AI
section to active voice and disclose that custom Ask questions are
sent to the configured providers (bounded, redacted), answered from
verified information, and never stored; FAQ answers stay
deterministic without provider calls.

## 7. Provider chain, fallback, out-of-scope

Gemini primary → Groq backup → deterministic fallback, reusing the
existing selection gate, error taxonomy, rate limiter, 8s budget
split, and 64KiB ceiling. Ask adds no provider, no cache (fresh
corpus reads; rate limit bounds cost — documented choice).
Out-of-scope, injection, empty grounding, and invalid questions answer
deterministically with no provider spend. V1 excludes submissions,
emails, CVs, essays, form-filling, and predictions.

## 8. Staging evidence 2026-10-06 (synthetic fixtures, eval-gated keys)

- AI Match real: `ai/gemini`, ~2.8–3.3s, deterministic authority
  intact (fit/eligibility/deadline identical), within 8s.
- Ask FAQ/account: deterministic, zero provider spend.
- Ask unsupported/injection: refused, zero spend.
- Ask opportunity: `ai/gemini` (~2.6s) and `ai/groq` (~0.9s) AFTER
  one bounded prompt clarification (output rules restated + negative
  example; validator untouched — same precedent as the 2026-10-04
  insight conformance fix). Pre-fix both returned honest
  `invalid_response` fallbacks with grounded refs kept.
- Mock quota/invalid paths: fail-closed deterministic with grounded
  facts preserved. Zero authority failures, zero privacy failures,
  zero quota errors.
- Full `npm test` / `verify` / `build` green; runtime audit 0.

## 9. Production activation prerequisites (NOT done)

Preview env configured (same variable names as Opportunity
Intelligence) → Preview smoke of match/ask/fallback → privacy flip
(§6) → owner QA (390px + desktop, light + dark) → separate owner
activation decision. Production AI stays OFF until then.
