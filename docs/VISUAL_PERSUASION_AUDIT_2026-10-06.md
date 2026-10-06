# Visual & persuasion audit 2026-10-06 (AUDIT ONLY — no code changed)

Branch: `staging` at `f67f24aabdf98d56d7fd09bdc385379aacd9128d`.
`main` (`22ad5c89d0c335f663dcc8ed33bf56b66d755378`) untouched.
No UI, data-model, trust, AI, Discovery, RLS, auth, or API change was made
for this document. Method: code-structural inspection of `app/`,
`components/`, `app/globals.css`, `lib/cover-registry.ts`,
`public/images/editorial/`, and `docs/VISUAL_ASSET_PROVENANCE.md`.
No browser rendering was performed here; judgments about rendered feel are
marked as structural inference where applicable. Owner eyeballing of the
live Preview remains the final visual proof.

## 1. Executive verdict

The frontend is technically polished and — unusually — honest: no fake
statistics, no paid placement, no invented partners, unknowns stated as
unknown. That honesty is the product's strongest persuasion asset and must
survive any redesign.

It does not yet look like infrastructure. Three problems compound:

1. **All nine editorial images are AI-generated people photography**
   (declared as such in the provenance record, never misrepresented —
   but a student, provider, ministry official, or investor will read
   them as stock/AI on sight, and nothing else on the page proves
   otherwise).
2. **The color system speaks two brand languages at once** — deep-teal /
   navy / gold editorial prestige on heroes, and default cobalt blue
   (`#1d4ed8`) on buttons, links, focus rings, and active nav. The blue
   is the "startup template" tell the owner is reacting to.
3. **The homepage explains at length but proves little above the fold.**
   The claims are true (human review, source evidence, deadline
   tracking) yet visually unverified in the first viewport: one large
   AI-generated hero image carries the entire credibility load.

Net: a credible 6/10 product page that needs to become an 8+ institutional
surface. The gap is photography + palette discipline + proof hierarchy,
not information architecture — the page structure, workflow
(discover → verify → prioritize → track → apply), and trust copy are
sound and should be restyled, not restructured.

## 2. Current design scorecard (homepage as conversion page)

| Dimension | /10 | Why |
|---|---|---|
| CLARITY | 7 | H1 "Discover Opportunities. Build Your Future.", kicker "For Tanzania's emerging talent", sub names real categories, search + category shortcuts + 01–04 workflow. A visitor knows what/whom/what-next in ~5 seconds. Loses points: "opportunity intelligence + action platform" positioning lives in docs, not on the page. |
| TRUST | 6 | True claims (human-reviewed, source-linked, deadline-tracked, never sponsored) + honest unknowns. But claims are badges without adjacent proof; the only visual evidence is an AI-generated photo. No named organizations, no verifiable numbers, no partner marks (honestly absent — still a persuasion cost). |
| VISUAL QUALITY | 5 | Competent spacing/type rhythm, but AI-photo sheen + cobalt-blue controls + gold-everywhere trim read as assembled-from-parts. Weakest dimension. |
| DIFFERENTIATION | 6 | "Never sponsored", 01–04 path, three-sided platform, evidence language separate it from link directories — all below the fold or in small print. First viewport could belong to any opportunity blog. |
| CONVERSION | 5 | Two honest paths (search/explore, For You) with low friction, but no urgency, no proof, no reason to act *now*; PWA install prompt sits mid-hero and competes with the primary CTA. |
| INSTITUTIONAL CREDIBILITY | 5 | Serif headlines + navy + restrained pilot language ("managed pilot, not a self-service portal") gesture at seriousness, but AI imagery and template blue undermine it for a ministry/university reader. |
| YOUTH APPEAL | 6 | Direct language, mobile bottom nav, 44–48px targets, honest For You framing. Visually safe rather than energetic — fine, not magnetic. |
| **Homepage overall** | **~5.7** | Clear and honest; unpersuasive at first sight. |

Weakest visual area: **photography** (hero + per-card covers).
Biggest trust problem: **AI-generated people presented as the visual
proof of a trust product** — even labeled "editorially", it asks the
visitor to trust words while showing synthetic faces.

## 3. Image audit

