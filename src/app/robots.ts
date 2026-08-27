import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/config";

/**
 * Private/auth-gated routes are disallowed here rather than marked
 * noindex — middleware already redirects unauthenticated visitors away
 * from them, so a crawler would never see the page HTML anyway. Public
 * invitation pages (/invite/[slug]) are deliberately crawlable (they're
 * meant to be shared) but never listed in the sitemap — see sitemap.ts.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/my-invitations",
        "/invitations",
        "/complete-profile",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
