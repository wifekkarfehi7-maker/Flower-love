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
import { Input } from "@/components/ui/input";
import { Alert, AlertText, Field } from "@/components/ui/misc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { currencySymbol, localized } from "@/lib/i18n/format";
import { useTranslation } from "@/lib/i18n/provider";
import { formToProduct, NO_CATEGORY_VALUE, productToForm } from "@/lib/menu/mappers";
import { menuSchemas, type ProductFormValues } from "@/lib/menu/schemas";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Category, Product } from "@/types/database";
import { LocalizedFields } from "./localized-fields";
import { ProductOptionsEditor } from "./product-options-editor";

export function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  defaultCategoryId,
  nextSortOrder,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  defaultCategoryId?: string | null;
  nextSortOrder: number;
  onSaved: (product: Product) => void;
}) {
  const { t, locale } = useTranslation();
  const { restaurant } = useRestaurant();
  const toast = useToast();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState("details");

  const schema = React.useMemo(() => menuSchemas(t).product, [t]);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(schema),
    defaultValues: productToForm(product),
  });

  React.useEffect(() => {
    if (!open) return;
    const initial = productToForm(product);
    if (!product && defaultCategoryId) initial.category_id = defaultCategoryId;
    form.reset(initial);
    setFormError(null);
    setTab("details");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, product, defaultCategoryId]);

  const values = form.watch();

  const onSubmit = form.handleSubmit(async (submitted) => {
    setFormError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setFormError(t.auth.notConfiguredText);
      return;
    }

    const payload = formToProduct(submitted);

    const { data, error } = product
      ? await supabase.from("products").update(payload).eq("id", product.id).select("*").single()
      : await supabase
          .from("products")
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
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{product ? t.products.editProduct : t.products.newProduct}</DialogTitle>
          <DialogDescription>{t.products.subtitle}</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="contents">
          <div className="px-5 pb-1">
            <TabsList>
              <TabsTrigger value="details">{t.restaurant.tabGeneral}</TabsTrigger>
              <TabsTrigger value="options" disabled={!product}>
                {t.products.optionsTitle}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="mt-0 contents">
            <form onSubmit={onSubmit} noValidate className="contents">
              <DialogBody className="space-y-5 py-4">
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

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={t.products.category} htmlFor="category_id">
                    <Select
                      value={values.category_id}
                      onValueChange={(value) => form.setValue("category_id", value, { shouldDirty: true })}
                    >
                      <SelectTrigger id="category_id">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_CATEGORY_VALUE}>{t.products.noCategory}</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {localized(category, "name", locale, restaurant.default_language)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>

                  <Field
                    label={`${t.products.price} (${currencySymbol(restaurant.currency, locale)})`}
                    htmlFor="price"
                    error={form.formState.errors.price?.message}
                    required
                  >
                    <Input
                      id="price"
                      inputMode="decimal"
                      dir="ltr"
                      placeholder="12.500"
                      aria-invalid={Boolean(form.formState.errors.price)}
                      {...form.register("price")}
                    />
                  </Field>
                </div>

                <Field
                  label={t.products.compareAtPrice}
                  htmlFor="compare_at_price"
                  error={form.formState.errors.compare_at_price?.message}
                  hint={t.common.optional}
                >
                  <Input
                    id="compare_at_price"
                    inputMode="decimal"
                    dir="ltr"
                    {...form.register("compare_at_price")}
                  />
                </Field>

                <ImageUpload
                  value={values.image_url}
                  onChange={(url) => form.setValue("image_url", url, { shouldDirty: true })}
                  restaurantId={restaurant.id}
                  kind="product"
                  label={t.products.image}
                />

                <div className="space-y-2">
                  <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                    <span className="text-sm font-medium">{t.products.available}</span>
                    <Switch
                      checked={values.is_available}
                      onCheckedChange={(checked) => form.setValue("is_available", checked, { shouldDirty: true })}
                    />
                  </label>
                  <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
                    <span>
                      <span className="block text-sm font-medium">{t.products.featured}</span>
                      <span className="block text-xs text-muted-foreground">{t.products.featuredHelp}</span>
                    </span>
                    <Switch
                      checked={values.is_featured}
                      onCheckedChange={(checked) => form.setValue("is_featured", checked, { shouldDirty: true })}
                    />
                  </label>
                </div>
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
          </TabsContent>

          <TabsContent value="options" className="mt-0 contents">
            <DialogBody className="py-4">
              {product ? <ProductOptionsEditor product={product} /> : null}
            </DialogBody>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t.common.close}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
