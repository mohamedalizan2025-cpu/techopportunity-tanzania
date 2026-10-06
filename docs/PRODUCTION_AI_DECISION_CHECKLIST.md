# Production AI decision checklist (owner decision, NOT approval)

Status 2026-10-06: **PREPARATION ONLY — PRODUCTION AI = OFF. This checklist
does NOT approve production.** It defines the evidence the owner must see
before making the separate production-AI decision. Staging evidence informs
but never auto-satisfies this gate. Engineering-side validation is
complete (see below); the owner visual check in the Preview is still
required before any owner decision.

Engineering record 2026-10-06 (staging branch only, docs-only):

- [DIRECTLY VERIFIED] Live staging corpus `4 → 0` (probe `4/4/6/10`,
  cleanup `deleted=4`, `smoke_after=0`, `refs_after=0`,
  `non_smoke_unchanged=true`); production untouched.
- [LIVE STAGING DATA + LOCAL INTEGRATION] Trust:
  National/International/No-deadline AI-searchable `TRUE`,
  Unknown-eligibility `FALSE` (withheld = PASS); real-provider smoke
  `3/3 AI` via Gemini (`2017/1507/1193ms`, `0` hard, within 8s);
  mock quota/invalid/timeout all fail-closed honest.
- [LOCAL INTEGRATION] Planner (Interested/Applying/Applied) PASS;
  For You deterministic-first PASS (complete 2, incomplete 0);
  `npm test` / `verify` / `build` PASS.
- [STATIC/STRUCTURAL] Login, forgot-password, For You, detail,
  Insight, planner responsive structure PASS; real 390px + desktop
  rendering is OWNER VISUAL CHECK REMAINING.
- `PRODUCTION_AI_ELIGIBLE_PENDING_OWNER_VISUAL_CHECK = YES`
  (engineering-side only; owner browser smoke §§B–K + owner decision
  still required; production stays OFF).

Inputs: filled [STAGING_AI_SMOKE_RUNBOOK.md](STAGING_AI_SMOKE_RUNBOOK.md) +
fixed-corpus evidence in
[AI_OPPORTUNITY_INTELLIGENCE_EVALUATION.md](AI_OPPORTUNITY_INTELLIGENCE_EVALUATION.md).

## Required evidence (ALL must hold)

- [ ] **Staging smoke complete.** The staging runbook is fully filled:
      Preview-only, authenticated login, For You explanation, Intelligence
      brief, readiness planner, National + International + unknown +
      deadline-soon records, incomplete + complete profiles, primary/backup/
      fallback paths, 390px + 1366/1440px. No check left blank.
- [ ] **Zero authority/deadline/eligibility/trust deception.** No staging
      observation shows invented or overridden eligibility, geography,
      trust/source fact, deadline, or requirement-presented-as-fact. Any
      single deception = NO-GO.
- [ ] **Acceptable provider/fallback behavior.** Primary serves the large
      majority of attempts (reference: Gemini 14/16 on the fixed corpus);
      backup materially functional (reference: Groq 9/16 paced, zero quota
      errors); every failure fails closed to honest deterministic guidance
      (no hang, no partial AI text as fact, no retry storm — one attempt per
      provider per uncached insight).
- [ ] **Acceptable latency.** Staging median latency recorded (§I of the
      runbook) is acceptable for interactive use (reference: ~1.8s primary /
      ~1.0s backup medians on the fixed corpus; 8s shared timeout cap).
- [ ] **Privacy-safe telemetry.** Only aggregate in-memory counters observed
      (attempts/AI/fallback/validation/quota/timeout + latency); no raw
      prompts, no provider responses with user context persisted, no
      per-user tracking, no new outbound field (allowlist unchanged — AI doc
      §6).
- [ ] **Free-quota/cost understood.** Staging session fit in free quota;
      owner confirms both providers' no-billing posture and data-use terms
      (Gemini unpaid-data-use acceptance; Groq ZDR + no-billing) as fresh
      attestations for PRODUCTION, not inherited from evaluation.
- [ ] **Rollback tested.** The kill switch below was exercised on Preview
      (or its steps rehearsed against the Preview env) and deterministic
      fallback confirmed.
- [ ] **Production/staging env separation confirmed.** Production env carries
      no AI variables today; activation would set production env ONLY via
      the dashboard with distinct credentials; staging and production
      Supabase projects never merged.

## Decision template (owner fills after evidence review)

```text
PRODUCTION_AI_ELIGIBLE_FOR_OWNER_APPROVAL = YES / NO
Decided by: ___  Date: ___
Staging runbook attached: YES / NO
Blocking item (if NO): ___
```

A YES here authorizes the owner — and only the owner — to configure the
production env and redeploy. Agents must never handle keys or activate
production. A NO returns to the ordered sequence in
[NEXT_SESSION_HANDOFF.md](NEXT_SESSION_HANDOFF.md) (§7): fix, re-smoke on
staging, re-decide.

## Emergency kill switch (production, if ever activated)

1. Set `AI_OPPORTUNITY_INTELLIGENCE_ENABLED=false` in the **production**
   env (dashboard).
2. Redeploy production.
3. Verify: all surfaces deterministic; no external calls; homepage/detail/
   For You/Activity behave exactly as in hard zero-spend mode.

Staging equivalent: same variable on the protected Preview env → redeploy
Preview (see runbook §K).
