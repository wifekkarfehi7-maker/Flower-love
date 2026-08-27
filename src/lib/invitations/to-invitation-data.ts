import { getInvitationExtra } from "./data-extra";
import type { EventRow, GalleryImageRow, InvitationPageRow, InvitationRow, MusicFileRow } from "@/types/database";
import type { InvitationData } from "@/types/invitation";

/** Maps real DB rows into the renderer's view model — the same shape demo data uses. */
export function toInvitationData(
  invitation: InvitationRow,
  events: EventRow[],
  gallery: GalleryImageRow[],
  pages: InvitationPageRow[],
  music?: MusicFileRow | null
): InvitationData {
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
    events: events.map((e) => ({
      id: e.id,
      type: e.event_type,
      name: e.name,
      date: e.event_date,
      time: e.event_time,
      locationName: e.location_name,
      locationUrl: e.location_url,
    })),
    gallery: gallery.map((g) => ({ id: g.id, url: g.url ?? "", caption: g.caption ?? undefined })),
    pages: pages.map((p) => ({ pageType: p.page_type, isEnabled: p.is_enabled, sortOrder: p.sort_order })),
    isWatermarked: invitation.is_watermarked,
  };
}
