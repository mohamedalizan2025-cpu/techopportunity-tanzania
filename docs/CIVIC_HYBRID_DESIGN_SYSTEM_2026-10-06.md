# Civic Hybrid design system 2026-10-06 (SPECIFICATION — no code changed)

Branch: `staging`. `main` untouched. This document is an implementation
specification for Direction 3 ("Civic Hybrid") selected from
`docs/VISUAL_PERSUASION_AUDIT_2026-10-06.md` §12. A separate coding agent
must be able to implement the redesign from this file without inventing
its own direction. No UI code was changed here.

Thesis, palette, type, photography, page, responsive, accessibility, plan,
and acceptance criteria are all locked below. Anything not specified here
stays as-is.

## 1. Design thesis

"Trusted opportunity infrastructure for ambitious emerging talent."

Four balances, in priority order: institutional credibility first
(ministries, universities, providers must take it seriously),
editorial trust second (evidence-first, honest unknowns),
product clarity third (every page answers what/for-me/trust/next),
youthful ambition fourth (warmth and momentum, never neon or noise).

AI is a supporting capability. It never leads a page, never outranks
verified information visually, and never appears in brand marks, heroes,
or empty states.

Anti-molds (never resemble): AI startup template, generic SaaS,
government enterprise software, tourism branding, scholarship-link blog,
stock-photo career portal.

## 2. Final accessible palette (light mode — default)

All text pairs below were verified by relative-luminance computation
(WCAG 2.x formula) on 2026-10-06. Ratios are recorded so implementers
never substitute untested values.

| Token | Value | Verified use → ratio |
|---|---|---|
| Ink (text/brand-ink) | `#132238` | on Ivory → **15.06**; on Gold → **5.12** |
| Ivory (page bg) | `#FAF8F3` | Ink on Ivory → **15.06** |
| Deep Teal (interactive bg) | `#075E57` | White text on it → **7.64**; as link text on Ivory → **7.20** |
| Teal (emphasis, large/UI only) | `#087F75` | on Ivory → **4.60** (body text allowed but prefer Deep Teal; never below 14px semibold without checking) |
| Gold (punctuation) | `#B88A36` | on Ink → **5.12**; on Ivory → **2.94 (FAIL — forbidden)** |
| Muted text | `#4E5D62` | on Ivory → **6.45** |
| Subtle text | `#55636A` | on Ivory → **5.86** |
| Verified green | `#0B6B4F` | on white → **6.50**; on Ivory → **6.13** |
| Warning amber text | `#7A5200` | on `#FDF3E0` → **6.29** |
| Danger red | `#B3261E` | on white → **6.54** |

Decorative (no text set in these): Sand `#F0EBE1`, line `#DCD5C5`,
line-strong `#C6BCA4`, brand-soft `#DDEDE8`, gold-soft `#F5EAD0`,
verified bg `#E4F3EA`, warning bg `#FDF3E0`, danger bg `#FCEBE9`.

Dark mode: bg `#0E1A26`, surface `#16283A`, text `#F5F1E8` (ratio
**15.60**), links/teal `#2FB3A6` (**6.80** on bg), gold `#D3A85C`
(**7.97**), verified `#7FD6A8` (**10.12**), amber `#F0C36D`
(**10.66**), danger `#F2A49E` (**8.86**). Muted dark `#A9B8C2`
(use for secondary text; passes on `#0E1A26` by construction margin —
implementer must keep ≥4.5 and record the ratio at build time).

Cobalt `#1d4ed8` and its family are retired as brand. No new blue may
be introduced as an accent. Blue survives only where the platform
forces it (never by choice).

## 3. Semantic tokens (exact mapping)

Implement as CSS custom properties replacing the current `:root` set.
Names are stable; values locked above (light) and in §2 (dark).

- `background`: Ivory `#FAF8F3` (dark `#0E1A26`)
- `foreground`: Ink `#132238` (dark `#F5F1E8`)
- `surface`: `#FFFFFF` (dark `#16283A`)
- `surface-raised`: `#FFFFFF` + elevation shadow (dark `#1B3049` + shadow)
- `muted-surface`: Sand `#F0EBE1` (dark `#1A2C3E`)
- `line`: `#DCD5C5` (dark `#2A3E55`)
- `line-strong`: `#C6BCA4` (dark `#3B4F68`)
- `brand` (all interactive bg + link text): Deep Teal `#075E57`
  (dark `#2FB3A6` for text/links; button bg stays `#075E57` with white
  text in both modes — 7.64 holds on the button, not the page)
