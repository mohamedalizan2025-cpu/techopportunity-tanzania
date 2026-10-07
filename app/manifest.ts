import type { MetadataRoute } from "next";

/**
 * Installable PWA manifest. All URLs are same-origin and relative so the
 * manifest always points at the canonical deployment serving it. Icons are
 * locally generated brand assets under public/icons/.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tech Opportunity",
    short_name: "TechOpportunity",
    description:
      "Opportunities worth acting on for Tanzania's emerging talent. Check source evidence, find relevant opportunities and track your application progress.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f2e8",
    theme_color: "#082f2b",
    categories: ["education", "business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Explore", url: "/", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      {
        name: "AI Match",
        url: "/for-you",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Saved",
        url: "/saved",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
