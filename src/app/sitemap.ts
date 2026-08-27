import type { MetadataRoute } from "next";

import { getActiveTemplates } from "@/lib/templates/get-templates";
import { SITE_URL } from "@/lib/config";

/**
 * Deliberately excludes /invite/[slug] — those pages carry a couple's real
 * names, photos and event details. They stay reachable (and crawlable) for
 * anyone with the link, but the platform never proactively lists them for
 * search engines to discover.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const templates = await getActiveTemplates();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/templates`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const templateRoutes: MetadataRoute.Sitemap = templates.map((template) => ({
    url: `${SITE_URL}/templates/${template.slug}/preview`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...templateRoutes];
}
