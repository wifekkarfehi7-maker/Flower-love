"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";

import { ImageUpload } from "@/components/shared/image-upload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertText } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { useTranslation } from "@/lib/i18n/provider";
import { categoryToForm, formToCategory } from "@/lib/menu/mappers";
import { menuSchemas, type CategoryFormValues } from "@/lib/menu/schemas";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Category } from "@/types/database";
import { LocalizedFields } from "./localized-fields";

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  nextSortOrder,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  nextSortOrder: number;
  onSaved: (category: Category) => void;
}) {
  const { t } = useTranslation();
  const { restaurant } = useRestaurant();
  const toast = useToast();
  const [formError, setFormError] = React.useState<string | null>(null);

  const schema = React.useMemo(() => menuSchemas(t).category, [t]);
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: categoryToForm(category),
  });

  React.useEffect(() => {
    if (open) {
      form.reset(categoryToForm(category));
      setFormError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category]);

  const imageUrl = form.watch("image_url");
  const isActive = form.watch("is_active");
  const values = form.watch();

  const onSubmit = form.handleSubmit(async (submitted) => {
    setFormError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setFormError(t.auth.notConfiguredText);
      return;
    }

    const payload = formToCategory(submitted);

    const { data, error } = category
      ? await supabase.from("categories").update(payload).eq("id", category.id).select("*").single()
      : await supabase
          .from("categories")
          .insert({ ...payload, restaurant_id: restaurant.id, sort_order: nextSortOrder })
          .select("*")
          .single();

    if (error || !data) {
      setFormError(translateDataError(error?.message, t));
      return;
    }

    toast({ title: t.common.success, variant: "success" });
    onSaved(data);
    onOpenChange(false);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? t.categories.editCategory : t.categories.newCategory}</DialogTitle>
          <DialogDescription>{t.categories.subtitle}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="contents">
          <DialogBody className="space-y-5 pb-4">
            {formError ? (
              <Alert variant="destructive">
                <AlertText className="text-foreground">{formError}</AlertText>
              </Alert>
            ) : null}

            <LocalizedFields
              register={form.register}
              errors={form.formState.errors}
              values={values}
              defaultLocale={restaurant.default_language}
            />

            <ImageUpload
              value={imageUrl}
              onChange={(url) => form.setValue("image_url", url, { shouldDirty: true })}
              restaurantId={restaurant.id}
              kind="category"
              label={t.common.image}
            />

            <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <span className="text-sm font-medium">{t.categories.visible}</span>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => form.setValue("is_active", checked, { shouldDirty: true })}
              />
            </label>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t.common.cancel}
            </Button>
            <Button type="submit" loading={form.formState.isSubmitting}>
              {t.common.save}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