All nine files live in `public/images/editorial/` (WebP, ~124–221 KB
each). Per `docs/VISUAL_ASSET_PROVENANCE.md` every one is AI-generated
editorial imagery (OpenAI ImageGen, original to this repo, fictional
people, no real identity claimed). The audit below does not pretend
otherwise. UI captioning is honest today: detail captions read
"Editorial image for visual context", the hero mobile note reads
"Tanzanian talent, pictured editorially". That labeling is correct and
must stay until replacement — but labeling does not fix the first
impression.

| File | Used where | Subject | Type | Quality | Trust impact | Recommendation |
|---|---|---|---|---|---|---|
| `hero-students.webp` | Homepage hero (desktop + mobile), card/detail rotation | Tanzanian students collaborating in an innovation studio | AI-GENERATED | High polish, low believability as documentary | HIGH — first viewport's entire human proof | REPLACE first (P0). Highest-visibility synthetic face. |
| `zanzibar-students.webp` | Cards/details (education, scholarship slots) | Students on a Zanzibar campus terrace | AI-GENERATED | Likely reads staged; coastal-arch backdrop risks tourism cliché | Medium-high | REPLACE (P1). If a real Zanzibar campus photo is obtainable, this slot matters most. |
| `technology-makers.webp` | Cards (technology/hackathon slots) | Two young women prototyping electronics | AI-GENERATED | Maker-space cliché risk (laptops-and-boards) | Medium | REPLACE (P1). Real hub/makerspace photo preferred; else switch slot to non-people imagery. |
| `founders-pitch.webp` | Cards (entrepreneurship/leadership) | Multi-country founders rehearsing a pitch | AI-GENERATED | Pitch-room stock feel | Medium | REPLACE (P1) or reassign slot to event photography from a real demo day. |
| `climate-research.webp` | Cards (research/climate) | Field researchers in coastal wetland | AI-GENERATED | Fieldwork is hard to fake; close inspection fails | Medium | REPLACE (P1). Genuine fieldwork photos are the most persuasive in this slot. |
| `global-scholars.webp` | Cards (international/education) | Multicultural cohort in a library | AI-GENERATED | Generic-diversity-stock risk | Medium | REPLACE (P2) — lowest harm (international slot, no Tanzania claim). |
| `leadership-roundtable.webp` | Cards/details (fellowship/conference), login-adjacent rotation | Roundtable workshop | AI-GENERATED | Boardroom-stock feel | Medium | REPLACE (P2). Real workshop photo ideal. |
| `career-mentorship.webp` | Login side panel, internship/career slots | Intern + mentor reviewing work | AI-GENERATED | Office-stock feel at login — the auth trust moment | Medium-high | REPLACE (P1). Login is where trust matters most after apply. |
| `organizations-partnership.webp` | Organizations hero | Program/university/NGO leaders planning | AI-GENERATED | The provider credibility page carried by synthetic faces — worst placement after hero | HIGH | REPLACE (P0 with hero). Provider page must show real rooms or no people at all. |

Policy going forward: no new AI-generated people enter the product.
The nine stay labeled until replaced; replacement order is
hero → organizations → login/career → Tanzania slots → rest (§14 P0/P1).
Where real photography cannot be responsibly sourced for a slot, use
non-people visuals (campus architecture, event crowds from behind,
document/evidence close-ups, restrained illustration) rather than
synthetic faces.

## 4. Color audit

Extracted tokens (`app/globals.css` `:root`, light mode):

- Paper/ink: `--background #f7f7f2` (warm paper), `--foreground #192d29`
  (green-black ink), `--surface #ffffff`, `--hero #f0f2e9`.
- Teal/green family: `--accent #08694f`, `--accent-strong #07583f`,
  `--accent-soft #dff1e7`, `--brand-deep #082f2b`, `--brand-forest #0e5a47`,
  `--brand-navy #0d2530`.
- Gold: `--gold #d7a93a`, `--gold-soft #f4e7c3`, `--cream #f7f2e8`.
- Cobalt family: `--primary #1d4ed8`, `--primary-deep #163a5f`,
  `--primary-ink #0b1f33`, `--primary-soft #e3ebf7`,
  `--primary-text #1d4ed8`.
- Muted/line: `--muted #53655e`, `--subtle #5c6e65`,
  `--line #d4ddd5`, `--line-strong #c7d7cd`.

