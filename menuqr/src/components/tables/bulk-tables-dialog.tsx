"use client";

import * as React from "react";

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
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { useTranslation } from "@/lib/i18n/provider";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import type { RestaurantTable } from "@/types/database";

/** Most venues number their tables, so creating 12 at once beats 12 dialogs. */
export function BulkTablesDialog({
  open,
  onOpenChange,
  existingIdentifiers,
  nextSortOrder,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingIdentifiers: string[];
  nextSortOrder: number;
  onCreated: (tables: RestaurantTable[]) => void;
}) {
  const { t } = useTranslation();
  const { restaurant } = useRestaurant();
  const toast = useToast();

  const [prefix, setPrefix] = React.useState("Table");
  const [count, setCount] = React.useState("5");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (open) {
      setPrefix("Table");
      setCount("5");
      setError(null);
    }
  }, [open]);

  const create = async () => {
    const total = Number(count);
    if (!prefix.trim() || !Number.isInteger(total) || total < 1 || total > 50) {
      setError(t.validation.required);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const taken = new Set(existingIdentifiers);
    const rows: { name: string; identifier: string }[] = [];
    let index = 1;

    while (rows.length < total && index < total + 200) {
      const identifier = `${slugify(prefix) || "table"}-${index}`;
      if (!taken.has(identifier)) {
        rows.push({ name: `${prefix.trim()} ${index}`, identifier });
        taken.add(identifier);
      }
      index += 1;
    }

    setBusy(true);
    setError(null);
    const { data, error: insertError } = await supabase
      .from("restaurant_tables")
      .insert(
        rows.map((row, position) => ({
          restaurant_id: restaurant.id,
          name: row.name,
          identifier: row.identifier,
          sort_order: nextSortOrder + position,
        }))
      )
      .select("*");
    setBusy(false);

    if (insertError || !data) {
      setError(translateDataError(insertError?.message, t));
      return;
    }

    onCreated(data);
    onOpenChange(false);
    toast({ title: t.common.success, variant: "success" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.tables.addBulk}</DialogTitle>
          <DialogDescription>{t.tables.bulkHelp}</DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4 py-4">
          {error ? (
            <Alert variant="destructive">
              <AlertText className="text-foreground">{error}</AlertText>
            </Alert>
          ) : null}

          <Field label={t.tables.bulkPrefix} htmlFor="bulk-prefix">
            <Input id="bulk-prefix" value={prefix} onChange={(event) => setPrefix(event.target.value)} />
          </Field>

          <Field label={t.tables.bulkCount} htmlFor="bulk-count">
            <Input
              id="bulk-count"
              type="number"
              min={1}
              max={50}
              dir="ltr"
              value={count}
              onChange={(event) => setCount(event.target.value)}
            />
          </Field>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t.common.cancel}
          </Button>
          <Button loading={busy} onClick={() => void create()}>
            {t.common.create}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
