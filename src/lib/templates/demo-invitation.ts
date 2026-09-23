import { generateInvitationText } from "@/lib/invitation-text";
import type { CoverLayout, InvitationData, PageConfig, TemplateTheme } from "@/types/invitation";

const DEMO_GROOM = "محمد";
const DEMO_BRIDE = "سيرين";
const DEMO_GROOM_FATHER = "أحمد";
const DEMO_BRIDE_FATHER = "سالم";

export const DEMO_PAGE_ORDER: PageConfig["pageType"][] = [
  "cover",
  "invitation",
  "families",
  "countdown",
  "event_details",
  "location",
  "calendar",
  "gallery",
  "rules",
  "rsvp",
  "final_message",
];

export const DEMO_PAGES: PageConfig[] = DEMO_PAGE_ORDER.map((pageType, index) => ({
  pageType,
  isEnabled: true,
  sortOrder: index,
}));

const DEMO_GALLERY_URLS = [
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=80",
  "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=1200&q=80",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=80",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=80",
];

/** Demo invitation per the platform spec — used for template previews. */
export const DEMO_INVITATION: InvitationData = {
  id: "demo-mohamed-sirine",
  slug: "mohamed-sirine",
  groomName: DEMO_GROOM,
  brideName: DEMO_BRIDE,
  groomFather: DEMO_GROOM_FATHER,
  brideFather: DEMO_BRIDE_FATHER,
  invitationText: generateInvitationText({
    groomName: DEMO_GROOM,
    brideName: DEMO_BRIDE,
    groomFather: DEMO_GROOM_FATHER,
    brideFather: DEMO_BRIDE_FATHER,
  }),
  finalMessage: "شكراً لمشاركتكم أجمل لحظات حياتنا، حضوركم يعني لنا الكثير",
  partyRules: ["جنة الأطفال بيوتهم", "ممنوع التصوير أثناء الحفل"],
  // A fixed Saturday in July — Tunisian wedding season — far enough ahead that
  // the countdown in every template preview has real numbers to show. Fixed,
  // not computed from today, so generated previews stay reproducible.
  weddingDate: "2027-07-17",
  weddingTime: "20:00",
  events: [
    {
      id: "demo-event-wedding",
      type: "wedding",
      name: "حفل الزفاف",
      date: "2027-07-17",
      time: "20:00",
      locationName: "قاعة الأفراح الكبرى",
      locationUrl: "https://maps.google.com/?q=Wedding+Venue+Tunis",
    },
    {
      id: "demo-event-dinner",
      type: "dinner",
      name: "حفل العشاء",
      date: "2027-07-17",
      time: "21:30",
      locationName: "قاعة الأفراح الكبرى",
      locationUrl: "https://maps.google.com/?q=Wedding+Venue+Tunis",
    },
  ],
  gallery: DEMO_GALLERY_URLS.map((url, index) => ({ id: `demo-gallery-${index}`, url })),
  pages: DEMO_PAGES,
};

/**
 * Cover photos for the photo-led cover layouts, chosen the way a couple would
 * pick one in the Photos step. Requested at 2400px: a cover crops a landscape
 * frame into a tall column, which needs far more width than the gallery grid.
 */
const DEMO_COVER_PHOTO: Partial<Record<CoverLayout, string>> = {
  editorial: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=2400&q=80",
  midnight: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=2400&q=80",
};

/**
 * The demo couple as a template's preview shows them. Only a template whose
 * cover layout is led by a photograph gets a cover photo; every other template
 * receives DEMO_INVITATION itself, so its preview is exactly what it was.
 */
export function demoInvitationFor(theme: TemplateTheme): InvitationData {
  const layout = theme.coverLayout;
  const photo = layout && layout !== "classic" ? DEMO_COVER_PHOTO[layout] : undefined;
  return photo ? { ...DEMO_INVITATION, coverImageUrl: photo } : DEMO_INVITATION;
}