Emotional read: the teal + navy + gold + cream combination says
*editorial, ethical, calm* — closer to a foundation annual report than a
startup. That is a defensible starting personality for institutional
trust. The cobalt blue says *default SaaS*: `#1d4ed8` is effectively
Tailwind blue-700, and it owns the highest-frequency interactive
elements — primary buttons, all links, focus rings, active nav states,
category hovers, card hover borders, status pills. So the eye meets
prestige (hero) then clicks template (controls). This split is the
palette's central defect.

Against the desired qualities:

- Trustworthy: yes (deep greens/navy, restrained gold). Keep the depth.
- Ambitious: weakly — nothing advances; gold is used decoratively, not
  directionally.
- Educational/professional: yes.
- Modern: partially — cobalt pulls toward 2019-SaaS; teal/gold pull
  toward print.
- African/Tanzanian without tourism branding: currently OK (no safari
  clichés in UI chrome); the risk sits in imagery, not color.
- Energetic for youth: no — the palette whispers; students get no
  color-energy of their own.
- Credible for institutions: close, sabotaged by blue + AI photos.
- Premium without luxury: gold overuse (eyebrows, rules, buttons,
  badges, active underlines, photo-note borders) tips toward gilt when
  it appears more than twice per viewport.

Specific defects:

- **Overused: gold.** It marks eyebrows, section rules, hero buttons,
  active states, triage borders, brand-mark inlay, and photo captions.
  Cap it: one gold moment per viewport.
- **Muddy: three near-navys** (`#082f2b` teal-black, `#0d2530` navy,
  `#0b1f33` ink-blue) used interchangeably for heroes, staff band,
  footers, card inlays. Pick one ink.
- **Generic: `#1d4ed8` everywhere interactive.** Highest-leverage
  single change in the palette.
- **Semantic drift, minor:** amber warning and red error states are
  fine; green is correctly reserved for verified/approve states
  (do not spend green on branding).
- Contrast (structural estimate, not measured): body muted `#53655e`
  on paper and gold-on-dark small caps deserve a measured pass in the
  redesign; nothing looked egregiously low-contrast in code, but the
  gold small-caps (`eyebrow-gold`) is the riskiest pairing — verify,
  don't assume.

No replacement palette is chosen here (per brief). Direction: one ink,
one action color derived from the teal family (not cobalt), gold as
punctuation, green kept semantic-only.

## 5. Typography + hierarchy

- Display: Georgia/serif `.font-display` for heroes and section titles;
  body: Geist sans; brand: tight-tracked sans. Serif-display +
  neutral-grotesque-body is the right institutional/modern split —
  keep the *idea*, refine execution.
- Scale: hero `clamp(2rem, 4vw, 3.25rem)`; sections `1.5rem → 2xl/3xl`;
  cards `xl`; body `sm/base` with `leading-6/7/8`. Readable, calm.
- Line lengths: prose capped (`max-w-2xl`, `max-w-4xl`) — good.
- Weight hierarchy: kickers (700 caps) → serif titles (600) → muted
  body. Consistent, but the **eyebrow kicker appears on nearly every
  section**, which flattens hierarchy: when everything is labeled, the
  labels stop orienting. Cut kickers by half in redesign.
- Card density: comfortable (22px padding, clear rows). Fine.
- Page rhythm: `page-shell` (1200px, fluid gutters) + `py-8/sm:py-14`
  sections is disciplined; mobile stacks correctly.
- Mobile hierarchy: titles scale down, grids collapse to one column,
  bottom nav (60px rows) + sticky header persist. Structurally sound.

Five-second test on the homepage (structural read):

