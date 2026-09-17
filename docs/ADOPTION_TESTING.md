# Adoption testing: owner checklist + external tester script

Status 2026-09-17: production smoke green (all routes correct on desktop +
mobile; Explore renders; detail shows Save + Activity controls). No test
accounts exist yet; no activity, campaigns, or audience data exists yet —
all zeros below are honest zeros, not defects.

Rules for all testing: use only real, truthful activity. Never invent
saves, funnel states, profiles, campaigns, or counts. The moderator test
account must be a real staff-role account owned by the test session.

## A. Owner as talent (normal production account)

1. Sign up / sign in on the production site.
2. Open Explore (`/`): confirm the full opportunity list loads with no
   login wall.
3. Open Profile (`/profile`): fill career level, field, 1–2 sectors, 1–2
   preferred types; save; confirm success message.
4. Open For You (`/for-you`): confirm recommendations appear with a plain
   reason each (e.g. "A type you follow", "In your field"); confirm every
   recommendation also exists on Explore (For You never invents rows).
5. Open any genuine opportunity: press Save; confirm the button state flips
   and persists after reload.
6. On the same opportunity set Interested (truthful: it interests you);
   move one opportunity to Applying and, where true, Applied.
7. Open My Activity (`/activity`): confirm Saved list + funnel sections
   match exactly what was set in steps 5–6.
8. Sign out; confirm Explore still loads fully (personalization never
   gates Explore).

## B. Owner as moderator (staff account)

1. Sign in with the moderator account; confirm Staff + Campaign pilot
   links appear in navigation.
2. Open Campaign pilot (`/campaigns`): confirm the aggregate funnel card
   (Draft/Active/Paused/Completed) and the create form render.
3. Optional, only if a demonstration vessel is needed: create ONE campaign
   named starting with `[INTERNAL DEMO]` linked to a currently published
   opportunity (see §D). Never name a real organization as customer.
4. Open the campaign detail: confirm sections 1·Verified opportunity,
   2·Relevant audience, 3·Engagement funnel render with real counts
   (expect 0s until tester activity exists — honest zero).
5. After tester activity exists ( §C ): confirm the four engagement counts
   move exactly with real saves/funnel states, and confirm NO user name,
   email, profile row, or per-user list appears anywhere on staff screens.

## C. External tester script (5–10 real talent testers, ~15 minutes each)

Run by the owner over existing channels (in person / chat groups). Ask
testers to use their own phones where possible (mobile-first check).

1. "Without signing in, find an opportunity you like. Was it clear what
   each listing offers and how to apply?"
2. "Create an account and set up your profile. Was any field confusing?
   Did you feel forced to share anything?"
3. "Open For You. Do the recommendations fit you? Is every reason shown
   understandable? Is anything recommended that makes no sense?"
4. "Save one opportunity and mark another Interested. Then open My
   Activity. Is the difference between Saved (bookmark) and
   Interested/Applying/Applied (progress) clear?"
5. "What opportunity did you expect to find but could not?"
6. "Would you come back next week? Why / why not?"

Record answers per tester (one row each: device, answers 1–6, blockers).
Do NOT build a survey platform: a shared sheet or chat thread is enough
for 5–10 testers. A site feedback link will be added once the owner
supplies a contact address (no code added for this in the milestone).

## D. Internal demo campaign policy

- Allowed: at most ONE production row, name prefixed `[INTERNAL DEMO]`,
  goal text stating it is a staff rehearsal vessel, linked to a published
  opportunity. Creatable only through the staff UI by a signed-in
  moderator (never via SQL/service-role impersonation).
- Forbidden: naming any organization as customer/partner/sponsor;
  fabricating saves, funnel states, profiles, or counts; presenting the
  demo row to talent (all campaign routes are staff-gated + noindex).
- If the empty funnel + create form already demonstrates the system to
  the owner's satisfaction, create nothing.
