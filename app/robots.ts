import type { MetadataRoute } from "next";

/**
 * Canonical deployment policy, enforced in code (see docs/architecture.md §6).
 * OWNER GATE: this branch prepares the move to the intended production URL
 * https://techopportunity.tech — merge only after that domain is verified
 * live with HTTPS. Until then production keeps serving the existing
 * vercel.app origin from `main`.
 * Every non-production deployment (staging branch Preview, PR previews,
 * local dev) must stay out of search indexes. Vercel Authentication already
 * gates staging; this is the repo-level backstop so a misconfigured
 * deployment can never be indexed.
 */
export default function robots(): MetadataRoute.Robots {
  if (process.env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://techopportunity.tech/sitemap.xml",
  };
}
