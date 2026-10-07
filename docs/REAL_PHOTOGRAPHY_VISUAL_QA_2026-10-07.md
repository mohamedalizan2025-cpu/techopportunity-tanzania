# Real photography restoration and visual QA — 2026-10-07

Branch: `ai-frontend-v1`. Starting commit:
`e957434421af762694b2502367061a186cccb8c2`.
Main baseline: `3928f7dd6d2745be78326c3c47c3d612e3bc0668`.
Preview-only work; no merge, Production deployment, database mutation,
environment change, credential change, or AI-authority change.

## Delivered

- Two genuine archival University of Dar es Salaam photographs, served locally
  as responsive WebP. Homepage hero: Nick Fraser, CC BY-SA 2.0. Organizations
  institutions section: Alexander Landfair, public domain. Full source links,
  retrieval date, processing, rights and retirement inventory are in
  [VISUAL_ASSET_PROVENANCE.md](VISUAL_ASSET_PROVENANCE.md).
- Civic Hybrid headline and Explore CTA remain primary. No photography on
  auth, opportunity cards/detail, AI Match or Ask; no fabricated community proof.
- Homepage AI entry moved from below the full shelf to before Browse (after
  featured records when available). Explore remains primary and public.
- AI Match cards precede fit reasons; profile/relevance chips are neutral,
  not verification-green. Unknown eligibility has a separate warning heading
  and divider. Partitioning, ranking, trust and explicit-request logic unchanged.
- AI Match and Ask use display headings with nonduplicative eyebrows. Footer
  now consistently names AI Match and Ask alongside Explore and Activity.
- Nine historical AI files and their registry/test contract are retained.
  `showCover` defaults to false, with no page caller enabling it. No historical
  AI photograph is actively rendered.

## Evidence and limits

### DIRECTLY VERIFIED — local build, browser, dark mode

Viewport dimensions were read from the rendered document, not assumed from
the resize request. Mobile: 390 × 844. Desktop: 1440 × 900 (also an initial
1280px desktop observation).

| Surface | Observation |
| --- | --- |
| Homepage | Desktop headline/copy dominates; hall image beside copy. Mobile copy, Explore and search precede photography. Credit/license and early AI entry readable; no horizontal document overflow at 390/1440. |
| Organizations | Sample report and managed process remain ahead of documentary context. Campus photo/caption stacks at 390 and sits beside institutional copy at 1440; no horizontal overflow. |
| Login/auth | Image-free, form-led layout inspected at 390/1440. No credentials entered and no form submitted. |
| Ask | Updated heading, scoped product explanation, sign-in boundary and useful public FAQ inspected at 390/1440. No horizontal overflow at 390. Not proof of authenticated answers. |
| `/for-you`, `/ai-match` | Both preserve the signed-out redirect to `/login?next=%2Ffor-you`. This is authentication-boundary evidence, not signed-in AI Match visual proof. |

Local build/server explicitly overrode the Supabase URL to localhost and used
a non-secret placeholder anonymous key, empty service-role key and disabled
opportunity intelligence. Local empty shelf is expected; it is not live-data
evidence. Expected localhost fetch warnings did not fail the build.

### DIRECTLY VERIFIED — starting Preview

Vercel identified the starting deployment as Preview, source `ai-frontend-v1`
at `e957434`. Branch URL:
<https://techopportunity-tanzania-git-ai-frontend-v1-techopportunity.vercel.app>.
Signed-out homepage and Ask inspected in dark mobile view. The old homepage
AI entry was below the shelf and the Ask eyebrow duplicated its heading;
the delivered changes address those concrete hierarchy issues.

### DIRECTLY VERIFIED — delivered Preview

Implementation commit `bd694cc53d4788413d32c0be4f9391c47e36f4d4` was
pushed only to `ai-frontend-v1`. Vercel deployment `75FgUWdkUVLFdinWdU74DiZZ9xiP`
visibly reported **Ready**, **Preview**, that source branch and commit.
Immutable URL:
<https://techopportunity-tanzania-64l5extjd-techopportunity.vercel.app>.
The branch Preview homepage was then inspected at 1440 × 900 and 390 × 844
in dark mode: the new photograph loaded, source/license were present,
Explore remained dominant and neither viewport had horizontal overflow.
The updated Ask heading and signed-out help were verified on the deployed
mobile view. Both `/for-you` and `/ai-match` redirected to the protected
login destination as expected. Signed-in visuals remain unverified.

### STATIC/STRUCTURAL — not browser proof

- AI Match: responsive one/two-column cards, wrapping neutral profile/reason
  tags, facts before explanations, warning-separated unknown eligibility.
- Ask suggestions are verification, Tanzanian access, matching, application
  tracking, reporting and account-help questions. Chips wrap and only fill
  the input; custom questions still require explicit submission.
- Existing light/dark semantic tokens are retained. Light warning is
  `#7A5200`; dark warning is `#F0C36D`. Photo captions use the existing muted
  text tokens, with the hero's explicitly light caption palette.
- No active generated-image cover callers; no tests or constraints weakened.

### Quality gates

- `npm test`: PASS in the final `npm run verify` run.
- `npm run verify`: PASS, including TypeScript, ESLint, 43 permanent boundary
  checks, 7 AI Match and 12 Ask contract tests. No production evidence gate
  selected for this UI-only change.
- `npm run build`: PASS with isolated localhost overrides, 30 static pages
  generated. The initial test run caught a changed heading contract; the
  original “Why this fits you” heading was restored, and the full rerun passed.
- `git diff --check`: PASS before commit.

## OWNER VISUAL CHECK REMAINING

The browser remained signed out and in dark mode. Browser policy denied
access to appearance settings; no workaround or authentication bypass was
used. This is a partial visual QA result, not a complete light/dark sign-off.

On the final Preview deployment, at approximately 390px and desktop:

1. In light mode, review homepage, Organizations, login, `/for-you`, `/ask`
   and `/ai-match` for contrast, wrapping and hierarchy.
2. Sign in normally with a synthetic Preview test account. In both modes,
   confirm populated AI Match puts verified eligibility above explanations,
   visibly separates unknown eligibility, and works through the alias.
3. In both modes, inspect Ask's signed-in suggested-question chips and one
   requested answer, including loading/fallback/reference presentation.

Do not merge to main or deploy Production as part of these checks.
