"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertText } from "@/components/ui/misc";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { translateDataError } from "@/lib/auth/error-map";
import { useTranslation } from "@/lib/i18n/provider";
import { DEFAULT_OPENING_HOURS, parseOpeningHours, type OpeningHoursEntry } from "@/lib/menu/opening-hours";
import { notifyMenuChanged } from "@/lib/menu/revalidate";
import { useRestaurant } from "@/lib/restaurants/provider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function RestaurantHoursForm() {
  const { t } = useTranslation();
  const { restaurant, settings, setSettings, can } = useRestaurant();
  const toast = useToast();
  const canWrite = can("restaurant:write");

  const initial = React.useMemo(() => {
    const parsed = parseOpeningHours(settings?.opening_hours);
    if (parsed.length === 7) return parsed;
    return DEFAULT_OPENING_HOURS.map((entry) => parsed.find((row) => row.day === entry.day) ?? entry);
  }, [settings?.opening_hours]);

  const [hours, setHours] = React.useState<OpeningHoursEntry[]>(initial);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => setHours(initial), [initial]);

  const dayNames = [
    t.days.sunday,
    t.days.monday,
    t.days.tuesday,
    t.days.wednesday,
    t.days.thursday,
    t.days.friday,
    t.days.saturday,
  ];

  const update = (day: number, patch: Partial<OpeningHoursEntry>) => {
    setHours((current) => current.map((entry) => (entry.day === day ? { ...entry, ...patch } : entry)));
  };

  const save = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setSaving(true);
    setError(null);
    const { data, error: updateError } = await supabase
      .from("restaurant_settings")
      .update({ opening_hours: hours })
      .eq("restaurant_id", restaurant.id)
      .select("*")
      .single();
    setSaving(false);

    if (updateError || !data) {
      setError(translateDataError(updateError?.message, t));
      return;
    }

    setSettings(data);
    notifyMenuChanged(restaurant.slug);
    toast({ title: t.restaurant.saved, variant: "success" });
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">{t.restaurant.hoursHelp}</p>

      {error ? (
        <Alert variant="destructive">
          <AlertText className="text-foreground">{error}</AlertText>
        </Alert>
      ) : null}

      <ul className="divide-y divide-border rounded-lg border border-border">
        {hours.map((entry) => (
          <li key={entry.day} className="flex flex-wrap items-center gap-3 p-3">
            <span className="w-24 shrink-0 text-sm font-medium">{dayNames[entry.day]}</span>

            {entry.closed ? (
              <span className="flex-1 text-sm text-muted-foreground">{t.restaurant.closed}</span>
            ) : (
              <div className="flex flex-1 items-center gap-2" dir="ltr">
                <Input
                  type="time"
                  value={entry.open}
                  disabled={!canWrite}
                  onChange={(event) => update(entry.day, { open: event.target.value })}
                  aria-label={`${dayNames[entry.day]} ${t.restaurant.openTime}`}
                  className="h-9 w-32"
                />
                <span className="text-muted-foreground">–</span>
                <Input
                  type="time"
                  value={entry.close}
                  disabled={!canWrite}
                  onChange={(event) => update(entry.day, { close: event.target.value })}
                  aria-label={`${dayNames[entry.day]} ${t.restaurant.closeTime}`}
                  className="h-9 w-32"
                />
              </div>
            )}

            <label className="flex shrink-0 items-center gap-2 text-sm">
              <span className="text-muted-foreground">{t.restaurant.closed}</span>
              <Switch
                checked={entry.closed}
                disabled={!canWrite}
                onCheckedChange={(checked) => update(entry.day, { closed: checked })}
                aria-label={`${dayNames[entry.day]} ${t.restaurant.closed}`}
              />
            </label>
          </li>
        ))}
      </ul>

      {canWrite ? (
        <Button loading={saving} onClick={() => void save()}>
          {t.common.save}
        </Button>
      ) : null}
    </div>
  );
}
