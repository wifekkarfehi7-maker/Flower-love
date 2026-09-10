import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/config";
import { getSupabaseAnonClient } from "@/lib/supabase/anon";

export const revalidate = 3600;

/**
 * Marketing pages plus every published menu whose venue left search-engine
 * indexing on. RLS already hides unpublished and suspended venues from the
 * anon role; the settings check honours the venue's own choice.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const supabase = getSupabaseAnonClient();
  if (!supabase) return staticEntries;

  const [restaurantsResult, settingsResult] = await Promise.all([
    supabase.from("restaurants").select("id, slug, updated_at").limit(5000),
    supabase.from("restaurant_settings").select("restaurant_id, allow_search_indexing"),
  ]);

  const optedOut = new Set(
    (settingsResult.data ?? []).filter((row) => !row.allow_search_indexing).map((row) => row.restaurant_id)
  );

  const menuEntries: MetadataRoute.Sitemap = (restaurantsResult.data ?? [])
    .filter((restaurant) => !optedOut.has(restaurant.id))
    .map((restaurant) => ({
      url: `${SITE_URL}/menu/${restaurant.slug}`,
      lastModified: restaurant.updated_at ? new Date(restaurant.updated_at) : undefined,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

  return [...staticEntries, ...menuEntries];
}
