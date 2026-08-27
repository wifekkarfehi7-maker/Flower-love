"use client";

import * as React from "react";
import { Download, FileSpreadsheet, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { addGuest, deleteGuest, updateGuest, type GuestInput } from "@/lib/guests/client";
import { exportToCsv, exportToExcel } from "@/lib/export";
import type { GuestRow, GuestStatus } from "@/types/database";
import { cn } from "@/lib/utils";

const STRINGS = {
  ar: {
    title: "قائمة الضيوف",
    description: "قائمتكم الخاصة لإدارة الضيوف — منفصلة عن ردود تأكيد الحضور.",
    search: "بحث بالاسم...",
    add: "إضافة ضيف",
    name: "الاسم",
    phone: "الهاتف",
    status: "الحالة",
    guests: "العدد",
    notes: "ملاحظات",
    save: "حفظ",
    cancel: "إلغاء",
    edit: "تعديل",
    delete: "حذف",
    csv: "تصدير CSV",
    excel: "تصدير Excel",
    empty: "لا يوجد ضيوف بعد. أضيفوا أول ضيف لكم.",
    noResults: "لا توجد نتائج مطابقة.",
    statuses: { pending: "بانتظار الرد", attending: "سيحضر", not_attending: "لن يحضر" } as Record<GuestStatus, string>,
  },
  fr: {
    title: "Liste des invités",
    description: "Votre propre liste de gestion des invités — distincte des réponses RSVP.",
    search: "Rechercher un nom...",
    add: "Ajouter un invité",
    name: "Nom",
    phone: "Téléphone",
    status: "Statut",
    guests: "Nombre",
    notes: "Notes",
    save: "Enregistrer",
    cancel: "Annuler",
    edit: "Modifier",
    delete: "Supprimer",
    csv: "Exporter CSV",
    excel: "Exporter Excel",
    empty: "Aucun invité pour le moment. Ajoutez votre premier invité.",
    noResults: "Aucun résultat.",
    statuses: { pending: "En attente", attending: "Présent", not_attending: "Absent" } as Record<GuestStatus, string>,
  },
  en: {
    title: "Guest list",
    description: "Your own guest management list — separate from RSVP responses.",
    search: "Search by name...",
    add: "Add guest",
    name: "Name",
    phone: "Phone",
    status: "Status",
    guests: "Guests",
    notes: "Notes",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    csv: "Export CSV",
    excel: "Export Excel",
    empty: "No guests yet. Add your first guest.",
    noResults: "No matching guests.",
    statuses: { pending: "Pending", attending: "Attending", not_attending: "Not attending" } as Record<GuestStatus, string>,
  },
};

const STATUS_BADGE = { pending: "outline", attending: "success", not_attending: "destructive" } as const;

const EMPTY_FORM: GuestInput = { name: "", phone: "", status: "pending", guestCount: 1, notes: "" };

export function GuestListTable({
  invitationId,
  guests: initial,
  locale,
}: {
  invitationId: string;
  guests: GuestRow[];
  locale: "ar" | "fr" | "en";
}) {
  const t = STRINGS[locale];
  const [guests, setGuests] = React.useState(initial);
  const [search, setSearch] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState<GuestInput>(EMPTY_FORM);
  const [saving, setSaving] = React.useState(false);

  const filtered = guests.filter((g) => g.name.toLowerCase().includes(search.trim().toLowerCase()));

  function startCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setCreating(true);
  }

  function startEdit(guest: GuestRow) {
    setForm({
      name: guest.name,
      phone: guest.phone ?? "",
      status: guest.status,
      guestCount: guest.guest_count,
      notes: guest.notes ?? "",
    });
    setEditingId(guest.id);
    setCreating(false);
  }

  function cancelForm() {
    setEditingId(null);
    setCreating(false);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const input: GuestInput = { ...form, phone: form.phone || null, notes: form.notes || null };

    if (editingId) {
      const result = await updateGuest(editingId, input);
      if (result.data) setGuests((prev) => prev.map((g) => (g.id === editingId ? result.data! : g)));
    } else {
      const result = await addGuest(invitationId, input);
      if (result.data) setGuests((prev) => [result.data!, ...prev]);
    }
    setSaving(false);
    setEditingId(null);
    setCreating(false);
  }

  async function handleDelete(id: string) {
    setGuests((prev) => prev.filter((g) => g.id !== id));
    await deleteGuest(id);
  }

  const columns = [
    { header: t.name, value: (g: GuestRow) => g.name },
    { header: t.phone, value: (g: GuestRow) => g.phone ?? "" },
    { header: t.status, value: (g: GuestRow) => t.statuses[g.status] },
    { header: t.guests, value: (g: GuestRow) => g.guest_count },
    { header: t.notes, value: (g: GuestRow) => g.notes ?? "" },
  ];

  const isFormOpen = creating || editingId !== null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-bold text-ink-900">{t.title}</h2>
          <p className="mt-0.5 text-xs text-ink-500">{t.description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {guests.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={() => exportToCsv(guests, columns, "guest-list.csv")}>
                <Download className="h-3.5 w-3.5" />
                {t.csv}
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(guests, columns, "guest-list.xls")}>
                <FileSpreadsheet className="h-3.5 w-3.5" />
                {t.excel}
              </Button>
            </>
          )}
          <Button variant="gold" size="sm" onClick={startCreate}>
            <Plus className="h-3.5 w-3.5" />
            {t.add}
          </Button>
        </div>
      </div>

      <div className="relative mt-4 max-w-xs">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.search} className="ps-9" />
      </div>

      {isFormOpen && (
        <div className="mt-4 grid gap-3 rounded-xl border border-gold-200 bg-gold-50/40 p-4 sm:grid-cols-2">
          <Input placeholder={t.name} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input
            placeholder={t.phone}
            dir="ltr"
            className="text-start"
            value={form.phone ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as GuestStatus }))}>
            {(Object.keys(t.statuses) as GuestStatus[]).map((s) => (
              <option key={s} value={s}>
                {t.statuses[s]}
              </option>
            ))}
          </Select>
          <Input
            type="number"
            min={1}
            value={form.guestCount}
            onChange={(e) => setForm((f) => ({ ...f, guestCount: Number(e.target.value) || 1 }))}
          />
          <Input
            placeholder={t.notes}
            className="sm:col-span-2"
            value={form.notes ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex gap-2 sm:col-span-2">
            <Button size="sm" variant="gold" onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t.save}
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelForm}>
              <X className="h-3.5 w-3.5" />
              {t.cancel}
            </Button>
          </div>
        </div>
      )}

      {guests.length === 0 ? (
        <p className="mt-4 text-sm text-ink-400">{t.empty}</p>
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-sm text-ink-400">{t.noResults}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-ink-100">
          <table className="w-full min-w-[600px] text-start text-sm">
            <thead className="bg-ink-50/80 text-xs text-ink-500">
              <tr>
                <th className="px-4 py-2.5 text-start font-medium">{t.name}</th>
                <th className="px-4 py-2.5 text-start font-medium">{t.phone}</th>
                <th className="px-4 py-2.5 text-start font-medium">{t.status}</th>
                <th className="px-4 py-2.5 text-start font-medium">{t.guests}</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((g) => (
                <tr key={g.id} className={cn(editingId === g.id && "bg-gold-50/40")}>
                  <td className="px-4 py-2.5 font-medium text-ink-900">{g.name}</td>
                  <td className="px-4 py-2.5 text-ink-500" dir="ltr">{g.phone ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={STATUS_BADGE[g.status]}>{t.statuses[g.status]}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-ink-500">{g.guest_count}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(g)}
                        aria-label={t.edit}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(g.id)}
                        aria-label={t.delete}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-ink-300 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
