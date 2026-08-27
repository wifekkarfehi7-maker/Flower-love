"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { SaveIndicator } from "../save-indicator";
import { replaceEvents, type EventInput } from "@/lib/invitations/client";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { SaveStatus } from "@/hooks/use-invitation-autosave";
import type { InvitationRow } from "@/types/database";
import type { EventType } from "@/types/invitation";

const STRINGS = {
  ar: {
    title: "التاريخ والمناسبات",
    description: "حدد تاريخ الزفاف الرئيسي، ثم أضف تفاصيل كل مناسبة (عقد القران، الزفاف، العشاء...).",
    weddingDate: "تاريخ الزفاف",
    weddingTime: "وقت الزفاف",
    events: "المناسبات",
    addEvent: "إضافة مناسبة",
    eventName: "اسم المناسبة",
    date: "التاريخ",
    time: "الوقت",
    location: "اسم الموقع",
    locationUrl: "رابط خرائط جوجل",
    remove: "حذف",
    types: { aqd: "عقد القران", wedding: "حفل الزفاف", dinner: "حفل العشاء", reception: "الاستقبال", other: "أخرى" },
  },
  fr: {
    title: "Date et événements",
    description: "Définissez la date principale du mariage, puis ajoutez chaque événement (contrat, mariage, dîner...).",
    weddingDate: "Date du mariage",
    weddingTime: "Heure du mariage",
    events: "Événements",
    addEvent: "Ajouter un événement",
    eventName: "Nom de l'événement",
    date: "Date",
    time: "Heure",
    location: "Nom du lieu",
    locationUrl: "Lien Google Maps",
    remove: "Supprimer",
    types: { aqd: "Contrat de mariage", wedding: "Mariage", dinner: "Dîner", reception: "Réception", other: "Autre" },
  },
  en: {
    title: "Date & events",
    description: "Set the main wedding date, then add details for each event (marriage contract, wedding, dinner...).",
    weddingDate: "Wedding date",
    weddingTime: "Wedding time",
    events: "Events",
    addEvent: "Add event",
    eventName: "Event name",
    date: "Date",
    time: "Time",
    location: "Venue name",
    locationUrl: "Google Maps link",
    remove: "Remove",
    types: { aqd: "Marriage contract", wedding: "Wedding", dinner: "Dinner", reception: "Reception", other: "Other" },
  },
};

let tempId = 0;

export function DateEventsStep({
  invitation,
  events,
  onPatchInvitation,
  onEventsChange,
}: {
  invitation: InvitationRow;
  events: (EventInput & { id: string })[];
  onPatchInvitation: (fields: Partial<InvitationRow>) => void;
  onEventsChange: (events: (EventInput & { id: string })[]) => void;
}) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  function persist(next: (EventInput & { id: string })[]) {
    onEventsChange(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveStatus("idle");
    saveTimer.current = setTimeout(async () => {
      setSaveStatus("saving");
      const result = await replaceEvents(invitation.id, next);
      setSaveStatus(result.error ? "error" : "saved");
    }, 700);
  }

  function updateEvent(id: string, patch: Partial<EventInput>) {
    persist(events.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  function addEvent() {
    persist([
      ...events,
      {
        id: `temp-${tempId++}`,
        type: "wedding",
        name: t.types.wedding,
        date: invitation.wedding_date,
        time: invitation.wedding_time,
        locationName: null,
        locationUrl: null,
      },
    ]);
  }

  function removeEvent(id: string) {
    persist(events.filter((e) => e.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-xl font-bold text-ink-900">{t.title}</h2>
        <SaveIndicator status={saveStatus} />
      </div>
      <p className="mt-1 text-sm text-ink-500">{t.description}</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <Label>{t.weddingDate}</Label>
          <Input
            type="date"
            dir="ltr"
            className="text-start"
            value={invitation.wedding_date ?? ""}
            onChange={(e) => onPatchInvitation({ wedding_date: e.target.value || null })}
          />
        </div>
        <div>
          <Label>{t.weddingTime}</Label>
          <Input
            type="time"
            dir="ltr"
            className="text-start"
            value={invitation.wedding_time ?? ""}
            onChange={(e) => onPatchInvitation({ wedding_time: e.target.value || null })}
          />
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between">
          <Label className="mb-0">{t.events}</Label>
          <Button type="button" variant="outline" size="sm" onClick={addEvent}>
            <Plus className="h-3.5 w-3.5" />
            {t.addEvent}
          </Button>
        </div>

        <div className="mt-3 flex flex-col gap-4">
          {events.map((event) => (
            <div key={event.id} className="rounded-xl border border-ink-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="grid flex-1 gap-3 sm:grid-cols-2">
                  <Select value={event.type} onChange={(e) => updateEvent(event.id, { type: e.target.value as EventType })}>
                    {Object.entries(t.types).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                  <Input placeholder={t.eventName} value={event.name} onChange={(e) => updateEvent(event.id, { name: e.target.value })} />
                  <Input
                    type="date"
                    dir="ltr"
                    className="text-start"
                    value={event.date ?? ""}
                    onChange={(e) => updateEvent(event.id, { date: e.target.value || null })}
                  />
                  <Input
                    type="time"
                    dir="ltr"
                    className="text-start"
                    value={event.time ?? ""}
                    onChange={(e) => updateEvent(event.id, { time: e.target.value || null })}
                  />
                  <Input
                    placeholder={t.location}
                    value={event.locationName ?? ""}
                    onChange={(e) => updateEvent(event.id, { locationName: e.target.value || null })}
                  />
                  <Input
                    placeholder={t.locationUrl}
                    dir="ltr"
                    className="text-start"
                    value={event.locationUrl ?? ""}
                    onChange={(e) => updateEvent(event.id, { locationUrl: e.target.value || null })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeEvent(event.id)}
                  aria-label={t.remove}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-400 hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
