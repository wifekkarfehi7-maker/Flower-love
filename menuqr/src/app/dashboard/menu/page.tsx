import type { Metadata } from "next";

import { MenuOverviewView } from "@/components/menu/menu-overview-view";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getRestaurantContext } from "@/lib/restaurants/get-restaurant-context";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/types/database";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].dashboard.menu,
  robots: { index: false },
};

export default async function MenuPage() {
  const { active } = await getRestaurantContext();
  const supabase = getSupabaseServerClient();

  let categories: Category[] = [];
  let products: Product[] = [];

  if (active && supabase) {
    const [categoriesResult, productsResult] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", active.id)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true }),
      supabase
        .from("products")
        .select("*")
        .eq("restaurant_id", active.id)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true }),
    ]);

    categories = categoriesResult.data ?? [];
    products = productsResult.data ?? [];
  }

  return <MenuOverviewView initialCategories={categories} initialProducts={products} />;
}
