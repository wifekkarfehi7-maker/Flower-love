import { NextResponse, type NextRequest } from "next/server";

import { safeInternalPath } from "@/lib/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/** Exchanges the emailed one-time code for a session (sign-up + password reset). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeInternalPath(searchParams.get("next"), "/dashboard");

  if (code) {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
