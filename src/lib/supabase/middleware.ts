import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/types/database";
import { getSupabaseAnonKey, getSupabaseUrl, isSupabaseConfigured } from "./config";

const PROTECTED_PATHS = ["/my-invitations", "/invitations", "/complete-profile", "/reset-password"];
const AUTH_ONLY_WHEN_LOGGED_OUT_PATHS = ["/login", "/register"];

/**
 * Refreshes the Supabase session cookie on every request and enforces
 * route protection: unauthenticated visitors are bounced away from
 * protected pages, and already-authenticated visitors skip the auth forms.
 * Called from the root `middleware.ts`.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return response;
  }

  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (isProtected && !user) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const isAuthOnlyPage = AUTH_ONLY_WHEN_LOGGED_OUT_PATHS.some((path) => pathname.startsWith(path));
  if (isAuthOnlyPage && user) {
    return NextResponse.redirect(new URL("/my-invitations", request.url));
  }

  return response;
}
