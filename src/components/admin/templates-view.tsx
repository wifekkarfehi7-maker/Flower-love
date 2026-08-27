"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateTemplate } from "@/lib/admin/templates-client";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { TemplateRecord } from "@/types/invitation";
import type { TemplateStatus } from "@/types/database";

const STATUS_VARIANT: Record<TemplateStatus, BadgeProps["variant"]> = {
  active: "success",
  draft: "outline",
  disabled: "destructive",
};

const STRINGS = {
  ar: {
    title: "التصاميم",
    empty: "لا توجد تصاميم بعد.",
    name: "الاسم (لاتيني)",
    nameAr: "الاسم (عربي)",
    description: "الوصف",
    status: "الحالة",
    sortOrder: "الترتيب",
    statusActive: "نشط",
    statusDraft: "مسودة",
    statusDisabled: "معطل",
    edit: "تعديل",
    save: "حفظ",
    cancel: "إلغاء",
  },
  fr: {
    title: "Modèles",
    empty: "Aucun modèle pour le moment.",
    name: "Nom (latin)",
    nameAr: "Nom (arabe)",
    description: "Description",
    status: "Statut",
    sortOrder: "Ordre",
    statusActive: "Actif",
    statusDraft: "Brouillon",
    statusDisabled: "Désactivé",
    edit: "Modifier",
    save: "Enregistrer",
    cancel: "Annuler",
  },
  en: {
    title: "Templates",
    empty: "No templates yet.",
    name: "Name (Latin)",
    nameAr: "Name (Arabic)",
    description: "Description",
    status: "Status",
    sortOrder: "Sort order",
    statusActive: "Active",
    statusDraft: "Draft",
    statusDisabled: "Disabled",
    edit: "Edit",
    save: "Save",
    cancel: "Cancel",
  },
};

export function AdminTemplatesView({ templates }: { templates: TemplateRecord[] }) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];

  return (
    <div className="mt-6">
      <h1 className="font-heading text-2xl font-bold text-ink-900">{t.title}</h1>

      {templates.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink-200 p-10 text-center text-sm text-ink-500">
          {t.empty}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {templates.map((template) => (
            <TemplateRow key={template.id} template={template} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function TemplateRow({ template, t }: { template: TemplateRecord; t: (typeof STRINGS)["ar"] }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState(template.name);
  const [nameAr, setNameAr] = React.useState(template.nameAr);
  const [description, setDescription] = React.useState(template.description ?? "");
  const [status, setStatus] = React.useState<TemplateStatus>(template.status);
  const [sortOrder, setSortOrder] = React.useState(template.sortOrder);

  async function handleSave() {
    setSaving(true);
    await updateTemplate(template.id, { name, nameAr, description, status, sortOrder });
    setSaving(false);
    setEditing(false);
    router.refresh();
  }

  function handleCancel() {
    setName(template.name);
    setNameAr(template.nameAr);
    setDescription(template.description ?? "");
    setStatus(template.status);
    setSortOrder(template.sortOrder);
    setEditing(false);
  }

  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-4">
      {!editing ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 shrink-0 rounded-lg"
              style={{ backgroundColor: template.theme.background, border: `1px solid ${template.theme.primary}` }}
            />
            <div>
              <p className="font-medium text-ink-900">
                {template.name} <span className="text-ink-400">· {template.nameAr}</span>
              </p>
              <p className="text-xs text-ink-400">
                {t.sortOrder}: {template.sortOrder}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={STATUS_VARIANT[template.status]}>
              {template.status === "active" ? t.statusActive : template.status === "draft" ? t.statusDraft : t.statusDisabled}
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" />
              {t.edit}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>{t.name}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>{t.nameAr}</Label>
            <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
          </div>
          <div className="sm:col-span-2">
            <Label>{t.description}</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="flex w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <Label>{t.status}</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as TemplateStatus)}>
              <option value="active">{t.statusActive}</option>
              <option value="draft">{t.statusDraft}</option>
              <option value="disabled">{t.statusDisabled}</option>
            </Select>
          </div>
          <div>
            <Label>{t.sortOrder}</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-2 sm:col-span-2">
            <Button variant="gold" size="sm" onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t.save}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
              {t.cancel}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
