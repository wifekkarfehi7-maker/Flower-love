"use client";

import * as React from "react";
import { Download, FileSpreadsheet, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteRsvp } from "@/lib/guests/client";
import { exportToCsv, exportToExcel } from "@/lib/export";
import type { RsvpRow } from "@/types/database";

const STRINGS = {
  ar: {
    title: "الردود المستلمة",
    empty: "لا توجد ردود بعد.",
    name: "الاسم",
    phone: "الهاتف",
    status: "الحالة",
    guests: "العدد",
    message: "الرسالة",
    date: "التاريخ",
    attending: "سيحضر",
    notAttending: "لن يحضر",
    csv: "تصدير CSV",
    excel: "تصدير Excel",
    delete: "حذف",
  },
  fr: {
    title: "Réponses reçues",
    empty: "Aucune réponse pour le moment.",
    name: "Nom",
    phone: "Téléphone",
    status: "Statut",
    guests: "Nombre",
    message: "Message",
    date: "Date",
    attending: "Présent",
    notAttending: "Absent",
    csv: "Exporter CSV",
    excel: "Exporter Excel",
    delete: "Supprimer",
  },
  en: {
    title: "RSVP responses",
    empty: "No responses yet.",
    name: "Name",
    phone: "Phone",
    status: "Status",
    guests: "Guests",
    message: "Message",
    date: "Date",
    attending: "Attending",
    notAttending: "Not attending",
    csv: "Export CSV",
    excel: "Export Excel",
    delete: "Delete",
  },
};

export function RsvpResponsesTable({ rsvps: initial, locale }: { rsvps: RsvpRow[]; locale: "ar" | "fr" | "en" }) {
  const t = STRINGS[locale];
  const [rsvps, setRsvps] = React.useState(initial);

  async function handleDelete(id: string) {
    setRsvps((prev) => prev.filter((r) => r.id !== id));
    await deleteRsvp(id);
  }

  const columns = [
    { header: t.name, value: (r: RsvpRow) => r.guest_name },
    { header: t.phone, value: (r: RsvpRow) => r.phone ?? "" },
    { header: t.status, value: (r: RsvpRow) => (r.attendance === "attending" ? t.attending : t.notAttending) },
    { header: t.guests, value: (r: RsvpRow) => r.guest_count },
    { header: t.message, value: (r: RsvpRow) => r.message ?? "" },
    { header: t.date, value: (r: RsvpRow) => new Date(r.created_at).toLocaleDateString(locale === "ar" ? "ar-TN" : locale) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-ink-900">{t.title}</h2>
        {rsvps.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => exportToCsv(rsvps, columns, "rsvp-responses.csv")}>
              <Download className="h-3.5 w-3.5" />
              {t.csv}
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportToExcel(rsvps, columns, "rsvp-responses.xls")}>
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {t.excel}
            </Button>
          </div>
        )}
      </div>

      {rsvps.length === 0 ? (
        <p className="mt-4 text-sm text-ink-400">{t.empty}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-ink-100">
          <table className="w-full min-w-[640px] text-start text-sm">
            <thead className="bg-ink-50/80 text-xs text-ink-500">
              <tr>
                <th className="px-4 py-2.5 text-start font-medium">{t.name}</th>
                <th className="px-4 py-2.5 text-start font-medium">{t.phone}</th>
                <th className="px-4 py-2.5 text-start font-medium">{t.status}</th>
                <th className="px-4 py-2.5 text-start font-medium">{t.guests}</th>
                <th className="px-4 py-2.5 text-start font-medium">{t.message}</th>
                <th className="px-4 py-2.5 text-start font-medium">{t.date}</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rsvps.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2.5 font-medium text-ink-900">{r.guest_name}</td>
                  <td className="px-4 py-2.5 text-ink-500" dir="ltr">{r.phone ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={r.attendance === "attending" ? "success" : "destructive"}>
                      {r.attendance === "attending" ? t.attending : t.notAttending}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-ink-500">{r.guest_count}</td>
                  <td className="max-w-[200px] truncate px-4 py-2.5 text-ink-500">{r.message ?? "—"}</td>
                  <td className="px-4 py-2.5 text-ink-400">
                    {new Date(r.created_at).toLocaleDateString(locale === "ar" ? "ar-TN" : locale)}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      aria-label={t.delete}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-ink-300 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