- "What is Tech Opportunity?" — Yes: H1 + sub ("Scholarships,
  internships, fellowships, competitions… source, deadline, and
  access evidence").
- "Is this for me?" — Yes for talent ("For Tanzania's emerging
  talent"); provider/institution paths exist but are a scroll away.
- "Can I trust these opportunities?" — Partially: trust strip +
  trust-model section assert process, but show no verifiable proof in
  the first screens.
- "What should I do next?" — Yes: search, category chips, Explore,
  For You.

## 6. Homepage persuasion audit

Structure (all in `app/(home)/page.tsx`): dark hero (kicker, H1, sub,
search, category chips, trust strip, install prompt, hero image) →
Featured-now (3 deterministic deadline picks) → Explore + filters +
category links + snapshot disclosures → How-it-works 01–04 → three-sided
platform (Talent live / Providers pilot / Institutions early, all
honestly labeled) → trust model → dual CTA (For You + organizations).

- Headline: "Discover Opportunities. Build Your Future." Aspirational
  but interchangeable — any scholarship blog could claim it. The
  differentiator ("verified… evidence") sits in the sub, in muted
  color, at paragraph weight. Promote evidence into the H1 zone.
- Subheadline: does the real work (names categories, source/deadline/
  access evidence). Good; make it shorter and bolder.
- Primary CTA: hero search (functional, concrete — good) + category
  chips (good). Secondary: trust strip (weak as CTA-adjacent proof).
- Hero imagery: one AI photo at ~470px tall + floating "Built around
  action" card. The card overlaps the photo with a gold rule — prestige
  styling around a synthetic image. Highest-risk component on the page.
- Trust proof: text-only strip (no fake stats — commendable) +
  trust-model section mid-page. Honest but abstract; the page never
  shows a redacted evidence example, a verification checklist, or any
  countable proof. A Ministry reader leaves unconverted.
- Opportunity examples: Featured-now (deterministic, "never sponsored"
  — excellent) + full browse. Strong.
- Workflow explanation: 01–04 Discover/Understand/Prioritize/Act is
  clear and matches the real product. Keep.
- Provider/institution credibility: the most honest part of the page
  ("managed pilot, not a self-service portal", "no dashboards yet")
  — and therefore the least persuasive-looking. Restyle as
  confidence (process diagram, pilot criteria), not apology.
- Unnecessary: "Closing soon & recently added" disclosure duplicates
  Featured-now; install prompt inside the hero competes with search;
  signed-in journey nav ("Explore / For You / Your activity") is
  useful but visually noisy next to the H1.

Scores are in §2 with reasons; conversion (5) trails clarity (7)
because the page informs without proving.

## 7. Opportunity card audit

Card (`components/opportunity-card.tsx` + `.opportunity-card` CSS):
cover image with deadline-status overlay → category + geography line →
title → org/hostname → 110-char excerpt → location + deadline rows →
eligibility + fallback line → View-details/added + Save control.

- Communicates what/org/category/deadline/geography/access/trust: yes,
  all present and correctly derived (geography evidenced, never
  inferred; eligibility label with honest fallback).
- Next action: "View details" + Save. Clear.
- Why-care: weakest row — the excerpt is a truncated description, not
  a value proposition; deterministic fit reasons only appear in For You,
  not on Explore cards. Acceptable (do not clutter), but the card
  gives no *personal* reason to click.
- Clutter: deadline appears twice (overlay pill + date row);
  eligibility block + added-date + save = three competing footer rows;
  every card carries a 16:10 AI photo, so grids read as photo-wall
  rather than evidence-wall, and 9 images across 11 records visibly
  repeat.
- Do not dashboard-ify: resist adding scores, match %, or stat rows.
  Planned fix direction: smaller covers (or a coverless density
  option), single deadline line, tighter footer, keep the trust badge
  exactly where it is (it earns its place).

## 8. Opportunity detail audit

Detail (`app/opportunities/[slug]/page.tsx` +
`components/opportunity-detail.tsx`): cover banner → header (category,
status, trust badge, serif title, organizer, added date) → sticky
essentials aside (source CTA, Save, funnel control, deadline, location,
Tanzania eligibility) → About → Who-can-apply (honest unknown fallback)
→ conditional Insight panel → source evidence & history.

- Source authority: the "Open source and application details" button
  is the strongest CTA on the page (full-width primary, hostname
  shown, new-tab note) — correct. But *source identity/evidence*
  lives at the bottom ("Source evidence & record history"); a
  first-time visitor meets the claim before the provenance. Move a
  compact source line under the title in redesign.
- Deadline prominence: good (header status + aside date + planner
  timezone nudge).
- Eligibility clarity: good ("Tanzania eligibility" labeled row +
  Who-can-apply with explicit unknown fallback — best-in-product
  honesty).
- CTA prominence: source CTA dominates; Save + Interested/Applying/
  Applied sit directly beneath — correct order, slightly stacked;
  fine.
- Trust evidence: present, low `$visibility`: badges are small,
  evidence quotes appear late. Elevate, don't add.
- Funnel controls: unified contract, consistent with Activity. Good.
- AI integration: exemplary restraint — panel renders only for
  trusted records, behind an explicit button, labeled "AI-assisted
  explanation based on verified opportunity data"; deterministic facts
  stay outside the AI panel and visually precede it. Verified data
  remains authoritative. **Do not restyle AI to look more authoritative
  than the evidence sections** (no larger type, no top placement, no
  badge that outranks "Evidence verified").

## 9. For You / Activity / Profile audit

Coherent system, plain clothes. For You orders the same published
corpus deterministically with per-card reasons + on-demand AI
explanation (never auto-fetched) + insight deep-link; incomplete
profiles get an honest empty state, never guessed matches. Activity
groups by funnel (Saved/Interested/Applying/Applied) through the same
contract as detail — no state disagreement possible. Profile is a
progressive, skippable form with Explore-always-open messaging.
Cross-links (For You ↔ Activity ↔ Saved ↔ Profile) make it feel like
one workspace, not four pages.

Gaps (all cosmetic, none structural):

- No progress feeling: funnel stages read as filters, not a journey
  (no counts emphasis, no "next step" surfacing beyond planner).
- No profile-completeness feedback loop ("add X to unlock better
  ordering") — deliberately un-gamified today; keep the restraint,
  add one quiet nudge.
- Empty states share one icon and one layout; they are honest but
  interchangeable. Differentiate empty (new user) from dry (no
  matches) visually.
- Encouragement is flat: correct (no gamification noise, no streaks —
  never add them), but a tired graduate sees admin, not momentum.
  Fix with typography and pacing, not badges.

## 10. Trust audit

Increases trust: human-review language with staff-gated actions;
"never sponsored, never paid placement"; explicit unknown states
(deadline/eligibility/location fallbacks); first-party source domains
on live records; deterministic AI labeling; aggregate-only campaign
reporting; private-by-default copy ("private to your account");
no fake counts anywhere (trust strip is text-only); honest pilot
labeling ("not yet available", "no dashboards yet"); privacy-safe
telemetry; generic auth messages (no enumeration).

Decreases trust: AI-generated faces as the human proof; cobalt-blue
controls that look borrowed; serif+gold prestige styling with no
institutional proof behind it; long explanatory passages that read as
protesting; "AI-assisted" present on high-trust surfaces (necessary —
keep it small); install prompt inside the hero (startup behavior on an
infrastructure page); photo captions that admit "editorially" (honest,
but an admission is still a cost).

Net: the *words* are trustworthy; the *pictures and buttons* are not
yet. Redesign must close that exact gap.

## 11. Audience test

A. Tanzanian university student — First impression: clean, serious,
slightly formal; photos look like ads. Trust: real deadlines, source
links, honest "unknown". Doubt: faces that don't look like anyone on
campus; English-only polish that feels NGO-made. Amateur: nothing
structurally; the blue buttons feel like a template. Continue: a real
closing-soon item in their field. Leave: photo-wall repetition with
nothing they recognize.
B. Recent graduate / young professional — First impression: useful
directory, unclear career payoff. Trust: funnel tracking (Applying/
Applied) signals the product understands job-seeking. Doubt: no
outcomes, no alumni proof, no salary/employer depth (correctly absent
— still a conversion cost). Amateur: generic H1. Continue: For You
ordering working on first profile save. Leave: having to read four
sections to believe verification.
C. Opportunity provider — First impression: careful people, small
operation. Trust: "managed pilot", aggregate-only reporting, "charge
for work, never for passing verification". Doubt: synthetic team-style
photo on the organizations hero; no client names, no report sample,
no reach numbers (all honestly absent). Amateur: nothing broken; just
unproven. Continue: a visible 5-step process + a sample redacted
report. Leave: "self-service not available" reading as "we're not
ready".
D. University / innovation hub — First impression: aligned mission,
unfamiliar brand. Trust: evidence-first language, student-privacy
guarantees, no data-selling. Doubt: no institutional marks, no
memorandum-grade formality, photography that a communications office
would reject. Amateur: stock imagery. Continue: a hub-specific
distribution story + privacy architecture in plain language. Leave:
anything that looks like student data might be the product.
E. Ministry / government decision-maker — First impression: too
lightweight for a national-education conversation. Trust: RLS/privacy
posture, human moderation, audit language. Doubt: everything visual —
photos, blue buttons, long marketing sections. Amateur: the gap
between "infrastructure" claims and template visuals. Continue: a
one-page institutional brief + verifiable process + real photography
of Tanzanian institutions. Leave: within 30 seconds if the first
viewport looks AI-made.

## 12. Three design directions (proposals only — nothing implemented)

### Direction 1 — "Institutional Editorial" (leans institutional)

- Personality: a national education publication crossed with a public
  records office. Quiet, exact, permanent.
- Color philosophy: one deep ink (teal-black), paper whites, hairline
  rules; gold reduced to a single rule per page; action color = deep
  teal, never cobalt. No gradients on interactive elements.
- Typography philosophy: serif display for headlines + highly legible
  grotesque for UI; generous whitespace; numbered sections like a
  report (01–04 kept, formalized).
- Photo style: documentary only — real campuses, real event rooms,
  wide shots over faces; where no photo exists, typographic/abstract
  covers (no synthetic people, ever).
- Card style: coverless or 21:9 documentary strip; evidence-first
  rows; trust badge as the visual anchor.
- Homepage character: broadsheet — proof above the fold (evidence
  sample, verification checklist, live deadline ledger), marketing
  copy cut by half.
- Institutional credibility: highest of the three. Looks memorandum-ready.
- Youth appeal: lowest — risks feeling like homework. Needs one warm
  student-voice element (quotes from real users, once they exist).
- Risks: staid; slow-feeling; photography requirements hardest to meet.

### Direction 2 — "Career Platform" (leans modern)

- Personality: the tool a top graduate opens every Monday. Confident,
  fast, personal.
- Color philosophy: deep teal ink + one energetic action color
  (warm green/coral used sparingly) + dark surfaces for the logged-in
  workspace; gold retired or kept as a whisper.
- Typography philosophy: single strong grotesque family, tight
  tracking, larger numerals (deadlines, counts), compact cards.
- Photo style: duotone/graded real photography, motion-feel crops,
  student-work close-ups (hands on hardware, whiteboards) over faces.
- Card style: compact, high-density, deadline-forward; covers small
  or optional; funnel state visible on the card for signed-in users.
- Homepage character: product-led — live shelf first, marketing
  second; search dominant; social proof via activity ("1,200
  applications tracked" — only when true, never before).
- Institutional credibility: medium — ministries may read it as
  commercial; needs an explicit institutional mode/page.
- Youth appeal: highest.
- Risks: converges on global job-board aesthetics; temptation toward
  gamification and fake urgency (must be fenced by existing rules);
  photo grading can look cheap if inconsistent.

### Direction 3 — "Civic Hybrid" (balanced — RECOMMENDED)

- Personality: public infrastructure with a student heartbeat:
  editorial trust surfaces + a warm, personal workspace.
- Color philosophy: one ink (deep teal-black), paper, action-teal
  derived from the existing accent (cobalt retired to link/focus
  support or removed), gold as punctuation only (one per viewport),
  green kept semantic-only for verified states.
- Typography philosophy: keep the serif/sans split (it already works)
  but discipline it — serif for page-level headlines only, sans
  everywhere else; halve the eyebrow kickers.
- Photo style: real documentary where it matters (hero, organizations,
  login), abstract/evidence-led covers elsewhere (deadline ledgers,
  source marks, category glyphs); people only when real and credited.
- Card style: medium-density, single deadline line, smaller optional
  cover, trust badge leading, footer reduced to one row + save.
- Homepage character: proof-led hero (evidence sample + verification
  checklist + live picks) over a shorter marketing tail; three-sided
  platform kept, restyled as process, not apology.
- Institutional credibility: high (near Direction 1) without the
  stiffness — the workspace still feels alive.
- Youth appeal: high enough — warmth comes from student-voice proof
  and momentum (funnel progress), not neon.
- Risks: compromise risk — must be art-directed firmly or it slides
  back to the current middle. Requires a photo editor's discipline
  (real-or-abstract rule enforced per slot).

Recommended: **Direction 3, Civic Hybrid.** It is the only option that
serves the ministry reader and the student in the same session, keeps
the honest-unknown voice (which lives best in an editorial register),
and reuses what already works (serif headlines, evidence language,
funnel workflow) instead of rebranding from zero.

## 13. Real-image sourcing strategy (ranked)

1. **Our own / event photography (highest).** Campus visits, hub demo
   days, workshops: wide rooms, real crowds from behind/side, mentor
   moments with consent. Every frame credited, dated, consented.
   Start here for hero + organizations + login.
2. **Official organization / university media where licensing allows.**
   Press kits, university newsrooms, programme pages with explicit
   reuse terms; written permission filed per asset; credit line shown
   or logged.
3. **Reputable free libraries** (e.g. Unsplash/Pexels-style sources
   with clear licenses): African education/campus/career coverage is
   thin — curate strictly, prefer East-African photographers, avoid
   generic smile-stock and laptop-café clichés.
4. **Paid/licensed libraries later** (only when a named slot cannot be
   filled otherwise): single-seat editorial license, receipts filed.
5. **Illustration/iconography where photography cannot be responsibly
   sourced:** abstract covers (deadline ledgers, category glyphs,
   evidence motifs) — always preferable to synthetic faces.

Provenance requirements (no image enters without all five):

- source (where it came from)
- license / permission basis (with receipt or link)
- photographer / organization credit where relevant
- usage location (which slots/pages)
- retrieval date

Extend `docs/VISUAL_ASSET_PROVENANCE.md` per asset; extend
`lib/cover-registry.ts` slot comments with the real-asset mapping.
Action, crowd, and workplace shots need visible-consent handling;
prefer non-identifying framings until a consent workflow exists.
Never scrape, hotlink, or invent provenance (existing registry rule —
unchanged).

## 14. Prioritized redesign plan

P0 (credibility surgery — smallest change, largest trust delta):

1. Retire cobalt-as-brand: reassign `#1d4ed8` family to links/focus
   support or replace with action-teal; one ink, one action, gold as
   punctuation.
2. Hero replacement: real documentary photo (or a confident
   typographic/evidence hero with no people) + proof-first copy;
   move the install prompt out of the hero.
3. Organizations hero: real room or no-people visual; add a redacted
   sample report + 5-step process as the credibility anchor.
4. Card density: smaller covers (or coverless option), single deadline
   line, one-row footer; keep trust badge placement.
5. Detail authority: compact source line under the title; keep CTA
   order; never let AI outrank evidence visually.

P1 (photography + voice):

6. Replace career/login + Tanzania slots with real photos (consent
   filed); non-people abstracts elsewhere.
7. Halve eyebrow kickers; shorten homepage marketing tail (merge
   snapshot disclosure into Featured-now).
8. Empty-state differentiation (new-user vs no-matches) without new
   illustration systems.
9. Evidence sample component (one redacted verification example on
   homepage trust section).
10. Measured contrast + dark-mode pass on the new tokens.

P2 (depth):

11. Logged-in momentum (funnel progress emphasis, quiet next-step
    surfacing — no gamification).
12. Motion/hover refinement, share/print cards, institutional one-pager.
13. Full registry migration to real assets; retire the AI set.

## 15. Explicit items that must NOT change

Trust architecture, opportunity data model, verified-evidence
hierarchy, AI guardrails (gates, validator, fallback, labeling,
rate-limit, timeout, telemetry allowlist), Discovery (sources, cadence,
Cloudflare worker), Supabase/RLS/policies, activity workflow states
(Saved/Interested/Applying/Applied + unified contract), auth
engineering (recovery, callback, redirects, enumeration-safety), API
contracts (insight endpoint shape, browse query semantics), copy
honesty rules (unknown stays unknown, no fake stats, no paid
placement, aggregate-only reporting). Visual/product communication work
only — no backend rewrite.

## Appendix — files inspected

`app/(home)/page.tsx`, `app/organizations/page.tsx`,
`app/for-you/page.tsx`, `app/activity/page.tsx`, `app/profile/page.tsx`,
`app/login/page.tsx`, `app/login/login-form.tsx`,
`app/forgot-password/page.tsx`, `app/reset-password/page.tsx`,
`app/resend-confirmation/page.tsx`, `app/submit/page.tsx` (structure),
`app/opportunities/[slug]/page.tsx`, `app/globals.css`,
`components/site-header.tsx`, `components/mobile-navigation.tsx`
(structure), `components/bottom-navigation.tsx` (structure),
`components/opportunity-card.tsx`, `components/opportunity-cover.tsx`,
`components/opportunity-detail.tsx`,
`components/opportunity-insight.tsx`,
`components/for-you-explanation.tsx`, `components/empty-state.tsx`,
`components/install-prompt.tsx`, `components/opportunity-filters.tsx`
(structure), `lib/cover-registry.ts`,
`public/images/editorial/` (9 files),
`docs/VISUAL_ASSET_PROVENANCE.md`.