- `brand-hover`: `#054A45` (dark: lighten to `#35BFB2`)
- `brand-soft` (selected nav, info wells): `#DDEDE8`
  (dark `#143B3A`)
- `accent` (large numerals, icons-with-adjacent-text, non-body
  emphasis): Teal `#087F75` (dark `#2FB3A6`)
- `accent-soft`: same as `brand-soft`
- `gold` (punctuation ONLY — rules, one eyebrow per viewport max,
  dark-hero button bg with Ink text): `#B88A36` (dark `#D3A85C`)
- `verified` (text/icons): `#0B6B4F` (dark `#7FD6A8`);
  bg `verified bg` above
- `warning`: `#7A5200` on `#FDF3E0` (dark text `#F0C36D` on `#2A230F`)
- `danger`: `#B3261E` (dark `#F2A49E`); bg `#FCEBE9` (dark `#33110F`)
- `subtle text`: `#55636A` (dark `#A9B8C2`); `muted text`: `#4E5D62`
  (dark `#C2CFD8`)

FORBIDDEN as general brand accents: any cobalt/royal blue, pure black
buttons, neon/fluorescent hues, gradients on interactive elements,
gold body text on light backgrounds, green for anything except
verified/success states, amber/red for anything except urgency/error.

## 4. Typography scale (system stack — no new fonts)

Keep Georgia serif display + system sans body (already shipped, zero
dependency risk). Serif is page-headline-only; all UI, cards, metadata,
and buttons are sans.

| Use | Size / weight / leading | Width | Mobile |
|---|---|---|---|
| Hero headline | `clamp(2.25rem, 4.5vw, 3.5rem)` / 600 serif / 1.1 | `max-w-3xl` | min size applies at 390px |
| Page title | `1.875rem→2.25rem` / 600 serif / 1.15 | `max-w-3xl` | 1.75rem at ≤640px |
| Section heading | `1.5rem` / 600 serif / 1.2 | `max-w-2xl` | 1.375rem |
| Opportunity title (card + detail) | card `1.125rem`, detail `1.875rem→2.5rem` / 600 / 1.25 | card none (grid cell), detail `max-w-4xl` | card 1.0625rem |
| Card metadata | `0.8125rem` / 500–600 / 1.5 | — | same |
| Body | `1rem` / 400 / 1.75 (`leading-7`); small `0.875rem/1.6` | prose `max-w-2xl` | same |
| Evidence/source text | `0.875rem` / 400 / 1.6, quoted with left rule | `max-w-2xl` | same |
| Labels/badges | `0.75rem` / 650–700, caps + tracking for kickers ONLY | — | same |
| Buttons | `0.875rem` / 650 / 1 | — | full-width only in auth/forms |

Kicker (eyebrow) budget: max one per viewport; section kickers cut by
half versus current. Kickers are orientation devices, not decoration.

## 5. Spacing / radius / shadow rules

- Page shell: 1200px max, fluid gutters `clamp(16px, 4vw, 40px)` (keep).
- Section rhythm: `py-10 / sm:py-14` standard; hero `py-12 / sm:py-16`.
- Card padding 20–22px; grid gaps 16px; stack gaps 24–32px.
- Radius: 6px controls/inputs, 10px cards/media. No pill buttons
  except the existing back-link style (keep).
- Shadows: cards `0 10px 28px rgb(19 34 56 / .06)`, hover deepen only;
  raised dialogs one step up. No colored glow shadows.
- Gold appears once per viewport (rule OR button OR eyebrow — never two).

## 6. Photography policy (HARD RULE)

NO NEW AI-GENERATED PEOPLE. No exceptions, no "temporary" synthetic
faces. NO PHOTO is better than FAKE PHOTO. Banned: staged laptop
smiles, fake "African students", tokenism, handshakes, café-coding
clichés, synthetic faces, unrelated stock.

## 7. Current image retirement map (all 9 AI assets)

| File | Retirement order | Replacement |
|---|---|---|
| `hero-students.webp` | P0 first | Real event/campus photo (owned first) or image-free evidence hero |
| `organizations-partnership.webp` | P0 with hero | Real professional room or typographic panel + sample-report visual |
| `career-mentorship.webp` (login) | P1 | Real mentorship/workplace photo or image-free auth (acceptable) |
| `zanzibar-students.webp` | P1 | Real Zanzibar campus or architecture/crowd-from-behind |
| `technology-makers.webp` | P1 | Real hub/makerspace or non-people equipment close-up |
| `founders-pitch.webp` | P1 | Real demo-day photo or abstract |
| `climate-research.webp` | P1 | Real fieldwork (most persuasive slot — prioritize sourcing) |
| `global-scholars.webp` | P2 | Licensed international-education photo or abstract |
| `leadership-roundtable.webp` | P2 | Real workshop or abstract |

