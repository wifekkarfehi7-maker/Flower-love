"use client";

import { ChevronRight, Plus, Tags, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { formatPrice, localized } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { useRestaurant } from "@/lib/restaurants/provider";
import type { Category, Product } from "@/types/database";
import { ProductDialog } from "./product-dialog";

export function MenuOverviewView({
  initialCategories,
  initialProducts,
}: {
  initialCategories: Category[];
  initialProducts: Product[];
}) {
  const { t, locale } = useTranslation();
  const { restaurant, can } = useRestaurant();
  const canWrite = can("menu:write");

  const [products, setProducts] = React.useState(initialProducts);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [targetCategory, setTargetCategory] = React.useState<string | null>(null);

  React.useEffect(() => setProducts(initialProducts), [initialProducts]);

  const grouped = React.useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const product of products) {
      const key = product.category_id ?? "__none__";
      const list = map.get(key) ?? [];
      list.push(product);
      map.set(key, list);
    }
    return map;
  }, [products]);

  const uncategorized = grouped.get("__none__") ?? [];

  const openCreate = (categoryId: string | null) => {
    setEditing(null);
    setTargetCategory(categoryId);
    setDialogOpen(true);
  };

  const handleSaved = (saved: Product) => {
    setProducts((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved];
    });
  };

  const renderProduct = (product: Product) => (
    <li key={product.id}>
      <button
        type="button"
        disabled={!canWrite}
        onClick={() => {
          setEditing(product);
          setTargetCategory(product.category_id);
          setDialogOpen(true);
        }}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-start transition-colors hover:bg-muted disabled:cursor-default disabled:hover:bg-transparent"
      >
        <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-muted">
          {product.image_url ? (
            <Image src={product.image_url} alt="" fill sizes="36px" className="object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <UtensilsCrossed className="size-4" aria-hidden />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm">
          {localized(product, "name", locale, restaurant.default_language)}
        </span>
        {!product.is_available ? <Badge variant="neutral">{t.products.unavailable}</Badge> : null}
        <span className="shrink-0 text-sm font-medium tabular-nums">
          {formatPrice(product.price, restaurant.currency, locale)}
        </span>
      </button>
    </li>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.dashboard.menu}
        description={t.categories.subtitle}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/dashboard/categories">
                <Tags aria-hidden />
                {t.categories.title}
              </Link>
            </Button>
            {canWrite ? (
              <Button onClick={() => openCreate(null)}>
                <Plus aria-hidden />
                {t.products.newProduct}
              </Button>
            ) : null}
          </>
        }
      />

      {initialCategories.length === 0 && products.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={<Tags />}
            title={t.categories.emptyTitle}
            description={t.categories.emptyText}
            action={
              canWrite ? (
                <Button asChild>
                  <Link href="/dashboard/categories">
                    <Plus aria-hidden />
                    {t.categories.newCategory}
                  </Link>
                </Button>
              ) : null
            }
          />
        </div>
      ) : null}

      <div className="space-y-4">
        {initialCategories.map((category) => {
          const items = grouped.get(category.id) ?? [];
          return (
            <section key={category.id} className="surface p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="flex items-center gap-2 truncate text-sm font-semibold">
                    {localized(category, "name", locale, restaurant.default_language)}
                    {!category.is_active ? <Badge variant="neutral">{t.categories.hidden}</Badge> : null}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {items.length} {t.categories.productsInCategory}
                  </p>
                </div>
                {canWrite ? (
                  <Button variant="ghost" size="sm" onClick={() => openCreate(category.id)}>
                    <Plus aria-hidden />
                    {t.common.add}
                  </Button>
                ) : null}
              </div>

              {items.length > 0 ? (
                <ul className="mt-2 divide-y divide-border border-t border-border pt-1">{items.map(renderProduct)}</ul>
              ) : (
                <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  {t.products.emptyText}
                </p>
              )}
            </section>
          );
        })}

        {uncategorized.length > 0 ? (
          <section className="surface p-4">
            <h2 className="text-sm font-semibold">{t.products.noCategory}</h2>
            <ul className="mt-2 divide-y divide-border border-t border-border pt-1">
              {uncategorized.map(renderProduct)}
            </ul>
          </section>
        ) : null}
      </div>

      {products.length > 0 ? (
        <Button variant="ghost" asChild className="w-full sm:w-auto">
          <Link href="/dashboard/products">
            {t.products.title}
            <ChevronRight className="rtl-flip" aria-hidden />
          </Link>
        </Button>
      ) : null}

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        categories={initialCategories}
        defaultCategoryId={targetCategory}
        nextSortOrder={products.length + 1}
        onSaved={handleSaved}
      />
    </div>
  );
}
