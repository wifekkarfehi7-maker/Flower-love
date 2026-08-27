"use client";

import * as React from "react";
import { Wand2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { generateInvitationText } from "@/lib/invitation-text";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { InvitationRow } from "@/types/database";

const STRINGS = {
  ar: {
    title: "معلومات العروسين",
    description: "هذه المعلومات ستظهر في دعوتكم وتُستخدم لتوليد نص الدعوة تلقائياً.",
    groomName: "اسم العريس",
    brideName: "اسم العروسة",
    groomFather: "والد العريس",
    brideFather: "والد العروسة",
    groomMother: "والدة العريس (اختياري)",
    brideMother: "والدة العروسة (اختياري)",
    invitationText: "نص الدعوة",
    regenerate: "توليد تلقائي",
  },
  fr: {
    title: "Les mariés",
    description: "Ces informations apparaîtront sur votre invitation et généreront le texte automatiquement.",
    groomName: "Nom du marié",
    brideName: "Nom de la mariée",
    groomFather: "Père du marié",
    brideFather: "Père de la mariée",
    groomMother: "Mère du marié (optionnel)",
    brideMother: "Mère de la mariée (optionnel)",
    invitationText: "Texte de l'invitation",
    regenerate: "Générer automatiquement",
  },
  en: {
    title: "Couple information",
    description: "This information appears on your invitation and auto-generates the announcement text.",
    groomName: "Groom's name",
    brideName: "Bride's name",
    groomFather: "Groom's father",
    brideFather: "Bride's father",
    groomMother: "Groom's mother (optional)",
    brideMother: "Bride's mother (optional)",
    invitationText: "Invitation text",
    regenerate: "Auto-generate",
  },
};

export function CoupleInfoStep({
  invitation,
  onPatch,
}: {
  invitation: InvitationRow;
  onPatch: (fields: Partial<InvitationRow>) => void;
}) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];

  const hadTextInitially = React.useRef(Boolean(invitation.invitation_text));

  function field(key: keyof InvitationRow) {
    return (invitation[key] as string | null) ?? "";
  }

  function handleNameChange(key: keyof InvitationRow, value: string) {
    onPatch({ [key]: value });

    if (!hadTextInitially.current) {
      const next = { ...invitation, [key]: value };
      onPatch({
        invitation_text: generateInvitationText({
          groomName: next.groom_name ?? "",
          brideName: next.bride_name ?? "",
          groomFather: next.groom_father ?? undefined,
          brideFather: next.bride_father ?? undefined,
        }),
      });
    }
  }

  function regenerate() {
    hadTextInitially.current = false;
    onPatch({
      invitation_text: generateInvitationText({
        groomName: invitation.groom_name ?? "",
        brideName: invitation.bride_name ?? "",
        groomFather: invitation.groom_father ?? undefined,
        brideFather: invitation.bride_father ?? undefined,
      }),
    });
  }

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-ink-900">{t.title}</h2>
      <p className="mt-1 text-sm text-ink-500">{t.description}</p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <Label>{t.groomName}</Label>
          <Input value={field("groom_name")} onChange={(e) => handleNameChange("groom_name", e.target.value)} />
        </div>
        <div>
          <Label>{t.brideName}</Label>
          <Input value={field("bride_name")} onChange={(e) => handleNameChange("bride_name", e.target.value)} />
        </div>
        <div>
          <Label>{t.groomFather}</Label>
          <Input value={field("groom_father")} onChange={(e) => handleNameChange("groom_father", e.target.value)} />
        </div>
        <div>
          <Label>{t.brideFather}</Label>
          <Input value={field("bride_father")} onChange={(e) => handleNameChange("bride_father", e.target.value)} />
        </div>
        <div>
          <Label>{t.groomMother}</Label>
          <Input value={field("groom_mother")} onChange={(e) => onPatch({ groom_mother: e.target.value })} />
        </div>
        <div>
          <Label>{t.brideMother}</Label>
          <Input value={field("bride_mother")} onChange={(e) => onPatch({ bride_mother: e.target.value })} />
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <Label className="mb-0">{t.invitationText}</Label>
          <Button type="button" variant="ghost" size="sm" onClick={regenerate}>
            <Wand2 className="h-3.5 w-3.5" />
            {t.regenerate}
          </Button>
        </div>
        <textarea
          value={field("invitation_text")}
          onChange={(e) => {
            hadTextInitially.current = true;
            onPatch({ invitation_text: e.target.value });
          }}
          rows={4}
          className="mt-1.5 w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-base text-ink-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}
