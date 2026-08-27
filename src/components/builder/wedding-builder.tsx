"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Heart, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SaveIndicator } from "./save-indicator";
import { LivePreviewPanel } from "./live-preview-panel";
import { useInvitationAutosave } from "@/hooks/use-invitation-autosave";
import { useTranslation } from "@/lib/i18n/use-translation";
import { markReadyForPayment } from "@/lib/invitations/client";
import { getInvitationExtra, withInvitationExtra } from "@/lib/invitations/data-extra";
import type { EventRow, GalleryImageRow, InvitationPageRow, InvitationRow, MusicFileRow } from "@/types/database";
import type { EventItem, PageConfig, TemplateRecord } from "@/types/invitation";
import { cn } from "@/lib/utils";

import { CoupleInfoStep } from "./steps/couple-info-step";
import { DateEventsStep } from "./steps/date-events-step";
import { TemplateStep } from "./steps/template-step";
import { PagesStep } from "./steps/pages-step";
import { PhotosStep } from "./steps/photos-step";
import { TypographyStep } from "./steps/typography-step";
import { MusicStep } from "./steps/music-step";
import { RsvpStep } from "./steps/rsvp-step";
import { PreviewStep } from "./steps/preview-step";
import { PublishStep } from "./steps/publish-step";

const STEP_LABELS = {
  ar: [
    "معلومات العروسين",
    "التاريخ والمناسبات",
    "التصميم",
    "الصفحات",
    "الصور",
    "الخطوط",
    "الموسيقى",
    "تأكيد الحضور",
    "المعاينة",
    "النشر",
  ],
  fr: [
    "Les mariés",
    "Date et événements",
    "Modèle",
    "Pages",
    "Photos",
    "Typographie",
    "Musique",
    "RSVP",
    "Aperçu",
    "Publication",
  ],
  en: [
    "Couple info",
    "Date & events",
    "Template",
    "Pages",
    "Photos",
    "Typography",
    "Music",
    "RSVP",
    "Preview",
    "Publish",
  ],
};

const STRINGS = {
  ar: { step: "الخطوة", of: "من", back: "السابق", next: "التالي", saveExit: "حفظ وخروج" },
  fr: { step: "Étape", of: "sur", back: "Précédent", next: "Suivant", saveExit: "Enregistrer et quitter" },
  en: { step: "Step", of: "of", back: "Back", next: "Next", saveExit: "Save & exit" },
};

function toEventItem(row: EventRow): EventItem {
  return {
    id: row.id,
    type: row.event_type,
    name: row.name,
    date: row.event_date,
    time: row.event_time,
    locationName: row.location_name,
    locationUrl: row.location_url,
  };
}

function toPageConfig(row: InvitationPageRow): PageConfig {
  return { pageType: row.page_type, isEnabled: row.is_enabled, sortOrder: row.sort_order };
}

