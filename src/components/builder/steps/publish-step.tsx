"use client";

import { CheckCircle2 } from "lucide-react";

import { WhatsAppButton } from "@/components/whatsapp-button";
import { Button } from "@/components/ui/button";
import { fontFamilyFor } from "@/components/invitation/theme";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationRow } from "@/types/database";
import type { TemplateRecord } from "@/types/invitation";

const STRINGS = {
  ar: {
    title: "جاهزون للنشر!",
    description: "دعوتكم جاهزة من ناحية التصميم والمحتوى. تواصلوا معنا عبر واتساب لاختيار الباقة المناسبة وإتمام الدفع، وسنقوم بتفعيل دعوتكم فوراً.",
    template: "التصميم",
    date: "تاريخ الزفاف",
    whatsapp: "تواصل معنا لإتمام النشر ❤️",
    finish: "إنهاء والعودة إلى دعواتي",
  },
  fr: {
    title: "Prêt à publier !",
    description: "Votre invitation est prête côté design et contenu. Contactez-nous sur WhatsApp pour choisir votre formule et finaliser le paiement — nous activerons votre invitation immédiatement.",
    template: "Modèle",
    date: "Date du mariage",
    whatsapp: "Contactez-nous pour publier ❤️",
    finish: "Terminer et retourner à mes invitations",
  },
  en: {
    title: "Ready to publish!",
    description: "Your invitation is ready design- and content-wise. Contact us on WhatsApp to choose a package and complete payment — we'll activate your invitation right away.",
    template: "Template",
    date: "Wedding date",
    whatsapp: "Contact us to publish ❤️",
    finish: "Finish & return to My Invitations",
  },
};

export function PublishStep({
  invitation,
  template,
  onPublish,
}: {
  invitation: InvitationRow;
  template: TemplateRecord | null;
  onPublish: () => void;
}) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];

  const coupleNames = `${invitation.groom_name ?? ""} & ${invitation.bride_name ?? ""}`;
  const message = [
    locale === "ar"
      ? "مرحباً، أنهيت تجهيز دعوة زفافي على Flower & Love وأرغب في معرفة تفاصيل الباقات والدفع."
      : "Hello, I've finished setting up my wedding invitation on Flower & Love and would like details on packages and payment.",
    "",
    `${coupleNames}`,
    `ID: ${invitation.id}`,
  ].join("\n");

  return (
    <div className="text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
      <h2 className="mt-4 font-heading text-2xl font-bold text-ink-900">{t.title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-500">{t.description}</p>

      <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3 rounded-2xl border border-ink-100 bg-ink-50/60 p-5 text-start">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-500">{t.template}</span>
          <span className="font-semibold text-ink-900" style={{ fontFamily: template ? fontFamilyFor(template.fonts.heading) : undefined }}>
            {locale === "ar" ? template?.nameAr : template?.name}
          </span>
        </div>
        {invitation.wedding_date && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-500">{t.date}</span>
            <span className="font-semibold text-ink-900" dir="ltr">
              {invitation.wedding_date}
            </span>
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3">
        <WhatsAppButton message={message} size="lg" onClick={onPublish}>
          {t.whatsapp}
        </WhatsAppButton>
        <Button variant="ghost" onClick={onPublish}>
          {t.finish}
        </Button>
      </div>
    </div>
  );
}
