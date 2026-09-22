"use client";

import { useAuth } from "./provider";

/**
 * A link into a protected page that survives sign-in with its query string
 * intact. The middleware's own redirect keeps only the path, so a signed-out
 * visitor is sent to /login with the full destination instead.
 */
export function useProtectedHref(href: string): string {
  const { user } = useAuth();
  return user ? href : `/login?next=${encodeURIComponent(href)}`;
}
