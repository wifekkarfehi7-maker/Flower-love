"use client";

import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { useTranslation } from "@/lib/i18n/use-translation";
import type { GalleryImageRow, InvitationRow } from "@/types/database";
import type { EventItem, InvitationData, PageConfig, TemplateRecord } from "@/types/invitation";
import { getInvitationExtra } from "@/lib/invitations/data-extra";

const STRINGS = {
  ar: { title: "المعاينة", description: "هكذا ستبدو دعوتكم لضيوفكم. جرّبوا الضغط على زر الفتح." },
  fr: { title: "Aperçu", description: "Voici à quoi ressemblera votre invitation. Essayez le bouton d'ouverture." },
  en: { title: "Preview", description: "This is how your invitation will look to your guests. Try the open button." },
};

export function PreviewStep({
  invitation,
  events,
  gallery,
  pages,
  template,
}: {
  invitation: InvitationRow;
  events: EventItem[];
  gallery: GalleryImageRow[];
  pages: PageConfig[];
  template: TemplateRecord | null;
}) {
  const { locale } = useTranslation();
  const t = STRINGS[locale];

  if (!template) return null;

  const extra = getInvitationExtra(invitation);
  const data: InvitationData = {
    id: invitation.id,
    slug: invitation.slug,
    groomName: invitation.groom_name ?? "",
    brideName: invitation.bride_name ?? "",
    groomFather: invitation.groom_father ?? undefined,
    brideFather: invitation.bride_father ?? undefined,
    groomMother: invitation.groom_mother ?? undefined,
    brideMother: invitation.bride_mother ?? undefined,
    invitationText: invitation.invitation_text ?? undefined,
    rsvpQuestion: extra.rsvpQuestion,
    weddingDate: invitation.wedding_date,
    weddingTime: invitation.wedding_time,
    coverImageUrl: extra.coverImageUrl,
    events,
    gallery: gallery.map((g) => ({ id: g.id, url: g.url ?? "", caption: g.caption ?? undefined })),
    pages,
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-bold text-ink-900">{t.title}</h2>
      <p className="mt-1 text-sm text-ink-500">{t.description}</p>

      <div className="mx-auto mt-6 max-w-sm overflow-hidden rounded-[2rem] border-8 border-ink-900 shadow-2xl">
        <div className="h-[75vh] overflow-y-auto">
          <InvitationRenderer invitation={data} theme={template.theme} fonts={template.fonts} isPreview />
        </div>
      </div>
    </div>
  );
}
