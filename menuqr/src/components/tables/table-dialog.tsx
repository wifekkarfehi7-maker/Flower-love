"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import * as React from "react";
import { useForm } from "react-hook-form";

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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { useTranslation } from "@/lib/i18n/provider";
import { formToTable, tableToForm } from "@/lib/menu/mappers";
import { menuSchemas, type TableFormValues } from "@/lib/menu/schemas";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { RestaurantTable } from "@/types/database";

export function TableDialog({
  open,
  onOpenChange,
  table,
  nextSortOrder,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: RestaurantTable | null;
  nextSortOrder: number;
  onSaved: (table: RestaurantTable) => void;
}) {
  const { t } = useTranslation();
  const { restaurant } = useRestaurant();
  const toast = useToast();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [identifierEdited, setIdentifierEdited] = React.useState(false);

  const schema = React.useMemo(() => menuSchemas(t).table, [t]);
  const form = useForm<TableFormValues>({ resolver: zodResolver(schema), defaultValues: tableToForm(table) });

  React.useEffect(() => {
    if (!open) return;
    form.reset(tableToForm(table));
    setFormError(null);
    setIdentifierEdited(Boolean(table));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, table]);

  const isActive = form.watch("is_active");

  const onSubmit = form.handleSubmit(async (submitted) => {
    setFormError(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setFormError(t.auth.notConfiguredText);
      return;
    }

    const payload = formToTable(submitted);

    // The identifier is baked into printed QR links, so it is set once.
    const { data, error } = table
      ? await supabase
          .from("restaurant_tables")
          .update({ name: payload.name, zone: payload.zone, seats: payload.seats, is_active: payload.is_active })
          .eq("id", table.id)
          .select("*")
          .single()
      : await supabase
          .from("restaurant_tables")
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
          <DialogTitle>{table ? t.tables.editTable : t.tables.newTable}</DialogTitle>
          <DialogDescription>{t.tables.subtitle}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="contents">
          <DialogBody className="space-y-4 py-4">
            {formError ? (
              <Alert variant="destructive">
                <AlertText className="text-foreground">{formError}</AlertText>
              </Alert>
            ) : null}

            <Field label={t.tables.tableName} htmlFor="name" error={form.formState.errors.name?.message} required>
              <Input
                id="name"
                placeholder={t.tables.tableNamePlaceholder}
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name", {
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                    if (!identifierEdited) {
                      form.setValue("identifier", slugify(event.target.value).slice(0, 39));
                    }
                  },
                })}
              />
            </Field>

            <Field
              label={t.tables.identifier}
              htmlFor="identifier"
              error={form.formState.errors.identifier?.message}
              hint={t.tables.identifierHelp}
              required
            >
              <Input
                id="identifier"
                dir="ltr"
                className="font-mono text-sm"
                disabled={Boolean(table)}
                aria-invalid={Boolean(form.formState.errors.identifier)}
                {...form.register("identifier", { onChange: () => setIdentifierEdited(true) })}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t.tables.zone} htmlFor="zone">
                <Input id="zone" placeholder={t.tables.zonePlaceholder} {...form.register("zone")} />
              </Field>
              <Field label={t.tables.seats} htmlFor="seats" error={form.formState.errors.seats?.message}>
                <Input id="seats" inputMode="numeric" dir="ltr" {...form.register("seats")} />
              </Field>
            </div>

            <label className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
              <span className="text-sm font-medium">{t.common.active}</span>
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
