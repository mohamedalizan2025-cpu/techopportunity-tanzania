/**
 * Canonical site identity for the custom-domain migration.
 *
 * OWNER GATE: this constant points at the intended production domain
 * https://techopportunity.tech and must only reach `main` after that
 * domain is verified live with HTTPS. This branch is UNMERGED by design.
 *
 * Until the merge, production keeps serving the existing vercel.app origin;
 * this file (plus the sitemap/robots/metadata updates around it) is the
 * complete code-side switch. Dashboard work (Vercel domain attach,
 * Supabase Auth redirect allow-list, NEXT_PUBLIC_SITE_URL) stays owner-side.
 */

export const CANONICAL_SITE_URL = "https://techopportunity.tech";

export const SITE_NAME = "Tech Opportunity";

export const SITE_DESCRIPTION =
  "Opportunities worth acting on for Tanzania's emerging talent. Check source evidence, find relevant opportunities and track your application progress.";

export function canonicalUrl(path: string = "/"): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalized, CANONICAL_SITE_URL).toString();
}
