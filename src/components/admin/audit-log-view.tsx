"use client";

import { useTranslation } from "@/lib/i18n/use-translation";
import { formatDateTime } from "@/lib/i18n/format-date";
import type { AdminAuditEntry } from "@/lib/admin/audit";

const STRINGS = {
  ar: {
    title: "سجل النشاط",
    empty: "لا يوجد نشاط مسجل بعد.",
    admin: "المدير",
    action: "الإجراء",
    target: "الهدف",
    date: "التاريخ",
  },
  fr: {
    title: "Journal d'activité",
    empty: "Aucune activité enregistrée pour le moment.",
    admin: "Admin",
    action: "Action",
    target: "Cible",
    date: "Date",
  },
  en: {
    title: "Audit log",
    empty: "No activity recorded yet.",
    admin: "Admin",
    action: "Action",
    target: "Target",
    date: "Date",
  },
};

export function AuditLogView({ entries }: { entries: AdminAuditEntry[] }) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];

  return (
    <div className="mt-6">
      <h1 className="font-heading text-2xl font-bold text-ink-900">{t.title}</h1>

      {entries.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink-200 p-10 text-center text-sm text-ink-500">
          {t.empty}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-ink-100 bg-white">
          <table className="w-full min-w-[640px] text-start text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-xs text-ink-400">
                <th className="px-4 py-3 text-start font-medium">{t.admin}</th>
                <th className="px-4 py-3 text-start font-medium">{t.action}</th>
                <th className="px-4 py-3 text-start font-medium">{t.target}</th>
                <th className="px-4 py-3 text-start font-medium">{t.date}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/60">
                  <td className="px-4 py-3 font-medium text-ink-900">{entry.adminName ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-600" dir="ltr">
                    {entry.action}
                    {(entry.previous_status || entry.new_status) && (
                      <span className="ms-1.5 text-xs text-ink-400">
                        ({entry.previous_status ?? "?"} → {entry.new_status ?? "?"})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-600" dir="ltr">
                    {entry.target_type}
                    {entry.target_id && <span className="text-ink-400"> #{entry.target_id.slice(0, 8)}</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-400" dir="ltr">
                    {formatDateTime(new Date(entry.created_at), locale)}
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
