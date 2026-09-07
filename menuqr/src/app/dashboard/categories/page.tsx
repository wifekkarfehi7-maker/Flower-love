import type { Metadata } from "next";

import { CategoriesView } from "@/components/menu/categories-view";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getRestaurantContext } from "@/lib/restaurants/get-restaurant-context";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].categories.title,
  robots: { index: false },
};

export default async function CategoriesPage() {
  const { active } = await getRestaurantContext();
  const supabase = getSupabaseServerClient();

  let categories: Category[] = [];
  const productCounts: Record<string, number> = {};

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
        .select("category_id")
        .eq("restaurant_id", active.id)
        .is("deleted_at", null),
    ]);

    categories = categoriesResult.data ?? [];
    for (const product of productsResult.data ?? []) {
      if (product.category_id) {
        productCounts[product.category_id] = (productCounts[product.category_id] ?? 0) + 1;
      }
    }
  }

  return <CategoriesView initialCategories={categories} productCounts={productCounts} />;
}
