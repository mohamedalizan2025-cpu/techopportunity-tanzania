import type { MetadataRoute } from "next";
import { CANONICAL_SITE_URL } from "@/lib/site";
import { listPublishedOpportunities } from "@/lib/data/opportunities";

/**
 * Sitemap for the custom-domain migration (OWNER GATE: merge only after
 * https://techopportunity.tech is verified live with HTTPS).
 *
 * Static public routes are always listed. Published opportunity detail
 * pages are appended best-effort: a missing/failed corpus read (e.g. no
 * Supabase env at build time) fails closed to the static list so the
 * sitemap can never 500 or leak unpublished rows.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${CANONICAL_SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${CANONICAL_SITE_URL}/organizations`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${CANONICAL_SITE_URL}/ask`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${CANONICAL_SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${CANONICAL_SITE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${CANONICAL_SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    const published = await listPublishedOpportunities();
    const detailRoutes: MetadataRoute.Sitemap = published
      .filter((opportunity) => opportunity.slug && opportunity.slug.length > 0)
      .slice(0, 1000)
      .map((opportunity) => ({
        url: `${CANONICAL_SITE_URL}/opportunities/${opportunity.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    return [...staticRoutes, ...detailRoutes];
  } catch {
    return staticRoutes;
  }
}
