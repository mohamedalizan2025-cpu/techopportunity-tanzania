# Custom domain migration — techopportunity.tech

OWNER GATE: merge only after techopportunity.tech is verified live with HTTPS.

This branch (`chore/domain-migration-prep`) is UNMERGED preparation. DNS
activation is still propagating and must NOT be assumed live. Production on
`main` keeps serving `https://techopportunity-tanzania.vercel.app` until this
branch merges.

## Code changes in this branch

- `lib/site.ts` (new): single `CANONICAL_SITE_URL =
  https://techopportunity.tech` source plus `canonicalUrl()` helper.
- `app/layout.tsx`: `metadataBase` → canonical, title template, canonical
  alternates, Open Graph + Twitter summary cards (WhatsApp/LinkedIn previews).
- `app/opportunities/[slug]/page.tsx`: per-opportunity canonical + OG/Twitter.
- `app/sitemap.ts` (new): static public routes + best-effort published
  detail URLs (fails closed to static list, never leaks unpublished rows).
- `app/robots.ts`: production allows `/` and advertises
  `https://techopportunity.tech/sitemap.xml`; non-production stays
  disallow-all.
- `scripts/discovery/fetch.ts`: crawler User-Agent contact URL → canonical.
- `.env.example`: documents intended `NEXT_PUBLIC_SITE_URL`.
- `tests/auth-recovery.test.ts`, `tests/accounts-saved.test.ts`:
  `NEXT_PUBLIC_SITE_URL` expectations → canonical; Vercel-fallback cases
  kept intact.

No Supabase/Vercel dashboard change in this branch. No migration. AI OFF.

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
