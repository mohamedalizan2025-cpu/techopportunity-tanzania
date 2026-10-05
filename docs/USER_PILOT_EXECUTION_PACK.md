# User pilot execution pack (companion — protocol unchanged)

Status 2026-10-05: **PREPARATION ONLY — NO TESTING HAS OCCURRED.**
`READY_FOR_USER_PILOT` = YES (protocol intact, execution deferred). The
authoritative protocol is
[USER_VALIDATION_PILOT_2026-10-02.md](USER_VALIDATION_PILOT_2026-10-02.md) —
this pack only makes it easy to run. Do NOT run before the owner
production-AI decision in the ordered sequence
([NEXT_SESSION_HANDOFF.md](NEXT_SESSION_HANDOFF.md) §7). Testers must see
the cleaned + replenished shelf (11 open evidence-backed records), never a
stale corpus. Brief testers that supply is fellowship-heavy with one
student-competition anchor.

Rules (from the protocol, repeated so nothing is improvised): real activity
only — never invent saves, funnel states, profiles, or counts. Testers use
their own phones and their own real goals. One row per tester in a shared
sheet or chat thread — no survey platform is built. Never aggregate private
profile contents; counts of completed fields only.

## 1. Tester recruitment message (copy/paste)

> Hi! We're testing Tech Opportunity (a site for finding scholarships,
> fellowships, internships and similar openings in Tanzania) and need 5–10
> testers. It takes ~15 minutes on your own Android phone with your own
> data, plus two short follow-up messages (after 7 days and 2 weeks). No
> payment. You just try to find something worth your effort, check whether
> you can trust it, and keep track of it — while I watch and take notes.
> Interested? Reply YES and tell me a time this week.

Tester mix to recruit: 3–4 university students (any discipline, ≥1 outside
tech); 2–3 recent graduates or early-career professionals; 1–2 developers,
researchers, or founders/innovators. All based in Tanzania.

## 2. One-minute introduction script (read once, then stop talking)

> "Thanks for helping. This is Tech Opportunity — a site for discovering
> opportunities across Tanzania. Here's your mission: **find something
> worth your effort, check whether you can trust it, and keep track of
> it.** I'll watch and take notes, but please drive the phone yourself and
> think out loud. There are no wrong answers — if something confuses you,
> that's our bug, not yours. Ready? Start without signing in."

## 3. Exact mobile task sequence (owner watches, tester drives)

| Task | Time | Instruction (verbatim) | Watch for (observer ticks) |
|------|------|------------------------|----------------------------|
| 1 DISCOVER | 3 min | "Without signing in, find one opportunity you would genuinely consider." | Search vs category vs scroll; reaches a detail page unassisted? |
| 2 UNDERSTAND | 4 min | "Decide whether it is real, open, and open to you. Talk me through what you check." | Source link, deadline state, eligibility line, evidence section checked WITHOUT prompting toward the evidence UI? |
| 3 SAVE/TRACK | 4 min | "Create an account, set the profile fields you care about, save this one, and mark another Interested. Then open My Activity." | Signup friction; fields skipped vs completed; Saved-vs-Interested comprehension; Activity readability? |
| 4 APPLY | 3 min | "Show me how you would actually apply." | Reaches the external source/application route AND can state the next real-world step? (Platform never submits for them.) |

Mark each task: unassisted / assisted / failed. "Unassisted" = no hint
beyond the verbatim instruction.

## 4. Observer checklist (tick during the test, not after)

- [ ] Device/browser noted: ___
- [ ] Task 1 unassisted? Y / N (hint given: ___)
- [ ] Task 2 unassisted? Y / N (hint given: ___)
- [ ] Task 3 unassisted? Y / N (hint given: ___)
- [ ] Task 4 unassisted? Y / N (hint given: ___)
- [ ] Profile fields completed: ___ skipped: ___
- [ ] Saves + funnel states set (truthful only): ___
- [ ] Eligibility/deadline deception observed? YES / NO (detail: ___)
      — any YES is a critical error, log in §7.
- [ ] Consent for follow-up? YES / NO

## 5. Post-test questions (ask after the tasks, not during)

1. What does this listing offer, and how do you apply? (comprehension)
2. Is it still open, and are you personally eligible? What told you that?
3. Was any profile field confusing? Did you feel forced to share anything?
4. Open For You: does each recommendation fit you? Is every reason clear?
   Anything recommended that makes no sense?
5. Saved vs Interested/Applying/Applied — what is the difference, in your
   words?
6. What opportunity did you expect to find but could not? (supply gap)
7. Would you come back next week? Why / why not? (repeat intent)

## 6. Per-user results table (one row per tester)

| tester | device | tasks 0–4 unassisted | profile done/skipped | saves/funnel (truthful) | blockers | Q1–Q7 notes | 7-day | 2-week |
|---|---|---|---|---|---|---|---|---|
| T1 | | | | | | | | |
| T2 | | | | | | | | |
| T3 | | | | | | | | |
| T4 | | | | | | | | |
| T5 | | | | | | | | |
| T6 | | | | | | | | |
| T7 | | | | | | | | |
| T8 | | | | | | | | |
| T9 | | | | | | | | |
| T10 | | | | | | | | |

Session level: total testers ___; median tasks-unassisted ___; most common
blocker ___; most-requested missing opportunity type ___; "would return"
yes ___ / no ___ / why ___.

## 7. Critical-error log

| # | Tester | What happened (eligibility/deadline deception, login wall, broken save, misleading badge…) | Filed as bounded fix? (Y/N + ref) |
|---|--------|---------------------------------------------------------------------------------------------|-------------------------------------|
| 1 | | | |
| 2 | | | |

Rule: no critical blocker (login wall, broken save, misleading badge) left
unfiled as a bounded fix — otherwise the pilot cannot pass.

## 8. Seven-day follow-up message (one short message each)

> Hi! Quick follow-up on Tech Opportunity: did you open it (or the source
> page) again since the test? Did you start or submit any application? What
> stopped you, if anything? Thanks!

Record per tester: returned (yes/no), source revisits, applications
started/submitted, self-reported blocker. Earliest repeat-use signal.

## 9. Two-week follow-up message (closes the pilot)

> Hi, last check-in! In this second week: did you visit Tech Opportunity
> again? Did any application progress change in your Activity? Would you
> recommend it to a classmate — and did you? Thank you, this closes the
> test!

Record per tester; close the sheet with totals.

## 10. Final pass/fail calculation template

```text
Total testers with completed sheets: ___ (need ≥5)
Median tasks completed unassisted: ___ / 5 (need ≥4)
Testers deceived about eligibility/deadline: ___ (need 0)
7-day return rate: ___% (need ≥60%) OR truthful application starts: ___ (need ≥2)
Critical blockers left unfiled: ___ (need 0)

PASS (justifies the next milestone) requires ALL of:
median ≥4/5 tasks unassisted; zero eligibility/deadline deception;
≥60% 7-day return OR ≥2 truthful application starts;
no unfiled critical blocker.

RESULT = PASS / FAIL
```

FAIL routes: Saved-vs-progress confusion, evidence UI ignored/mistrusted by
a majority, or "would return" ≈ 0 on supply thinness → National-supply
work, NOT more features. Advance only on observed evidence (completed
sheets, return counts, ranked blockers, most-requested missing supply).
Provider revenue pilot runs ONLY after this pilot passes.
