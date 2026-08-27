/**
 * Client-facing view model for rendering an invitation. Deliberately
 * decoupled from the raw Supabase row shapes in `types/database.ts` — the
 * renderer works identically whether the data came from a real invitation,
 * demo data, or (later) a live builder draft.
 */

export type PageType =
  | "cover"
  | "invitation"
  | "families"
  | "countdown"
  | "event_details"
  | "location"
  | "calendar"
  | "gallery"
  | "rsvp"
  | "final_message";

export interface PageConfig {
  pageType: PageType;
  isEnabled: boolean;
  sortOrder: number;
}

export type EventType = "aqd" | "wedding" | "dinner" | "reception" | "other";

export interface EventItem {
  id: string;
  type: EventType;
  name: string;
  date: string | null;
  time: string | null;
  locationName: string | null;
  locationUrl: string | null;
}

export interface GalleryImageItem {
  id: string;
  url: string;
  caption?: string;
}

export interface InvitationData {
  id: string;
  slug: string | null;
  groomName: string;
  brideName: string;
  groomFather?: string;
  brideFather?: string;
  groomMother?: string;
  brideMother?: string;
  invitationText?: string;
  finalMessage?: string;
  weddingDate: string | null;
  weddingTime: string | null;
  coverImageUrl?: string;
  events: EventItem[];
  gallery: GalleryImageItem[];
  pages: PageConfig[];
}

/**
 * Structural + visual tokens that give each template a genuinely distinct
 * design system — not just a different color swap. Stored as jsonb on
 * `templates.theme` (see supabase/seed.sql) so 50+ templates can be added
 * later purely as data, no new components.
 */
export interface TemplateTheme {
  background: string;
  backgroundAlt?: string;
  surface: string;
  primary: string;
  accent: string;
  text: string;
  textMuted?: string;
  backgroundStyle: "solid" | "gradient" | "radial" | "pattern";
  cardRadius: "none" | "soft" | "round" | "ornate";
  buttonStyle: "pill" | "sharp" | "outline-ornate";
  galleryLayout: "grid" | "masonry" | "polaroid" | "carousel" | "romantic" | "minimal";
  countdownStyle: "cards" | "minimal" | "circular" | "ornate";
  dividerStyle: "line" | "ornament" | "dots" | "none";
  motif: "gem" | "flower" | "moon" | "square" | "sparkle" | "wave" | "sun" | "sparkles";
}

export interface TemplateFonts {
  heading: "amiri" | "playfair" | "inter" | "cairo";
  body: "cairo" | "inter";
}

export interface TemplateRecord {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  category: string;
  description: string | null;
  status: "active" | "draft" | "disabled";
  theme: TemplateTheme;
  fonts: TemplateFonts;
  sortOrder: number;
}
