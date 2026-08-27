/**
 * Hand-written types mirroring supabase/migrations/0001_init.sql.
 * Once a real Supabase project exists, these can be regenerated with:
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 * Keep this file in sync with the migration until then.
 */

export type UserRole = "customer" | "admin";
export type PreferredLanguage = "ar" | "fr" | "en";
export type InvitationStatus =
  | "draft"
  | "pending_payment"
  | "payment_review"
  | "paid"
  | "active"
  | "cancelled"
  | "expired";
export type OrderStatus = InvitationStatus;
export type TemplateStatus = "active" | "draft" | "disabled";
export type RsvpAttendance = "attending" | "not_attending";
export type GuestStatus = "pending" | "attending" | "not_attending";
export type EventType = "aqd" | "wedding" | "dinner" | "reception" | "other";
export type PageType =
  | "cover"
  | "invitation"
  | "families"
  | "countdown"
  | "event_details"
  | "location"
  | "calendar"
  | "gallery"
  | "rules"
  | "rsvp"
  | "final_message";

export type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  whatsapp: string | null;
  country: string;
  preferred_language: PreferredLanguage;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type InvitationRow = {
  id: string;
  user_id: string;
  template_id: string | null;
  slug: string | null;
  groom_name: string | null;
  bride_name: string | null;
  groom_father: string | null;
  bride_father: string | null;
  groom_mother: string | null;
  bride_mother: string | null;
  invitation_text: string | null;
  wedding_date: string | null;
  wedding_time: string | null;
  status: InvitationStatus;
  is_watermarked: boolean;
  view_count: number;
  data: Record<string, unknown>;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TemplateRow = {
  id: string;
  slug: string;
  name: string;
  name_ar: string;
  category: string;
  description: string | null;
  preview_image_url: string | null;
  status: TemplateStatus;
  theme: Record<string, unknown>;
  supported_pages: PageType[];
  fonts: Record<string, unknown>;
  animation_settings: Record<string, unknown>;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PricingPlanRow = {
  id: string;
  slug: string;
  name: string;
  name_ar: string;
  price: number;
  currency: string;
  period: string;
  description: string | null;
  features: string[];
  is_watermarked: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type OrderRow = {
  id: string;
  order_number: string;
  user_id: string;
  invitation_id: string;
  plan_id: string | null;
  customer_name: string;
  customer_whatsapp: string;
  plan_name: string;
  price: number;
  currency: string;
  status: OrderStatus;
  admin_notes: string | null;
  paid_at: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PaymentStatus = "pending" | "confirmed" | "failed" | "refunded";

export type PaymentRow = {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  method: string;
  status: PaymentStatus;
  confirmed_by: string | null;
  confirmed_at: string | null;
  notes: string | null;
  created_at: string;
};

export type AuditLogRow = {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  previous_status: string | null;
  new_status: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type GuestRow = {
  id: string;
  invitation_id: string;
  name: string;
  phone: string | null;
  status: GuestStatus;
  guest_count: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RsvpRow = {
  id: string;
  invitation_id: string;
  guest_name: string;
  phone: string | null;
  attendance: RsvpAttendance;
  guest_count: number;
  message: string | null;
  created_at: string;
};

export type InvitationPageRow = {
  id: string;
  invitation_id: string;
  page_type: PageType;
  is_enabled: boolean;
  sort_order: number;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type EventRow = {
  id: string;
  invitation_id: string;
  event_type: EventType;
  name: string;
  event_date: string | null;
  event_time: string | null;
  location_name: string | null;
  location_url: string | null;
  sort_order: number;
  created_at: string;
};

export type GalleryImageRow = {
  id: string;
  invitation_id: string;
  storage_path: string;
  url: string | null;
  caption: string | null;
  sort_order: number;
  created_at: string;
};

export type MusicFileRow = {
  id: string;
  invitation_id: string;
  storage_path: string;
  url: string | null;
  title: string | null;
  autoplay_after_open: boolean;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Partial<ProfileRow> & { id: string };
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      invitations: {
        Row: InvitationRow;
        Insert: Partial<InvitationRow> & { user_id: string };
        Update: Partial<InvitationRow>;
        Relationships: [];
      };
      templates: {
        Row: TemplateRow;
        Insert: Partial<TemplateRow> & { slug: string; name: string; name_ar: string };
        Update: Partial<TemplateRow>;
        Relationships: [];
      };
      pricing_plans: {
        Row: PricingPlanRow;
        Insert: Partial<PricingPlanRow> & { slug: string; name: string; name_ar: string };
        Update: Partial<PricingPlanRow>;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: Partial<OrderRow> & {
          user_id: string;
          invitation_id: string;
          customer_name: string;
          customer_whatsapp: string;
          plan_name: string;
          price: number;
        };
        Update: Partial<OrderRow>;
        Relationships: [];
      };
      payments: {
        Row: PaymentRow;
        Insert: Partial<PaymentRow> & { order_id: string; amount: number };
        Update: Partial<PaymentRow>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: Partial<AuditLogRow> & { action: string; target_type: string };
        Update: Partial<AuditLogRow>;
        Relationships: [];
      };
      guests: {
        Row: GuestRow;
        Insert: Partial<GuestRow> & { invitation_id: string; name: string };
        Update: Partial<GuestRow>;
        Relationships: [];
      };
      rsvps: {
        Row: RsvpRow;
        Insert: Partial<RsvpRow> & {
          invitation_id: string;
          guest_name: string;
          attendance: RsvpAttendance;
        };
        Update: Partial<RsvpRow>;
        Relationships: [];
      };
      invitation_pages: {
        Row: InvitationPageRow;
        Insert: Partial<InvitationPageRow> & { invitation_id: string; page_type: PageType };
        Update: Partial<InvitationPageRow>;
        Relationships: [];
      };
      events: {
        Row: EventRow;
        Insert: Partial<EventRow> & { invitation_id: string; name: string };
        Update: Partial<EventRow>;
        Relationships: [];
      };
      gallery_images: {
        Row: GalleryImageRow;
        Insert: Partial<GalleryImageRow> & { invitation_id: string; storage_path: string };
        Update: Partial<GalleryImageRow>;
        Relationships: [];
      };
      music_files: {
        Row: MusicFileRow;
        Insert: Partial<MusicFileRow> & { invitation_id: string; storage_path: string };
        Update: Partial<MusicFileRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_invitation_views: {
        Args: { target_id: string };
        Returns: void;
      };
      log_admin_action: {
        Args: {
          p_action: string;
          p_target_type: string;
          p_target_id?: string | null;
          p_previous_status?: string | null;
          p_new_status?: string | null;
          p_metadata?: Record<string, unknown>;
        };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
