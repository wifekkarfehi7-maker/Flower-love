import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Everything behind a login, plus the API surface, stays out of indexes.
      disallow: ["/dashboard", "/admin", "/onboarding", "/api", "/auth", "/login", "/register", "/reset-password", "/forgot-password"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
