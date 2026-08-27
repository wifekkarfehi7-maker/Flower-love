"use client";

import { Check } from "lucide-react";

import { MotifIcon } from "@/components/invitation/motif-icon";
import { fontFamilyFor } from "@/components/invitation/theme";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { TemplateRecord } from "@/types/invitation";
import { cn } from "@/lib/utils";

const STRINGS = {
  ar: { title: "اختر التصميم", description: "كل تصميم بهوية بصرية مستقلة بالكامل — يمكنك تغييره لاحقاً في أي وقت." },
  fr: { title: "Choisissez le modèle", description: "Chaque modèle a une identité visuelle indépendante — vous pouvez en changer à tout moment." },
  en: { title: "Choose your template", description: "Every template has its own visual identity — you can change it anytime." },
};

export function TemplateStep({
  templates,
  selectedTemplateId,
  onSelect,
}: {
  templates: TemplateRecord[];
  selectedTemplateId: string | null;
  onSelect: (id: string) => void;
}) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-ink-900">{t.title}</h2>
      <p className="mt-1 text-sm text-ink-500">{t.description}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {templates.map((template) => {
          const isSelected = template.id === selectedTemplateId;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={cn(
                "group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-2xl p-4 text-start ring-2 transition-all",
                isSelected ? "ring-gold-500" : "ring-transparent hover:ring-ink-200"
              )}
              style={{
                backgroundColor: template.theme.background,
                backgroundImage:
                  template.theme.backgroundStyle === "gradient"
                    ? `linear-gradient(165deg, ${template.theme.background}, ${template.theme.surface})`
                    : template.theme.backgroundStyle === "radial"
                      ? `radial-gradient(circle at 50% 0%, ${template.theme.surface}, ${template.theme.background} 75%)`
                      : undefined,
                color: template.theme.text,
              }}
            >
              {isSelected && (
                <span className="absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold-500 text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
              <MotifIcon motif={template.theme.motif} className="h-5 w-5 opacity-80" />
              <div>
                <p className="text-sm leading-snug" style={{ fontFamily: fontFamilyFor(template.fonts.heading) }}>
                  {template.name}
                </p>
                <p className="mt-0.5 text-xs opacity-70">{template.nameAr}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
