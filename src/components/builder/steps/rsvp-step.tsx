"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInvitationExtra, withInvitationExtra } from "@/lib/invitations/data-extra";
import { upsertPages } from "@/lib/invitations/client";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationRow } from "@/types/database";
import type { PageConfig } from "@/types/invitation";
import { cn } from "@/lib/utils";

const DEFAULT_QUESTION = { ar: "هل ستشاركوننا فرحتنا؟ ❤️", fr: "Serez-vous des nôtres ? ❤️", en: "Will you share our joy? ❤️" };

const STRINGS = {
  ar: {
    title: "تأكيد الحضور",
    description: "خصص سؤال تأكيد الحضور الذي سيراه ضيوفكم في الدعوة.",
    enabled: "تفعيل صفحة تأكيد الحضور",
    question: "نص السؤال",
    hint: "الإعدادات الكاملة لإدارة الضيوف والردود متوفرة من لوحة التحكم بعد نشر الدعوة.",
  },
  fr: {
    title: "RSVP",
    description: "Personnalisez la question de confirmation de présence vue par vos invités.",
    enabled: "Activer la page RSVP",
    question: "Texte de la question",
    hint: "La gestion complète des invités et des réponses est disponible depuis le tableau de bord après publication.",
  },
  en: {
    title: "RSVP",
    description: "Customize the RSVP question your guests will see.",
    enabled: "Enable the RSVP page",
    question: "Question text",
    hint: "Full guest management and responses are available from the dashboard after publishing.",
  },
};

export function RsvpStep({
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
  const extra = getInvitationExtra(invitation);
  const rsvpPage = pages.find((p) => p.pageType === "rsvp");
  const enabled = rsvpPage?.isEnabled ?? true;

  async function toggle() {
    const next = pages.map((p) => (p.pageType === "rsvp" ? { ...p, isEnabled: !enabled } : p));
    onPagesChange(next);
    await upsertPages(invitation.id, next);
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
        <div className="mt-6">
          <Label>{t.question}</Label>
          <Input
            value={extra.rsvpQuestion ?? DEFAULT_QUESTION[locale]}
            onChange={(e) => onPatch({ data: withInvitationExtra(invitation, { rsvpQuestion: e.target.value }) })}
          />
        </div>
      )}

      <p className="mt-6 text-xs text-ink-400">{t.hint}</p>
    </div>
  );
}
