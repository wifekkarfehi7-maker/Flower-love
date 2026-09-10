import { unstable_cache } from "next/cache";

import { getSupabaseAnonClient } from "@/lib/supabase/anon";
import type {
  Category,
  Product,
  ProductOption,
  ProductOptionGroup,
  Restaurant,
  RestaurantSettings,
} from "@/types/database";

export interface OptionGroupWithOptions extends ProductOptionGroup {
  options: ProductOption[];
}

export interface PublicMenu {
  restaurant: Restaurant;
  settings: RestaurantSettings | null;
  categories: Category[];
  products: Product[];
  optionGroupsByProduct: Record<string, OptionGroupWithOptions[]>;
}

export function menuCacheTag(slug: string) {
  return `menu:${slug}`;
}

async function fetchPublicMenu(slug: string): Promise<PublicMenu | null> {
  const supabase = getSupabaseAnonClient();
  if (!supabase) return null;

  const { data: restaurant } = await supabase.from("restaurants").select("*").eq("slug", slug).maybeSingle();
  if (!restaurant) return null;

  const [settingsResult, categoriesResult, productsResult, groupsResult, optionsResult] = await Promise.all([
    supabase.from("restaurant_settings").select("*").eq("restaurant_id", restaurant.id).maybeSingle(),
    supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .is("deleted_at", null)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_option_groups")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_options")
      .select("*")
      .eq("restaurant_id", restaurant.id)
      .eq("is_available", true)
      .order("sort_order", { ascending: true }),
  ]);

  const optionsByGroup = new Map<string, ProductOption[]>();
  for (const option of optionsResult.data ?? []) {
    const list = optionsByGroup.get(option.group_id) ?? [];
    list.push(option);
    optionsByGroup.set(option.group_id, list);
  }

  const optionGroupsByProduct: Record<string, OptionGroupWithOptions[]> = {};
  for (const group of groupsResult.data ?? []) {
    const withOptions: OptionGroupWithOptions = { ...group, options: optionsByGroup.get(group.id) ?? [] };
    if (withOptions.options.length === 0) continue;
    const list = optionGroupsByProduct[group.product_id] ?? [];
    list.push(withOptions);
    optionGroupsByProduct[group.product_id] = list;
  }

  return {
    restaurant,
    settings: settingsResult.data ?? null,
    categories: categoriesResult.data ?? [],
    products: productsResult.data ?? [],
    optionGroupsByProduct,
  };
}

/**
 * Everything a guest's menu needs, in one cached read. RLS decides visibility:
 * an unpublished or suspended venue simply returns nothing.
 *
 * The result is cached under a per-venue tag and invalidated by
 * /api/menu/revalidate as soon as its owner saves a change, so a price edit is
 * live immediately while repeat scans still hit the cache. The time-based
 * window is a backstop for edits made outside the dashboard.
 */
export async function getPublicMenu(slug: string): Promise<PublicMenu | null> {
  return unstable_cache(fetchPublicMenu, ["public-menu"], {
    revalidate: 300,
    tags: [menuCacheTag(slug)],
  })(slug);
}
