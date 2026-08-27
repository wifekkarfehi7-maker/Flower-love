"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  createPricingPlan,
  deletePricingPlan,
  updatePricingPlan,
  type PricingPlanInput,
} from "@/lib/admin/pricing-client";
import type { PricingPlanRecord } from "@/types/invitation";

const STRINGS = {
  ar: {
    title: "الأسعار",
    newPlan: "باقة جديدة",
    empty: "لا توجد باقات بعد.",
    slug: "المعرّف (slug)",
    name: "الاسم (لاتيني)",
    nameAr: "الاسم (عربي)",
    price: "السعر",
    currency: "العملة",
    period: "الفترة",
    description: "الوصف",
    features: "المزايا (سطر لكل ميزة)",
    watermarked: "تحتوي علامة مائية",
    active: "مفعّلة",
    sortOrder: "الترتيب",
    save: "حفظ",
    cancel: "إلغاء",
    edit: "تعديل",
    delete: "حذف",
    deleteConfirm: "هل أنت متأكد من حذف هذه الباقة؟",
    inactive: "غير مفعّلة",
  },
  fr: {
    title: "Tarifs",
    newPlan: "Nouvelle formule",
    empty: "Aucune formule pour le moment.",
    slug: "Identifiant (slug)",
    name: "Nom (latin)",
    nameAr: "Nom (arabe)",
    price: "Prix",
    currency: "Devise",
    period: "Période",
    description: "Description",
    features: "Fonctionnalités (une par ligne)",
    watermarked: "Avec filigrane",
    active: "Active",
    sortOrder: "Ordre",
    save: "Enregistrer",
    cancel: "Annuler",
    edit: "Modifier",
    delete: "Supprimer",
    deleteConfirm: "Confirmer la suppression de cette formule ?",
    inactive: "Inactive",
  },
  en: {
    title: "Pricing",
    newPlan: "New plan",
    empty: "No plans yet.",
    slug: "Slug",
    name: "Name (Latin)",
    nameAr: "Name (Arabic)",
    price: "Price",
    currency: "Currency",
    period: "Period",
    description: "Description",
    features: "Features (one per line)",
    watermarked: "Has watermark",
    active: "Active",
    sortOrder: "Sort order",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    deleteConfirm: "Delete this plan?",
    inactive: "Inactive",
  },
};

type Strings = (typeof STRINGS)["ar"];

function planToInput(plan: PricingPlanRecord): PricingPlanInput {
  return {
    slug: plan.slug,
    name: plan.name,
    nameAr: plan.nameAr,
    price: plan.price,
    currency: plan.currency,
    period: plan.period,
    description: plan.description ?? "",
    features: plan.features,
    isWatermarked: plan.isWatermarked,
    isActive: true,
    sortOrder: plan.sortOrder,
  };
}

const EMPTY_INPUT: PricingPlanInput = {
  slug: "",
  name: "",
  nameAr: "",
  price: 0,
  currency: "TND",
  period: "per_invitation",
  description: "",
  features: [],
  isWatermarked: false,
  isActive: true,
  sortOrder: 0,
};

