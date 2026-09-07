import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { MenuExperience } from "@/components/public-menu/menu-experience";
import { SITE_NAME, SITE_URL } from "@/lib/config";
import { localized } from "@/lib/i18n/format";
import { getPublicMenu } from "@/lib/menu/get-public-menu";

/**
 * The page is rendered without cookies (see lib/supabase/anon) so it can be
 * cached and served fast to a phone on mobile data. Per-visit work — resolving
 * the scanned table and recording the view — happens in the browser instead.
 * Menu edits appear within the revalidation window.
 */
export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const menu = await getPublicMenu(params.slug);
  if (!menu) {
    return { title: SITE_NAME, robots: { index: false } };
  }

  const { restaurant, settings } = menu;
  const locale = restaurant.default_language;
  const title = localized(restaurant, "name", locale) || restaurant.name;
  const description =
    localized(restaurant, "description", locale) ||
    `${title} — ${restaurant.address ?? ""}`.trim() ||
    title;
  const image = restaurant.cover_url ?? restaurant.logo_url ?? undefined;
  const url = `${SITE_URL}/menu/${restaurant.slug}`;
  const indexable = settings?.allow_search_indexing ?? true;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: indexable ? undefined : { index: false, follow: false },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: title,
      images: image ? [{ url: image, alt: title }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PublicMenuPage({ params }: { params: { slug: string } }) {
  const menu = await getPublicMenu(params.slug);
  if (!menu) notFound();

  return (
    <Suspense fallback={null}>
      <MenuExperience menu={menu} />
    </Suspense>
  );
}
