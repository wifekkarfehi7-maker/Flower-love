"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getInvitationExtra, withInvitationExtra } from "@/lib/invitations/data-extra";
import { upsertPages } from "@/lib/invitations/client";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationRow } from "@/types/database";
import type { PageConfig } from "@/types/invitation";
import { cn } from "@/lib/utils";

const PRESETS = {
  ar: [
    "جنة الأطفال بيوتهم 👶",
    "ممنوع التصوير أثناء الحفل 📵",
    "الرجاء الالتزام بالموعد المحدد ⏰",
    "كود اللباس: أنيق رسمي 👗",
    "الدعوة خاصة بالمدعوين المذكورين فقط",
    "ممنوع التدخين داخل القاعة 🚭",
  ],
  fr: [
    "Merci de laisser les enfants à la maison 👶",
    "Photographie non autorisée pendant la cérémonie 📵",
    "Merci d'être ponctuel ⏰",
    "Tenue élégante souhaitée 👗",
    "Réservé aux invités mentionnés uniquement",
    "Non-fumeur à l'intérieur 🚭",
  ],
  en: [
    "Please leave the little ones at home 👶",
    "No photography during the ceremony 📵",
    "Please arrive on time ⏰",
    "Elegant attire requested 👗",
    "Guests named on the invitation only",
    "No smoking indoors 🚭",
  ],
};

const STRINGS = {
  ar: {
    title: "قواعد الحفلة",
    description: "أضيفوا ملاحظات مهمة لضيوفكم — اختاروا من القائمة الجاهزة أو اكتبوا قاعدتكم الخاصة.",
    enabled: "تفعيل صفحة قواعد الحفلة",
    presetsTitle: "قواعد جاهزة",
    customPlaceholder: "اكتبوا قاعدة خاصة بكم...",
    add: "إضافة",
    remove: "حذف",
    yourRules: "القواعد المضافة",
    empty: "لم تضيفوا أي قاعدة بعد.",
  },
  fr: {
    title: "Règles de la fête",
    description: "Ajoutez des notes importantes pour vos invités — choisissez dans la liste ou écrivez la vôtre.",
    enabled: "Activer la page des règles",
    presetsTitle: "Règles prêtes à l'emploi",
    customPlaceholder: "Écrivez votre propre règle...",
    add: "Ajouter",
    remove: "Supprimer",
    yourRules: "Règles ajoutées",
    empty: "Vous n'avez encore ajouté aucune règle.",
  },
  en: {
    title: "Party rules",
    description: "Add important notes for your guests — pick from the list or write your own.",
    enabled: "Enable the party rules page",
    presetsTitle: "Ready-made rules",
    customPlaceholder: "Write your own rule...",
    add: "Add",
    remove: "Remove",
    yourRules: "Added rules",
    empty: "You haven't added any rules yet.",
  },
};

export function RulesStep({
  invitation,
  pages,
  onPatch,
  onPagesChange,
}: {
  invitation: InvitationRow;
  pages: PageConfig[];
  onPatch: (fields: Partial<InvitationRow>) => void;
  onPagesChange: (pages: PageConfig[]) => void;
}) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];
  const presets = PRESETS[locale];
  const extra = getInvitationExtra(invitation);
  const rules = extra.partyRules ?? [];
  const rulesPage = pages.find((p) => p.pageType === "rules");
  const enabled = rulesPage?.isEnabled ?? false;
  const [customText, setCustomText] = React.useState("");

  async function toggle() {
    const next = pages.map((p) => (p.pageType === "rules" ? { ...p, isEnabled: !enabled } : p));
    onPagesChange(next);
    await upsertPages(invitation.id, next);
  }

  function setRules(nextRules: string[]) {
    onPatch({ data: withInvitationExtra(invitation, { partyRules: nextRules }) });
  }

  function togglePreset(preset: string) {
    if (rules.includes(preset)) {
      setRules(rules.filter((r) => r !== preset));
    } else {
      setRules([...rules, preset]);
    }
  }

  function addCustom() {
    const trimmed = customText.trim();
    if (!trimmed || rules.includes(trimmed)) return;
    setRules([...rules, trimmed]);
    setCustomText("");
  }

  function removeRule(rule: string) {
    setRules(rules.filter((r) => r !== rule));
  }

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-ink-900">{t.title}</h2>
      <p className="mt-1 text-sm text-ink-500">{t.description}</p>

      <label className="mt-6 flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={toggle}
          className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", enabled ? "bg-gold-500" : "bg-ink-200")}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              enabled ? "translate-x-0.5 rtl:-translate-x-0.5" : "translate-x-5 rtl:-translate-x-5"
            )}
          />
        </button>
        <span className="text-sm font-medium text-ink-900">{t.enabled}</span>
      </label>

      {enabled && (
        <div className="mt-6 flex flex-col gap-6">
          <div>
            <p className="text-sm font-semibold text-ink-700">{t.presetsTitle}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {presets.map((preset) => {
                const active = rules.includes(preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => togglePreset(preset)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-gold-400 bg-gold-50 text-gold-700"
                        : "border-ink-200 text-ink-600 hover:border-ink-300"
                    )}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink-700">{t.yourRules}</p>
            <div className="mt-2.5 flex gap-2">
              <Input
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustom();
                  }
                }}
                placeholder={t.customPlaceholder}
                maxLength={200}
              />
              <Button type="button" variant="outline" onClick={addCustom} disabled={!customText.trim()}>
                <Plus className="h-4 w-4" />
                {t.add}
              </Button>
            </div>

            {rules.length === 0 ? (
              <p className="mt-3 text-sm text-ink-400">{t.empty}</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {rules.map((rule) => (
                  <li
                    key={rule}
                    className="flex items-center justify-between gap-2 rounded-xl border border-ink-100 bg-ink-50/60 px-3.5 py-2 text-sm text-ink-700"
                  >
                    <span>{rule}</span>
                    <button
                      type="button"
                      onClick={() => removeRule(rule)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-destructive"
                      aria-label={t.remove}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
