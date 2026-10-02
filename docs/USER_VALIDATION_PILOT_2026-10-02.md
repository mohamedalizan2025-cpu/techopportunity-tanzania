# User validation pilot — 5–10 testers, 2 weeks (2026-10-02)

Preconditions (do not start without these): the 4-record cleanup from
[PUBLIC_CORPUS_REVIEW_2026-10-02.md](PUBLIC_CORPUS_REVIEW_2026-10-02.md) is
executed, and the deadline-ordered approvals from
[PILOT_REPLENISHMENT_SHORTLIST_2026-10-02.md](PILOT_REPLENISHMENT_SHORTLIST_2026-10-02.md)
are published. Testers must see the cleaned + replenished shelf, never the
stale corpus. Owner mechanics (accounts, journey checks, demo-campaign rules)
remain in [ADOPTION_TESTING.md](ADOPTION_TESTING.md) — this doc is the
observed-test protocol, not a replacement.

Rules: real activity only. Never invent saves, funnel states, profiles, or
counts. Testers use their own phones and their own real goals. One row per
tester in a shared sheet or chat thread — no survey platform is built.

## Tester profile (5–10 people)

- 3–4 university students (any discipline, at least 1 outside tech);
- 2–3 recent graduates or early-career professionals;
- 1–2 developers, researchers, or founders/innovators;
- all based in Tanzania, all on their own Android phones with their own data.
Recruit over existing channels (class/chat groups, in person). No payment;
state plainly it is a 15-minute test plus two short follow-ups.

## 15-minute observed mobile test (owner watches, tester drives)

Setup (1 min): open the production site in the tester's own mobile browser,
signed out. State the premise once: "Find something worth your effort, check
whether you can trust it, and keep track of it."

- Task 1 — DISCOVER (3 min): "Without signing in, find one opportunity you
  would genuinely consider." Watch: search vs category vs scroll; do they
  reach a detail page unassisted?
- Task 2 — UNDERSTAND (4 min): "Decide whether it is real, open, and open
  to you. Talk me through what you check." Watch: source link, deadline
  state, eligibility line, evidence section. Do not prompt them toward the
  evidence UI.
- Task 3 — SAVE / TRACK (4 min): "Create an account, set the profile fields
  you care about, save this one, and mark another Interested. Then open My
  Activity." Watch: signup friction, skipped vs completed profile fields,
  Saved-vs-Interested comprehension, Activity readability.
- Task 4 — APPLY (3 min): "Show me how you would actually apply." Success =
  they reach the external source/application route and can state the next
  real-world step. Our platform never submits for them.

## Questions (ask after the tasks, not during)

1. What does this listing offer, and how do you apply? (comprehension)
2. Is it still open, and are you personally eligible? What told you that?
3. Was any profile field confusing? Did you feel forced to share anything?
4. Open For You: does each recommendation fit you? Is every reason clear?
   Anything recommended that makes no sense?
5. Saved vs Interested/Applying/Applied — what is the difference, in your
   words?
6. What opportunity did you expect to find but could not? (supply gap)
7. Would you come back next week? Why / why not? (repeat intent)

## Metrics to record (per tester, plus session notes)

Per tester: device/browser, tasks completed unassisted (0–4), profile
fields completed vs skipped, saves + funnel states set (truthful only),
blockers encountered, answers 1–7, consent for follow-up (yes/no).
Session level: total testers, median tasks-unassisted, most common blocker,
most-requested missing opportunity type, count of "would return" yes/no/why.
Never aggregate private profile contents; counts of completed fields only.

## 7-day follow-up (one short message each)

"Did you open Tech Opportunity or the source page again since the test? Did
you start or submit any application? What stopped you, if anything?" Record:
returned (yes/no), source revisits, applications started/submitted,
self-reported blocker. This is the earliest repeat-use signal.

## 2-week repeat-use check (closes the pilot)

Re-contact all consenting testers: any return visit in week 2? Any
application progress changed in Activity truthfully? Would they recommend it
to a classmate — and did they? Record per tester; close the sheet with totals.

## Success / failure criteria

PASS (justifies the next milestone) requires ALL of: ≥4/5 median tasks
completed unassisted; zero tester deceived about eligibility or deadline
(i.e. no one acts on wrong evidence); ≥60% return at 7 days OR ≥2 truthful
application starts attributed to the shelf; no critical blocker (login wall,
broken save, misleading badge) left unfiled as a bounded fix.
FAIL (do not advance to provider outreach): testers cannot distinguish
Saved from progress states; evidence UI ignored or mistrusted by a majority;
"would return" ≈ 0 with supply thinness as the stated reason — that result
routes to National-supply work, not to more features.

## Feedback-recording template (one row per tester)

| tester | device | tasks 0–4 | profile done/skipped | saves/funnel (truthful) | blockers | Q1–Q7 notes | 7-day | 2-week |
|---|---|---|---|---|---|---|---|---|
| T1 … | … | … | … | … | … | … | … | … |

## Evidence bar for the next product milestone

Advance only on observed evidence: completed sheets for ≥5 testers, the
7-day and 2-week return counts, the ranked blocker list, and the
most-requested missing supply. The next milestone is chosen from that
evidence — normally bounded fixes for the top 1–2 blockers, or the
National-supply milestone if supply thinness caused failure. Technical
validation is not customer validation; verbal enthusiasm is not willingness
to pay or to return.
