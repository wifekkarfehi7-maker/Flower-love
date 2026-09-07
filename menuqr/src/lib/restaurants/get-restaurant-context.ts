import { cookies } from "next/headers";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Restaurant, RestaurantRole, RestaurantSettings } from "@/types/database";

export const ACTIVE_RESTAURANT_COOKIE = "menuqr-restaurant";

export interface RestaurantMembership {
  restaurant: Restaurant;
  role: RestaurantRole;
}

export interface RestaurantContext {
  memberships: RestaurantMembership[];
  active: Restaurant | null;
  role: RestaurantRole | null;
  settings: RestaurantSettings | null;
}

const EMPTY: RestaurantContext = { memberships: [], active: null, role: null, settings: null };

/**
 * Every restaurant the signed-in user belongs to, plus the one they're
 * currently working on. RLS means this query can only ever return the caller's
 * own venues — the cookie selects among them, it doesn't grant access.
 */
export async function getRestaurantContext(): Promise<RestaurantContext> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return EMPTY;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const { data: rows } = await supabase
    .from("restaurant_members")
    .select("role, restaurants:restaurant_id (*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const memberships: RestaurantMembership[] = (rows ?? [])
    .map((row) => {
      const restaurant = row.restaurants as unknown as Restaurant | null;
      return restaurant && !restaurant.deleted_at ? { restaurant, role: row.role } : null;
    })
    .filter((value): value is RestaurantMembership => value !== null);

  if (memberships.length === 0) return EMPTY;

  const requestedId = cookies().get(ACTIVE_RESTAURANT_COOKIE)?.value;
  const selected = memberships.find((m) => m.restaurant.id === requestedId) ?? memberships[0];
  if (!selected) return EMPTY;

  const { data: settings } = await supabase
    .from("restaurant_settings")
    .select("*")
    .eq("restaurant_id", selected.restaurant.id)
    .maybeSingle();

  return {
    memberships,
    active: selected.restaurant,
    role: selected.role,
    settings: settings ?? null,
  };
}