export function WeddingBuilder({
  invitation: initialInvitation,
  pages: initialPages,
  events: initialEvents,
  gallery: initialGallery,
  music: initialMusic,
  templates,
  userId,
}: {
  invitation: InvitationRow;
  pages: InvitationPageRow[];
  events: EventRow[];
  gallery: GalleryImageRow[];
  music: MusicFileRow | null;
  templates: TemplateRecord[];
  userId: string;
}) {
  const { locale, dir } = useTranslation();
  const router = useRouter();
  const t = STRINGS[locale];
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;
  const NextIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  const [stepIndex, setStepIndex] = React.useState(0);
  const [invitation, setInvitation] = React.useState(initialInvitation);
  const [events, setEvents] = React.useState<EventItem[]>(initialEvents.map(toEventItem));
  const [pages, setPages] = React.useState<PageConfig[]>(initialPages.map(toPageConfig));
  const [gallery, setGallery] = React.useState<GalleryImageRow[]>(initialGallery);
  const [music, setMusic] = React.useState<MusicFileRow | null>(initialMusic);

  const { patch, status, flushNow } = useInvitationAutosave(invitation.id);

  function patchInvitation(fields: Partial<InvitationRow>) {
    setInvitation((prev) => ({ ...prev, ...fields }));
    patch(fields);
  }

  const selectedTemplate = templates.find((tpl) => tpl.id === invitation.template_id) ?? templates[0] ?? null;

  const previewData = React.useMemo(() => {
    const extra = getInvitationExtra(invitation);
    return {
      id: invitation.id,
      slug: invitation.slug,
      groomName: invitation.groom_name ?? "",
      brideName: invitation.bride_name ?? "",
      groomFather: invitation.groom_father ?? undefined,
      brideFather: invitation.bride_father ?? undefined,
      groomMother: invitation.groom_mother ?? undefined,
      brideMother: invitation.bride_mother ?? undefined,
      invitationText: invitation.invitation_text ?? undefined,
      finalMessage: undefined,
      rsvpQuestion: extra.rsvpQuestion,
      weddingDate: invitation.wedding_date,
      weddingTime: invitation.wedding_time,
      coverImageUrl: extra.coverImageUrl,
      music: music?.url ? { url: music.url, autoplayAfterOpen: music.autoplay_after_open } : undefined,
      events,
      gallery: gallery.map((g) => ({ id: g.id, url: g.url ?? "", caption: g.caption ?? undefined })),
      pages,
    };
  }, [invitation, events, gallery, pages, music]);

  async function goTo(index: number) {
    await flushNow();
    setStepIndex(Math.max(0, Math.min(STEPS.length - 1, index)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSaveExit() {
    await flushNow();
    router.push("/my-invitations");
  }

  async function handlePublishStep() {
    await flushNow();
    await markReadyForPayment(invitation.id);
    router.push("/my-invitations");
  }

  const STEPS = [
    <CoupleInfoStep key="couple" invitation={invitation} onPatch={patchInvitation} />,
    <DateEventsStep key="dates" invitation={invitation} events={events} onPatchInvitation={patchInvitation} onEventsChange={setEvents} />,
    <TemplateStep key="template" templates={templates} selectedTemplateId={invitation.template_id} onSelect={(id) => patchInvitation({ template_id: id })} />,
    <PagesStep key="pages" invitationId={invitation.id} pages={pages} onPagesChange={setPages} />,
    <PhotosStep key="photos" invitationId={invitation.id} userId={userId} gallery={gallery} onGalleryChange={setGallery} coverImageUrl={getInvitationExtra(invitation).coverImageUrl} onSetCover={(url) => patchInvitation({ data: withInvitationExtra(invitation, { coverImageUrl: url }) })} />,
    <TypographyStep key="typography" invitation={invitation} template={selectedTemplate} onPatch={patchInvitation} />,
    <MusicStep key="music" invitationId={invitation.id} userId={userId} music={music} onMusicChange={setMusic} />,
    <RsvpStep key="rsvp" invitation={invitation} pages={pages} onPatch={patchInvitation} onPagesChange={setPages} />,
    <PreviewStep key="preview" invitation={invitation} events={events} gallery={gallery} pages={pages} music={music} template={selectedTemplate} />,
    <PublishStep key="publish" invitation={invitation} template={selectedTemplate} onPublish={handlePublishStep} />,
  ];

  const isLastStep = stepIndex === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-ink-50/40">
      <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/my-invitations" className="flex items-center gap-2 shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold-gradient">
              <Heart className="h-4 w-4 text-ink-950" fill="currentColor" />
            </span>
            <span className="hidden font-heading text-sm font-semibold text-ink-900 sm:inline">Flower &amp; Love</span>
          </Link>

          <div className="flex flex-1 items-center gap-3">
            <span className="shrink-0 text-xs font-medium text-ink-500">
              {t.step} {stepIndex + 1} {t.of} {STEPS.length}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-gold-gradient transition-all duration-500"
                style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
              />
            </div>
            <SaveIndicator status={status} className="hidden shrink-0 sm:inline-flex" />
          </div>

          <button
            type="button"
            onClick={handleSaveExit}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-400 hover:bg-ink-50 hover:text-ink-700"
            aria-label={t.saveExit}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mx-auto max-w-5xl px-4 pb-2 sm:px-6">
          <SaveIndicator status={status} className="sm:hidden" />
        </div>
      </header>

      <div className="mx-auto grid max-w-[88rem] gap-8 px-4 py-6 sm:px-6 sm:py-10 xl:grid-cols-[1fr_23rem]">
        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap gap-2">
            {STEP_LABELS[locale].map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => goTo(i)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  i === stepIndex
                    ? "bg-ink-900 text-white"
                    : i < stepIndex
                      ? "bg-gold-50 text-gold-700"
                      : "bg-ink-100 text-ink-400"
                )}
              >
                {i + 1}. {label}
              </button>
            ))}
          </div>

          <div className="rounded-[2rem] border border-ink-100 bg-white p-5 shadow-card sm:p-8">
            {STEPS[stepIndex]}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="outline" onClick={() => goTo(stepIndex - 1)} disabled={stepIndex === 0}>
              <BackIcon className="h-4 w-4" />
              {t.back}
            </Button>
            {!isLastStep && (
              <Button variant="gold" onClick={() => goTo(stepIndex + 1)}>
                {t.next}
                <NextIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <LivePreviewPanel invitation={previewData} template={selectedTemplate} />
      </div>
    </div>
  );
}