Interim: current assets stay with existing honest captions
("Editorial image…", "pictured editorially") until replaced; no asset
may be added to new surfaces. `cover-registry.ts` slot mapping stays
functional; P0 replaces the two hero slots with real-or-abstract
treatment first, cards follow.

## 8. Image provenance standard

Every future photo records, in `docs/VISUAL_ASSET_PROVENANCE.md`: file,
source, creator/organization, license/permission basis (receipt or
link), retrieval date, intended usage (slots/pages). Crowd/action shots
need consent handling; prefer non-identifying framings until a consent
workflow exists. Never scrape, hotlink, or invent provenance.

## 9. Homepage wire hierarchy (locked sequence)

A. HERO — kicker (talent, one line) → H1 "Find opportunities worth
acting on." → 2-line proposition (human-reviewed; eligibility
evidence; deadlines; discovery→application tools) → primary CTA
"Explore opportunities" (Deep Teal solid) + secondary "Get
recommendations" (quiet) → search input below CTAs (not above) →
single proof strip (live deadline-ordered picks link, evidence
checklist link). Hero visual: ONE real photo or image-free evidence
panel (verification checklist + live pick). No AI mention. No install
prompt in hero (move to footer-adjacent slot).
B. PRODUCT PROOF — 3 live deadline-diverse cards (deterministic,
"never sponsored" caption kept) within the first two viewports.
C. TRUST BAR — human-reviewed / source evidence / Tanzania access
checked when evidenced / deadlines structured / "AI never decides
eligibility" — each item links to its evidence section. No vanity
numbers, ever.
D. HOW IT WORKS — Discover → Verify → Prioritize → Track → Apply
(numbered, kept, tightened copy).
E. PERSONAL WORKSPACE — For You + Saved/Interested/Applying/Applied in
one visual band with a single CTA.
F. PROVIDERS/INSTITUTIONS — secondary: "Publishing an opportunity?"
verified distribution + aggregate-only reporting + Organizations link.
Honest pilot labels stay.
G. FINAL CTA — return to talent action ("Explore opportunities").

## 10. Card specification (information surface)

Order, always: 1 category (restrained: small caps, ink, no pill) →
2 title → 3 organization/host → 4 location · access (one line) →
5 deadline (ONE line: status + date) → 6 trust (badge OR honest
fallback line) → 7 action row (details link + Save).
Featured card: same anatomy + deadline accent border-top (gold, 2px)
and "Closing soon" status — never larger photo, never score.
Compact/list card (snapshots, For You overflow): title + category +
deadline, no cover, no excerpt.
Mobile card: same order, cover optional-off (default: cover hidden
under 640px unless the slot holds a REAL photo), full-width action row.
Covers: optional, max 16:10, hidden by default until real assets
arrive; no per-card photo requirement. Never a dashboard: no stats,
no scores, no percentages, no progress bars on cards.

## 11. Detail specification (above the fold)

