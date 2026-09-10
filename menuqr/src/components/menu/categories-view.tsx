"use client";

import { Eye, EyeOff, MoreVertical, Pencil, Plus, Tags, Trash2 } from "lucide-react";
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
import { EmptyState, PageHeader } from "@/components/ui/misc";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { localized } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { notifyMenuChanged } from "@/lib/menu/revalidate";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Category } from "@/types/database";
import { CategoryDialog } from "./category-dialog";

export function CategoriesView({
  initialCategories,
  productCounts,
}: {
  initialCategories: Category[];
  productCounts: Record<string, number>;
}) {
  const { t, locale } = useTranslation();
  const { restaurant, can } = useRestaurant();
  const toast = useToast();
  const canWrite = can("menu:write");

  const [categories, setCategories] = React.useState(initialCategories);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [deleting, setDeleting] = React.useState<Category | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  React.useEffect(() => setCategories(initialCategories), [initialCategories]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setDialogOpen(true);
  };

  const handleSaved = (saved: Category) => {
    setCategories((current) => {
      const exists = current.some((item) => item.id === saved.id);
      return exists ? current.map((item) => (item.id === saved.id ? saved : item)) : [...current, saved];
    });
    notifyMenuChanged(restaurant.slug);
  };

  const persistOrder = async (ordered: Category[]) => {
    const previous = categories;
    setCategories(ordered);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const updates = ordered
      .map((category, index) => ({ category, sortOrder: index + 1 }))
      .filter(({ category, sortOrder }) => category.sort_order !== sortOrder);

    const results = await Promise.all(
      updates.map(({ category, sortOrder }) =>
        supabase.from("categories").update({ sort_order: sortOrder }).eq("id", category.id)
      )
    );

    if (results.some((result) => result.error)) {
      setCategories(previous);
      toast({ title: t.errors.saveFailed, variant: "error" });
      return;
    }

    setCategories(ordered.map((category, index) => ({ ...category, sort_order: index + 1 })));
    notifyMenuChanged(restaurant.slug);
  };

  const toggleVisibility = async (category: Category) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const next = !category.is_active;
    setCategories((current) =>
      current.map((item) => (item.id === category.id ? { ...item, is_active: next } : item))
    );

    const { error } = await supabase.from("categories").update({ is_active: next }).eq("id", category.id);
    if (error) {
      setCategories((current) =>
        current.map((item) => (item.id === category.id ? { ...item, is_active: category.is_active } : item))
      );
      toast({ title: translateDataError(error.message, t), variant: "error" });
      return;
    }

    notifyMenuChanged(restaurant.slug);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setDeleteBusy(true);
    // Soft delete: printed QR codes and analytics keep pointing at real rows.
    const { error } = await supabase
      .from("categories")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", deleting.id);
    setDeleteBusy(false);

    if (error) {
      toast({ title: translateDataError(error.message, t), variant: "error" });
      return;
    }

    setCategories((current) => current.filter((item) => item.id !== deleting.id));
    setDeleting(null);
    notifyMenuChanged(restaurant.slug);
    toast({ title: t.common.success, variant: "success" });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t.categories.title}
        description={t.categories.subtitle}
        actions={
          canWrite ? (
            <Button onClick={openCreate}>
              <Plus aria-hidden />
              {t.categories.newCategory}
            </Button>
          ) : null
        }
      />

      {categories.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={<Tags />}
            title={t.categories.emptyTitle}
            description={t.categories.emptyText}
            action={
              canWrite ? (
                <Button onClick={openCreate}>
                  <Plus aria-hidden />
                  {t.categories.newCategory}
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <>
          {canWrite ? <p className="text-xs text-muted-foreground">{t.categories.reorderHint}</p> : null}

          <SortableList items={categories} onReorder={(ordered) => void persistOrder(ordered)} disabled={!canWrite} className="space-y-2">
            {(category, handle) => (
              <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-card">
                {canWrite ? <DragHandle handle={handle} label={t.categories.reorderHint} /> : null}

                <div className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {category.image_url ? (
                    <Image src={category.image_url} alt="" fill sizes="44px" className="object-cover" />
                  ) : (
                    <span className="flex size-full items-center justify-center text-muted-foreground">
                      <Tags className="size-5" aria-hidden />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {localized(category, "name", locale, restaurant.default_language)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {productCounts[category.id] ?? 0} {t.categories.productsInCategory}
                  </p>
                </div>

                {!category.is_active ? (
                  <Badge variant="neutral" className="hidden sm:inline-flex">
                    {t.categories.hidden}
                  </Badge>
                ) : null}

                {canWrite ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="iconSm" aria-label={t.common.actions}>
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onSelect={() => openEdit(category)}>
                        <Pencil aria-hidden />
                        {t.common.edit}
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => void toggleVisibility(category)}>
                        {category.is_active ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
                        {category.is_active ? t.categories.hidden : t.categories.visible}
                      </DropdownMenuItem>
                      <DropdownMenuItem destructive onSelect={() => setDeleting(category)}>
                        <Trash2 aria-hidden />
                        {t.common.delete}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null}
              </div>
            )}
          </SortableList>
        </>
      )}

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={editing}
        nextSortOrder={categories.length + 1}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t.categories.deleteTitle}
        description={t.categories.deleteText}
        confirmLabel={t.common.delete}
        loading={deleteBusy}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
