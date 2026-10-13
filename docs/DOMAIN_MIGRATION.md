# Custom domain migration — techopportunity.tech

MERGE BLOCKED until https://techopportunity.tech is publicly live with valid HTTPS.

This PR branch (`chore/domain-migration-verification-fix`) preserves the original
`chore/domain-migration-prep` work and remains UNMERGED preparation. DNS
activation is still propagating and must NOT be assumed live. Production on
`main` keeps serving `https://techopportunity-tanzania.vercel.app` until this
branch merges.

## Code changes in this branch

- `lib/site.ts` (new): single `CANONICAL_SITE_URL =
  https://techopportunity.tech` source plus `canonicalUrl()` helper.
- `app/layout.tsx`: canonical `metadataBase` + global title template only;
  homepage canonical/social identity belongs to `app/(home)/page.tsx`.
- `lib/site.ts`: `publicPageMetadata()` gives each indexable public route its
  own canonical, social URL/title/description and images. Page title inputs
  are unbranded; the document title template supplies exactly one suffix.
- `app/opportunities/[slug]/page.tsx`: route-specific article metadata and
  canonical; unknown details do not inherit the homepage canonical.
- `app/sitemap.ts`: seven public static routes plus the existing loader's
  bounded active-published detail URLs, refreshed every 60 seconds. No synthetic
  `lastModified` dates; generation time is not a content-modification date.
- `app/robots.ts`: production allows `/` and advertises
  `https://techopportunity.tech/sitemap.xml`; non-production stays
  disallow-all.
- `scripts/discovery/fetch.ts`: crawler User-Agent contact URL → canonical.
- `.env.example`: documents intended `NEXT_PUBLIC_SITE_URL`.
- `tests/auth-recovery.test.ts`, `tests/accounts-saved.test.ts`:
  `NEXT_PUBLIC_SITE_URL` expectations → canonical; Vercel-fallback cases
  kept intact.

No Supabase/Vercel dashboard change in this branch. No migration. AI OFF.

## Public route / inheritance audit (PR #2 cleanup)

| Route set | Metadata / sitemap behavior |
|---|---|
| `/` (including browse filter/query variants) | Homepage canonical `/`; homepage-only social identity; absolute brand title |
| `/organizations`, `/ask`, `/contact`, `/privacy`, `/terms`, `/submit` | Self canonical + route-specific social identity; all seven static routes including home appear in sitemap |
| `/opportunities/[slug]` | Self canonical + article metadata, one document title suffix; existing active-published loader supplies sitemap URLs |
| Account/auth, activity/saved/matching, staff/campaign/report and offline pages | Existing noindex preserved; no inherited homepage canonical/social URL; omitted from sitemap |
| `/ai-match`, auth callback/API routes, missing details | Redirect/handler/404 behavior preserved; omitted from sitemap |

No UI, publication, matching, data-query, auth or AI behavior changes. Stored
expired detail pages stay reachable under the existing lifecycle contract but
remain outside the active sitemap. The loader's current 500-row bound is retained;
this is not an unbounded corpus export. The owner gate is unchanged.

## Owner verification before merge

1. `https://techopportunity.tech` returns 200 with HTTPS (root canonical).
2. `https://www.techopportunity.tech` (if used) redirects to root.
3. Vercel dashboard: domain shows Valid + production deployment attached.
4. Cloudflare: zone Active, DNS-only records as instructed, $0 spend kept.
5. Supabase dashboard (after code merge + Vercel env set):
   Auth redirect allow-list includes `https://techopportunity.tech/**`
   (keep the vercel.app entry until cutover is confirmed).
6. Anonymous smoke on canonical: `/`, one `/opportunities/[slug]`,
   `/robots.txt` (allow + sitemap), `/sitemap.xml` (200), `/ask` gate intact.

## Owner steps at cutover (manual, in order)

1. Vercel: add `techopportunity.tech` (+ `www` if desired) to the ONE
   existing project; wait for Valid.
2. Vercel env: set Production `NEXT_PUBLIC_SITE_URL=https://techopportunity.tech`
   (Preview untouched); redeploy production.
3. Supabase: add canonical redirect URL; keep old URL during transition.
4. Merge this branch to `main` (fast-forward only) → auto-deploys production.
5. Re-run smoke above on the canonical; keep vercel.app working as fallback
   until search console migration is done.

## SEO cutover (after live)

- Google Search Console: add property, submit `/sitemap.xml`, request
  indexing for `/` + 3 detail pages.
- Bing Webmaster Tools: same sitemap submit.
- No invasive analytics or paid tools added in this branch.
