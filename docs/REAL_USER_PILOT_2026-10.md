# Real-user pilot execution package — October 2026

Status: **PREPARED, NOT RUN.** Production is live at
`https://techopportunity-tanzania.vercel.app` (release `d6b1a43`, Civic
Hybrid complete, Next 16.3.8, AI OFF). This package is the runnable sheet
for 5–10 observed sessions. It extends, not replaces,
`docs/USER_VALIDATION_PILOT_2026-10-02.md` (recruiting mix, evidence bar,
2-week check); where the two differ, this file governs execution and the
older file governs interpretation.

## 1. Purpose

Learn, on the live product with real goals: can a Tanzanian student or
graduate understand the product, discover something genuinely relevant,
read deadline/eligibility/trust honestly, save/track it, find the real
application route — and will they come back?

## 2. Participants (5–10)

Mix (aim for at least one of each): secondary/high-school students,
university students (any discipline, ≥1 outside tech), recent
graduates, tech learners/builders, young professionals, general
opportunity seekers. Tanzania/Zanzibar first. Own phones, own data,
non-technical welcome. No payment; state plainly: 15 minutes observed
+ two short follow-ups. No 18+ restriction; never collect date of
birth or any data beyond §2 metadata.

Record per participant only: ID (P01…), broad category
(secondary / university / graduate / builder / professional /
seeker), device type, rough familiarity with opportunity platforms
(new / occasional / regular). No names, contacts beyond the
follow-up channel they consent to, or any other personal data.

## 3. Consent + privacy note (read aloud, 30 seconds)

"This is a test of the website, not of you. I will watch and take
notes; nothing you do is graded. Your saves and profile stay private
to your account and we never share them. You can stop anytime, skip
anything, and ask me to delete your notes. May I continue, and may I
message you once in about a week for a 2-minute follow-up? (yes/no)"

Record consent + follow-up consent. If no: thank them, end.

## 4. Observed session script (~15 min, tester drives, signed out)

Setup (before the clock starts): tester's own phone and browser,
signed OUT, stable data connection. Note device/browser. Read the
consent note (§3), then premise (once): "Find something worth your
effort, check whether you can trust it, and keep track of it." Do not
demo anything first.

| # | Task (prompt) | Time | Record |
|---|---|---|---|
| 1 | UNDERSTAND — open homepage. "What do you think this website helps you do?" | 2 min | understood unaided YES/NO + verbatim confusion |
| 2 | DISCOVER — "Find one opportunity you would genuinely consider." | 4 min | completed unaided YES/NO, time, search vs category vs scroll, confusion |
| 3 | TRUST — open it. "What is the deadline? Can someone from Tanzania apply? Where would you apply? What makes you trust or distrust this?" Do not correct until after they answer. | 4 min | each answer right/wrong + which UI element they cited |
| 4 | TRACK — "Save it or mark interest, however feels right." (Account creation is part of the task if needed.) | 3 min | completed unaided YES/NO, action chosen (Saved/Interested/…), confusion |
| 5 | APPLY JOURNEY — "If you wanted to apply today, what would you do next?" Let them navigate. | 2 min | found official source CTA YES/NO, workflow state understood YES/NO, hesitations |
| 6 | FOR YOU / PROFILE (only if an account exists) — open For You/Profile. "Would you fill this profile to improve recommendations?" | opt | YES/NO + privacy concerns + confusing/missing fields |

## 5. Observation marks (observer only, never coached)

- PASS — done smoothly, no pause.
- HESITATED — pause/confusion, self-recovered.
- HELP REQUIRED — observer had to intervene (record what was said).
- FAILED — could not complete.

Never explain a feature before they try, never point at the right
button, never defend the product or explain what the UI "meant".

## 6. End-of-session questions (verbatim where practical)

Trust: (1) What made you trust this site? (2) What made you doubt it?
(3) Did anything feel fake? (4) Was it clear what is verified vs
unknown? (5) Would you use this instead of finding opportunities
manually? (6) Would you recommend it to a friend? (7) The ONE thing to
improve first?
Value: How do you find opportunities today? What frustrates you most
about that? Which feature here saves the most time? What is missing?
Would reminders/tracking be useful? Would you come back weekly?
Do NOT ask whether they "like AI".

## 7. 7-day follow-up (one short message)

"Did you open Tech Opportunity or a source page again since the test?
Did you save anything else, or start/apply to anything? Did you share
it with anyone? What stopped you, if anything?" Record: returned
YES/NO, saves, starts/applies (truthful only), shares, blocker.

## 7b. 2-week return-use check (closes the pilot)

Re-contact all consenting testers: any return visit in week 2? Any
application progress changed truthfully? Would they recommend it to a
classmate — and did they? Record per tester; close the sheet with
totals (returned __/__, progressed __, recommended __).

## 8. Per-participant result table

| ID | Category | Device | T1 | T2 | T3 (deadline/TZ/apply/trust) | T4 | T5 | T6 | Unassisted /5 | Trust Q notes | Blocker |
|---|---|---|---|---|---|---|---|---|---|---|---|
| P01 | … | … | … | … | … | … | … | … | … | … | … |

Core tasks for the unassisted score: T1–T5 (T6 conditional).
Scoring: PASS or HESITATED = 1 unassisted point; HELP REQUIRED or
FAILED = 0. Per-tester score = points / 5; pilot score = median across
testers (need ≥4/5).
Trust/deception failure (automatic P0): the tester states a wrong
deadline, wrong eligibility, or wrong application route AND cites the
platform as the reason — e.g. "it closes in December" on a passed
deadline, "Tanzanians cannot apply" on an evidenced-eligible listing,
or starting an application on a lookalike/scraper link reached from
the listing. Honest unknowns ("it doesn't say") are never failures.
Severity per issue: **P0** trust/deception/security/application-routing
failure · **P1** blocks a core task · **P2** clear confusion/friction ·
**P3** cosmetic/preference. Any P0 stops the pilot for a fix-first
decision.

## 9. Success thresholds (all must hold to advance)

- Median ≥4/5 core tasks completed unassisted.
- Zero serious trust/deception failures (nobody acts on wrong
  eligibility/deadline evidence).
- Testers can identify the official apply/source route.
- ≥60% return at 7 days OR ≥2 genuine application starts.
- No unfiled P0/P1.

## 10. Summary template (fill after testing)

Participants: __ · Median unassisted: __/5 · Biggest confusion: __ ·
Trust issues: __ · Most-used feature: __ · Least-understood: __ ·
Application starts: __ · 7-day returns: __/__ · Issues P0/P1/P2/P3:
__/__/__/__ · Decision: GO / FIX-FIRST / STOP (reasons: __).

## 11. Ground rules (protect the evidence)

Real activity only — never invent saves, funnel states, profiles, or
counts. One row per tester. Counts of completed profile fields only,
never profile contents. Do not optimize metrics mid-pilot. Advance only
on the evidence in §10.
