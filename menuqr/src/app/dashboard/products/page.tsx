import type { Metadata } from "next";

import { ProductsView } from "@/components/menu/products-view";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getRestaurantContext } from "@/lib/restaurants/get-restaurant-context";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/types/database";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].products.title,
  robots: { index: false },
};

export default async function ProductsPage() {
  const { active } = await getRestaurantContext();
  const supabase = getSupabaseServerClient();

  let products: Product[] = [];
  let categories: Category[] = [];

  if (active && supabase) {
    const [productsResult, categoriesResult] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("restaurant_id", active.id)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true }),
      supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", active.id)
        .is("deleted_at", null)
        .order("sort_order", { ascending: true }),
    ]);

    products = productsResult.data ?? [];
    categories = categoriesResult.data ?? [];
  }

  return <ProductsView initialProducts={products} categories={categories} />;
}
