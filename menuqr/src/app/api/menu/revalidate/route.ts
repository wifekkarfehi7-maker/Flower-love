import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

import { menuCacheTag } from "@/lib/menu/get-public-menu";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Drops the cached public menu for one venue. Called by the dashboard after a
 * change so guests see it right away. Membership is re-checked here against
 * the caller's own session — being able to *read* a published venue is not
 * permission to purge its cache.
 */
export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ revalidated: false }, { status: 503 });
  }

  let slug: unknown;
  try {
    ({ slug } = await request.json());
  } catch {
    return NextResponse.json({ revalidated: false }, { status: 400 });
  }

  if (typeof slug !== "string" || !/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/.test(slug)) {
    return NextResponse.json({ revalidated: false }, { status: 400 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ revalidated: false }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("restaurant_members")
    .select("restaurant_id, restaurants!inner(slug)")
    .eq("user_id", user.id)
    .eq("restaurants.slug", slug)
    .maybeSingle();

  if (!membership) {
    return NextResponse.json({ revalidated: false }, { status: 403 });
  }

  revalidateTag(menuCacheTag(slug));
  return NextResponse.json({ revalidated: true });
}
