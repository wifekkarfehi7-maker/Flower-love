"use client";

import { Label } from "@/components/ui/label";
import { fontFamilyFor } from "@/components/invitation/theme";
import { getInvitationExtra, withInvitationExtra } from "@/lib/invitations/data-extra";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationRow } from "@/types/database";
import type { TemplateFonts, TemplateRecord } from "@/types/invitation";
import { cn } from "@/lib/utils";

const FONT_OPTIONS: { value: TemplateFonts["heading"]; label: string }[] = [
  { value: "amiri", label: "Amiri — أميري" },
  { value: "playfair", label: "Playfair Display" },
  { value: "cairo", label: "Cairo — القاهرة" },
  { value: "inter", label: "Inter" },
];

const STRINGS = {
  ar: {
    title: "الخطوط",
    description: "خصص خطوط دعوتكم، أو اتركوها كما في التصميم المختار.",
    heading: "خط العناوين",
    body: "خط النصوص",
    preview: "محمد و سيرين",
    previewBody: "تتشرف عائلتا العروسين بدعوتكم لحضور حفل الزفاف",
    reset: "استخدام خط التصميم",
  },
  fr: {
    title: "Typographie",
    description: "Personnalisez les polices de votre invitation, ou gardez celles du modèle.",
    heading: "Police des titres",
    body: "Police du texte",
    preview: "Mohamed & Sirine",
    previewBody: "Les deux familles ont l'honneur de vous inviter à leur mariage",
    reset: "Utiliser la police du modèle",
  },
  en: {
    title: "Typography",
    description: "Customize your invitation's fonts, or keep the template's defaults.",
    heading: "Heading font",
    body: "Body font",
    preview: "Mohamed & Sirine",
    previewBody: "Both families warmly invite you to celebrate their wedding",
    reset: "Use template font",
  },
};

export function TypographyStep({
  invitation,
  template,
  onPatch,
}: {
  invitation: InvitationRow;
  template: TemplateRecord | null;
  onPatch: (fields: Partial<InvitationRow>) => void;
}) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];
  const extra = getInvitationExtra(invitation);

  const heading = extra.fontsOverride?.heading ?? template?.fonts.heading ?? "amiri";
  const body = extra.fontsOverride?.body ?? template?.fonts.body ?? "cairo";

  function setFont(key: "heading" | "body", value: TemplateFonts["heading"] | undefined) {
    onPatch({
      data: withInvitationExtra(invitation, {
        fontsOverride: { ...extra.fontsOverride, [key]: value },
      }),
    });
  }

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-ink-900">{t.title}</h2>
      <p className="mt-1 text-sm text-ink-500">{t.description}</p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <Label>{t.heading}</Label>
          <div className="flex flex-col gap-2">
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFont("heading", opt.value)}
                className={cn(
                  "rounded-xl border px-4 py-2.5 text-start text-lg",
                  heading === opt.value ? "border-gold-400 bg-gold-50" : "border-ink-200"
                )}
                style={{ fontFamily: fontFamilyFor(opt.value) }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>{t.body}</Label>
          <div className="flex flex-col gap-2">
            {FONT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFont("body", opt.value)}
                className={cn(
                  "rounded-xl border px-4 py-2.5 text-start",
                  body === opt.value ? "border-gold-400 bg-gold-50" : "border-ink-200"
                )}
                style={{ fontFamily: fontFamilyFor(opt.value) }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-ink-100 bg-ink-50/60 p-8 text-center">
        <p className="text-2xl font-bold" style={{ fontFamily: fontFamilyFor(heading) }}>
          {t.preview}
        </p>
        <p className="mt-2 text-sm" style={{ fontFamily: fontFamilyFor(body) }}>
          {t.previewBody}
        </p>
      </div>
    </div>
  );
}