CATEGORY kicker → TITLE (serif) → ORGANIZATION · hostname →
SOURCE LINE (compact: "Source: {host} · Evidence {verified|reviewed} ·
checked {date}") → DEADLINE status + date → GEOGRAPHY / TANZANIA ACCESS
line → PRIMARY SOURCE CTA (full-width Deep Teal, "Open source and
application details", hostname + new-tab note kept). Then: About →
Who can apply (honest unknown fallback kept) → evidence & history →
Save/funnel controls → AI insight (explicit button, subordinate
styling: smaller heading than section titles, muted label, appears
LAST among guidance blocks). AI heading never exceeds section-heading
size; no AI badge may outrank "Evidence verified".

## 12. Logged-in workspace specification

Shared grammar across For You / Activity / Profile: same page header
(kicker + serif title + one-line purpose + single primary CTA), same
`state-panel` empty states (differentiated copy: new-user vs no-match),
same funnel vocabulary everywhere (Saved · Interested · Applying ·
Applied with identical labels/colors), same muted AI-explanation
treatment. Profile completeness: one quiet line ("Add your field to
sharpen ordering — optional") — no meters, no percentages, no streaks,
no points, no badges. Progress feeling comes from funnel grouping +
planner next-steps, never gamification.

## 13. Auth specification

Quiet centered card (max-w-md), Ink title, muted helper copy,
50px inputs, full-width Deep Teal submit, text-link recovery,
generic responses unchanged (no enumeration). Optional side image
allowed ONLY if real; image-free is the default and fully acceptable.
Privacy line under every auth form ("Saved items and profiles stay
private to your account."). Recovery path linked from all error
states. No marketing panels inside auth.

## 14. Organizations specification

Audience: providers, universities, hubs, NGOs, government. Tone:
process, not pitch. Blocks: proposition → 5-step managed process
(share → verify → distribute → aggregate → report) → privacy rules
(never sold, aggregate-only, verification never bypassed, no
guaranteed numbers) → REDACTED SAMPLE REPORT visual → audience fit
(hubs/universities/NGOs/government rows) → submit CTA. Sample-report
concept: gray-box panel titled "Sample report — clearly labeled
sample data", showing Saved/Interested/Applying/Applied as four bars
with small integers (e.g. 48/12/5/2), caption "Illustrative numbers,
not real results", plus a "what you receive" list (counts, top
sources, period). NO partner logos, NO customer numbers, NO
testimonials unless real and permissioned.

## 15. Responsive rules (390px primary)

- Nav: bottom-nav (Explore/For You/Saved/Profile, 60px rows) +
  condensed top bar (brand + menu); staff links hidden as today.
- Hero: stacked, H1 min size, search full-width with submit below
  input at ≤640px? No — keep inline row (input + button) down to
  360px (verified pattern today); category chips horizontal scroll.
- Cards: single column, covers off until real photos, one-line
  deadline, footer wraps.
- Filters: disclosure-collapsed by default on mobile (as today).
- Trust metadata: wraps under title, never clipped; badges shrink,
  never hide.
- Detail: aside stacks AFTER About on mobile? No — CTA must stay
  reachable: keep aside first on mobile (`order-first`) as today,
  rest stacks.
- AI insight: full-width panel, no side-by-side columns under 1024px.
- Activity controls: full-width buttons, 48px+ targets.
- Touch: 44px minimum everywhere (48px primary); focus ring 2px
  Deep Teal + 2px offset, visible on sand and ivory.

## 16. Accessibility rules (locked)

- Text contrast ≥4.5 (pairs in §2); UI/borders ≥3. Heading hierarchy
  unbroken (h1 once per page); links vs buttons semantic (navigation =
  link, action = button); color never the sole signal (status always
  pairs icon + text); `prefers-reduced-motion` honored (already in
  CSS — keep); images: informative photos get descriptive alt,
  decorative covers `alt="" aria-hidden` (current pattern — keep);
  form labels always visible; errors `role=alert` with recovery link.

## 17. P0 / P1 / P2 implementation sequence

P0 (tokens + homepage + nav + cards + hero de-AI-ing; backend
untouched): retoken `:root`/dark from §3 → header/nav recolor (kill
cobalt) → hero rebuild per §9A (real-or-abstract visual, install
prompt moved) → card rebuild per §10 (optional covers, single
deadline) → trust-bar + proof ordering per §9B/C → focus/touch pass.
P1 (detail, workspace, orgs, auth): detail hierarchy §11 → For You /
Activity / Profile grammar §12 → Organizations + sample report §14 →
auth quiet pass §13 → first real-photo intake (hero/orgs/login).
P2 (secondary/staff/micro-motion): staff surfaces recolor only (no
workflow change) → empty-state differentiation → full registry
migration → measured contrast audit → motion only if justified
(reduced-motion safe).

## 18. Acceptance criteria (all must hold before staging review)

1. Zero cobalt-brand remnants (grep `#1d4ed8`/`primary` brand usage
   confined to legacy removal; links/buttons/focus all Deep Teal).
2. Zero AI-people images on hero, organizations, login (replaced or
   removed; captions honest).
3. Gold appears ≤1 per viewport (spot-check 5 pages × 2 widths).
4. Every text pair traces to §2 ratios (no unlisted hex for text).
5. AI panel subordinate on all 3 smoke positives (smaller heading,
   last position); unknown-eligibility still withheld.
6. Cards: one deadline line; no scores/percentages; covers optional.
7. `npm test`, `npm run verify`, `npm run build` green; no
   data-model/RLS/AI-contract/auth-contract diff.
8. 390px + 1366px owner eyeball pass (real rendering — the one proof
   this spec cannot supply itself).

Backend/data contracts untouched: trust architecture, data model,
evidence hierarchy, AI guardrails, Discovery, Supabase/RLS, activity
workflow, auth engineering, API contracts — visual work only.
