"use client";

import { Copy, MoreVertical, Pencil, Plus, Search, Star, Trash2, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import * as React from "react";

import { DragHandle, SortableList } from "@/components/shared/sortable-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { formatPrice, localized } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { notifyMenuChanged } from "@/lib/menu/revalidate";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Category, Product } from "@/types/database";
import { ProductDialog } from "./product-dialog";

const ALL = "all";

export function ProductsView({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories: Category[];
}) {
  const { t, locale } = useTranslation();
  const { restaurant, can } = useRestaurant();
  const toast = useToast();
  const canWrite = can("menu:write");
  const canToggle = can("availability:toggle");

  const [products, setProducts] = React.useState(initialProducts);
  const [search, setSearch] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState(ALL);
  const [availabilityFilter, setAvailabilityFilter] = React.useState(ALL);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [deleting, setDeleting] = React.useState<Product | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  React.useEffect(() => setProducts(initialProducts), [initialProducts]);

  const categoryById = React.useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (categoryFilter !== ALL && product.category_id !== categoryFilter) return false;
      if (availabilityFilter === "available" && !product.is_available) return false;
      if (availabilityFilter === "unavailable" && product.is_available) return false;
      if (!term) return true;
      return [product.name_ar, product.name_fr, product.name_en].some((name) =>
        name?.toLowerCase().includes(term)
      );
    });
  }, [products, search, categoryFilter, availabilityFilter]);

  const isFiltered = search.trim() !== "" || categoryFilter !== ALL || availabilityFilter !== ALL;

  const handleSaved = (saved: Product) => {
    setProducts((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved];
    });
    notifyMenuChanged(restaurant.slug);
  };

  const persistOrder = async (ordered: Product[]) => {
    const previous = products;
    setProducts(ordered);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const updates = ordered
      .map((product, index) => ({ product, sortOrder: index + 1 }))
      .filter(({ product, sortOrder }) => product.sort_order !== sortOrder);

    const results = await Promise.all(
      updates.map(({ product, sortOrder }) =>
        supabase.from("products").update({ sort_order: sortOrder }).eq("id", product.id)
      )
    );

    if (results.some((result) => result.error)) {
      setProducts(previous);
      toast({ title: t.errors.saveFailed, variant: "error" });
      return;
    }

    setProducts(ordered.map((product, index) => ({ ...product, sort_order: index + 1 })));
    notifyMenuChanged(restaurant.slug);
  };

  const toggleAvailability = async (product: Product) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const next = !product.is_available;
    setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, is_available: next } : item)));

    // Staff have no UPDATE grant on products; this RPC is the one thing they may change.
    const { error } = await supabase.rpc("set_product_availability", { p_product: product.id, p_available: next });

    if (error) {
      setProducts((current) =>
        current.map((item) => (item.id === product.id ? { ...item, is_available: product.is_available } : item))
      );
      toast({ title: translateDataError(error.message, t), variant: "error" });
      return;
    }

    notifyMenuChanged(restaurant.slug);
  };

  const duplicate = async (product: Product) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const { id, created_at, updated_at, ...rest } = product;
    void id;
    void created_at;
    void updated_at;

    const { data, error } = await supabase
      .from("products")
      .insert({ ...rest, sort_order: products.length + 1, is_featured: false })
      .select("*")
      .single();

    if (error || !data) {
      toast({ title: translateDataError(error?.message, t), variant: "error" });
      return;
    }

    setProducts((current) => [...current, data]);
    notifyMenuChanged(restaurant.slug);
    toast({ title: t.products.duplicated, variant: "success" });
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setDeleteBusy(true);
    const { error } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString(), is_available: false })
      .eq("id", deleting.id);
    setDeleteBusy(false);

    if (error) {
      toast({ title: translateDataError(error.message, t), variant: "error" });
      return;
    }

    setProducts((current) => current.filter((item) => item.id !== deleting.id));
    setDeleting(null);
    notifyMenuChanged(restaurant.slug);
    toast({ title: t.common.success, variant: "success" });
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const renderRow = (product: Product, handle?: React.ReactNode) => {
    const category = product.category_id ? categoryById.get(product.category_id) : null;

    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-card",
          !product.is_available && "opacity-70"
        )}
      >
        {handle}

        <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
          {product.image_url ? (
            <Image src={product.image_url} alt="" fill sizes="48px" className="object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-muted-foreground">
              <UtensilsCrossed className="size-5" aria-hidden />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-sm font-medium">
            {localized(product, "name", locale, restaurant.default_language)}
            {product.is_featured ? <Star className="size-3.5 shrink-0 fill-accent text-accent" aria-hidden /> : null}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {category ? localized(category, "name", locale, restaurant.default_language) : t.products.noCategory}
          </p>
        </div>

        <div className="shrink-0 text-end">
          <p className="text-sm font-semibold tabular-nums">
            {formatPrice(product.price, restaurant.currency, locale)}
          </p>
          {product.compare_at_price ? (
            <p className="text-xs text-muted-foreground line-through tabular-nums">
              {formatPrice(product.compare_at_price, restaurant.currency, locale)}
            </p>
          ) : null}
        </div>

        {canToggle ? (
          <Switch
            checked={product.is_available}
            onCheckedChange={() => void toggleAvailability(product)}
            aria-label={t.products.available}
            className="shrink-0"
          />
        ) : (
          <Badge variant={product.is_available ? "success" : "neutral"}>
            {product.is_available ? t.products.available : t.products.unavailable}
          </Badge>
        )}

        {canWrite ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="iconSm" aria-label={t.common.actions}>
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  setEditing(product);
                  setDialogOpen(true);
                }}
              >
                <Pencil aria-hidden />
                {t.common.edit}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => void duplicate(product)}>
                <Copy aria-hidden />
                {t.common.duplicate}
              </DropdownMenuItem>
              <DropdownMenuItem destructive onSelect={() => setDeleting(product)}>
                <Trash2 aria-hidden />
                {t.common.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.products.title}
        description={t.products.subtitle}
        actions={
          canWrite ? (
            <Button onClick={openCreate}>
              <Plus aria-hidden />
              {t.products.newProduct}
            </Button>
          ) : null
        }
      />

      {products.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" aria-hidden />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.common.searchPlaceholder}
              className="ps-9"
              aria-label={t.common.search}
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="sm:w-48" aria-label={t.products.filterCategory}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t.products.filterAll}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {localized(category, "name", locale, restaurant.default_language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="sm:w-40" aria-label={t.common.status}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t.common.all}</SelectItem>
              <SelectItem value="available">{t.products.filterAvailable}</SelectItem>
              <SelectItem value="unavailable">{t.products.filterUnavailable}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {products.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={<UtensilsCrossed />}
            title={t.products.emptyTitle}
            description={t.products.emptyText}
            action={
              canWrite ? (
                <Button onClick={openCreate}>
                  <Plus aria-hidden />
                  {t.products.newProduct}
                </Button>
              ) : null
            }
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="surface">
          <EmptyState icon={<Search />} title={t.products.emptyFilteredTitle} description={t.products.emptyFilteredText} />
        </div>
      ) : isFiltered || !canWrite ? (
        <div className="space-y-2">{filtered.map((product) => <div key={product.id}>{renderRow(product)}</div>)}</div>
      ) : (
        <SortableList items={filtered} onReorder={(ordered) => void persistOrder(ordered)} className="space-y-2">
          {(product, handle) => renderRow(product, <DragHandle handle={handle} label={t.categories.reorderHint} />)}
        </SortableList>
      )}

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        categories={categories}
        defaultCategoryId={categoryFilter !== ALL ? categoryFilter : null}
        nextSortOrder={products.length + 1}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t.products.deleteTitle}
        description={t.products.deleteText}
        confirmLabel={t.common.delete}
        loading={deleteBusy}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