export function AdminPricingView({ plans: initialPlans }: { plans: PricingPlanRecord[] }) {
  const { locale } = useTranslation();
  const router = useRouter();
  const t = STRINGS[locale];
  const [creating, setCreating] = React.useState(false);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-ink-900">{t.title}</h1>
        {!creating && (
          <Button variant="gold" size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            {t.newPlan}
          </Button>
        )}
      </div>

      {creating && (
        <Card className="mt-4 p-5">
          <PlanForm
            t={t}
            initial={EMPTY_INPUT}
            onCancel={() => setCreating(false)}
            onSave={async (input) => {
              await createPricingPlan(input);
              setCreating(false);
              router.refresh();
            }}
          />
        </Card>
      )}

      {initialPlans.length === 0 && !creating ? (
        <div className="mt-6 rounded-2xl border border-dashed border-ink-200 p-10 text-center text-sm text-ink-500">
          {t.empty}
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {initialPlans.map((plan) => (
            <PlanRow key={plan.id} plan={plan} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanRow({ plan, t }: { plan: PricingPlanRecord; t: Strings }) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    if (!window.confirm(t.deleteConfirm)) return;
    setDeleting(true);
    await deletePricingPlan(plan.id);
    setDeleting(false);
    router.refresh();
  }

  if (editing) {
    return (
      <Card className="p-5">
        <PlanForm
          t={t}
          initial={planToInput(plan)}
          onCancel={() => setEditing(false)}
          onSave={async (input) => {
            await updatePricingPlan(plan.id, input);
            setEditing(false);
            router.refresh();
          }}
        />
      </Card>
    );
  }

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <p className="font-medium text-ink-900">
          {plan.name} <span className="text-ink-400">· {plan.nameAr}</span>
        </p>
        <p className="mt-0.5 text-sm text-ink-500" dir="ltr">
          {plan.price} {plan.currency} / {plan.period}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {plan.isWatermarked && <Badge variant="outline">{t.watermarked}</Badge>}
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          <Pencil className="h-3.5 w-3.5" />
          {t.edit}
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting} className="text-destructive hover:bg-destructive/5">
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          {t.delete}
        </Button>
      </div>
    </Card>
  );
}

function PlanForm({
  t,
  initial,
  onSave,
  onCancel,
}: {
  t: Strings;
  initial: PricingPlanInput;
  onSave: (input: PricingPlanInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [slug, setSlug] = React.useState(initial.slug);
  const [name, setName] = React.useState(initial.name);
  const [nameAr, setNameAr] = React.useState(initial.nameAr);
  const [price, setPrice] = React.useState(initial.price);
  const [currency, setCurrency] = React.useState(initial.currency);
  const [period, setPeriod] = React.useState(initial.period);
  const [description, setDescription] = React.useState(initial.description);
  const [featuresText, setFeaturesText] = React.useState(initial.features.join("\n"));
  const [isWatermarked, setIsWatermarked] = React.useState(initial.isWatermarked);
  const [isActive, setIsActive] = React.useState(initial.isActive);
  const [sortOrder, setSortOrder] = React.useState(initial.sortOrder);
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit() {
    setSaving(true);
    await onSave({
      slug,
      name,
      nameAr,
      price,
      currency,
      period,
      description,
      features: featuresText.split("\n").map((f) => f.trim()).filter(Boolean),
      isWatermarked,
      isActive,
      sortOrder,
    });
    setSaving(false);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label>{t.slug}</Label>
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} dir="ltr" />
      </div>
      <div>
        <Label>{t.name}</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label>{t.nameAr}</Label>
        <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} dir="rtl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t.price}</Label>
          <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} dir="ltr" />
        </div>
        <div>
          <Label>{t.currency}</Label>
          <Input value={currency} onChange={(e) => setCurrency(e.target.value)} dir="ltr" />
        </div>
      </div>
      <div>
        <Label>{t.period}</Label>
        <Input value={period} onChange={(e) => setPeriod(e.target.value)} dir="ltr" />
      </div>
      <div>
        <Label>{t.sortOrder}</Label>
        <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} />
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
      <div className="sm:col-span-2">
        <Label>{t.features}</Label>
        <textarea
          value={featuresText}
          onChange={(e) => setFeaturesText(e.target.value)}
          rows={4}
          className="flex w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="flex items-center gap-4 sm:col-span-2">
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={isWatermarked} onChange={(e) => setIsWatermarked(e.target.checked)} />
          {t.watermarked}
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          {t.active}
        </label>
      </div>
      <div className="flex items-center gap-2 sm:col-span-2">
        <Button variant="gold" size="sm" onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {t.save}
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          {t.cancel}
        </Button>
      </div>
    </div>
  );
}
