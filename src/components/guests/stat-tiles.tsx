"use client";

import { CalendarCheck, Eye, HelpCircle, UserX, Users } from "lucide-react";

const LABELS = {
  ar: { views: "المشاهدات", attending: "سيحضرون", notAttending: "لن يحضروا", pending: "بانتظار الرد", guests: "إجمالي الضيوف" },
  fr: { views: "Vues", attending: "Présents", notAttending: "Absents", pending: "En attente", guests: "Total invités" },
  en: { views: "Views", attending: "Attending", notAttending: "Not attending", pending: "Pending", guests: "Total guests" },
};

export function StatTiles({
  locale,
  views,
  attending,
  notAttending,
  pending,
  totalGuests,
}: {
  locale: "ar" | "fr" | "en";
  views: number;
  attending: number;
  notAttending: number;
  pending: number;
  totalGuests: number;
}) {
  const t = LABELS[locale];
  const tiles = [
    { icon: Eye, label: t.views, value: views, color: "text-ink-600" },
    { icon: CalendarCheck, label: t.attending, value: attending, color: "text-emerald-600" },
    { icon: UserX, label: t.notAttending, value: notAttending, color: "text-destructive" },
    { icon: HelpCircle, label: t.pending, value: pending, color: "text-gold-600" },
    { icon: Users, label: t.guests, value: totalGuests, color: "text-ink-600" },
  ];

  const chartTotal = Math.max(attending + notAttending + pending, 1);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-ink-100 bg-white p-4 text-center">
            <tile.icon className={`mx-auto h-5 w-5 ${tile.color}`} />
            <p className="mt-2 font-heading text-2xl font-bold text-ink-900">{tile.value}</p>
            <p className="mt-0.5 text-xs text-ink-500">{tile.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-ink-100">
        <div className="bg-emerald-500" style={{ width: `${(attending / chartTotal) * 100}%` }} />
        <div className="bg-destructive" style={{ width: `${(notAttending / chartTotal) * 100}%` }} />
        <div className="bg-gold-400" style={{ width: `${(pending / chartTotal) * 100}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {t.attending}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-destructive" />
          {t.notAttending}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gold-400" />
          {t.pending}
        </span>
      </div>
    </div>
  );
}
