/**
 * Hand-written mirror of supabase/migrations/*.sql. Keep in sync when the
 * schema changes — every Supabase client in the app is typed through this.
 */

export type LanguageCode = "ar" | "fr" | "en";
export type PlatformRole = "user" | "super_admin";
export type RestaurantRole = "owner" | "manager" | "staff";
export type RestaurantStatus = "active" | "suspended";
export type MenuTheme = "classic" | "modern" | "elegant" | "minimal" | "dark" | "coffee" | "restaurant";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "expired";
export type OrderStatus = "pending" | "confirmed" | "preparing" | "served" | "cancelled";
export type ViewSource = "qr" | "direct" | "link";
export type InteractionKind = "product" | "category" | "search";

export interface Json {
  [key: string]: unknown;
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  platform_role: PlatformRole;
  preferred_language: LanguageCode;
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

type RestaurantRow = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  restaurant_type: string | null;
  name_ar: string | null;
  name_fr: string | null;
  name_en: string | null;
  description_ar: string | null;
  description_fr: string | null;
  description_en: string | null;
  logo_url: string | null;
  cover_url: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  currency: string;
  default_language: LanguageCode;
  available_languages: LanguageCode[];
  primary_color: string;
  secondary_color: string;
  theme: MenuTheme;
  status: RestaurantStatus;
  is_published: boolean;
  suspended_reason: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

type RestaurantMemberRow = {
  id: string;
  restaurant_id: string;
  user_id: string;
  role: RestaurantRole;
  created_at: string;
  updated_at: string;
}

type RestaurantSettingsRow = {
  restaurant_id: string;
  show_unavailable_products: boolean;
  show_prices: boolean;
  enable_search: boolean;
  enable_cart: boolean;
  show_product_images: boolean;
  allow_search_indexing: boolean;
  price_decimals: number;
  opening_hours: JsonValue;
  social_links: JsonValue;
  announcement_ar: string | null;
  announcement_fr: string | null;
  announcement_en: string | null;
  created_at: string;
  updated_at: string;
}

type CategoryRow = {
  id: string;
  restaurant_id: string;
  name_ar: string | null;
  name_fr: string | null;
  name_en: string | null;
  description_ar: string | null;
  description_fr: string | null;
  description_en: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

type ProductRow = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name_ar: string | null;
  name_fr: string | null;
  name_en: string | null;
  description_ar: string | null;
  description_fr: string | null;
  description_en: string | null;
  price: number;
  compare_at_price: number | null;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

type ProductOptionGroupRow = {
  id: string;
  restaurant_id: string;
  product_id: string;
  name_ar: string | null;
  name_fr: string | null;
  name_en: string | null;
  is_required: boolean;
  min_select: number;
  max_select: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

type ProductOptionRow = {
  id: string;
  restaurant_id: string;
  group_id: string;
  name_ar: string | null;
  name_fr: string | null;
  name_en: string | null;
  price_delta: number;
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

type RestaurantTableRow = {
  id: string;
  restaurant_id: string;
  name: string;
  identifier: string;
  zone: string | null;
  seats: number | null;
  is_active: boolean;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

type QrCodeRow = {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  token: string;
  label: string | null;
  is_active: boolean;
  scan_count: number;
  last_scanned_at: string | null;
  created_at: string;
  updated_at: string;
}

type MenuViewRow = {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  qr_code_id: string | null;
  session_identifier: string;
  locale: LanguageCode | null;
  source: ViewSource;
  viewed_at: string;
}

type MenuInteractionRow = {
  id: string;
  restaurant_id: string;
  kind: InteractionKind;
  target_id: string | null;
  session_identifier: string;
  occurred_at: string;
}

type OrderRow = {
  id: string;
  restaurant_id: string;
  table_id: string | null;
  status: OrderStatus;
  currency: string;
  subtotal: number;
  total: number;
  customer_note: string | null;
  session_identifier: string | null;
  created_at: string;
  updated_at: string;
}

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  name_snapshot: string;
  quantity: number;
  unit_price: number;
  options_snapshot: JsonValue;
  line_total: number;
  created_at: string;
}

type SubscriptionPlanRow = {
  id: string;
  code: string;
  name_ar: string;
  name_fr: string;
  name_en: string;
  description_ar: string | null;
  description_fr: string | null;
  description_en: string | null;
  price_monthly: number;
  price_yearly: number;
  currency: string;
  max_categories: number | null;
  max_products: number | null;
  max_tables: number | null;
  max_members: number | null;
  features: JsonValue;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

type SubscriptionRow = {
  id: string;
  restaurant_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  provider: string;
  provider_reference: string | null;
  current_period_start: string;
  current_period_end: string | null;
  trial_ends_at: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

type AdminAuditLogRow = {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: JsonValue;
  created_at: string;
}

type Insertable<Row, Required extends keyof Row, Generated extends keyof Row = never> = Pick<Row, Required> &
  Partial<Omit<Row, Required | Generated>>;

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: Insertable<ProfileRow, "id">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
      restaurants: {
        Row: RestaurantRow;
        Insert: Insertable<RestaurantRow, "owner_id" | "name" | "slug", "id" | "created_at" | "updated_at">;
        Update: Partial<RestaurantRow>;
        Relationships: [];
      };
      restaurant_members: {
        Row: RestaurantMemberRow;
        Insert: Insertable<RestaurantMemberRow, "restaurant_id" | "user_id", "id" | "created_at" | "updated_at">;
        Update: Partial<RestaurantMemberRow>;
        Relationships: [];
      };
      restaurant_settings: {
        Row: RestaurantSettingsRow;
        Insert: Insertable<RestaurantSettingsRow, "restaurant_id", "created_at" | "updated_at">;
        Update: Partial<RestaurantSettingsRow>;
        Relationships: [];
      };
      categories: {
        Row: CategoryRow;
        Insert: Insertable<CategoryRow, "restaurant_id", "id" | "created_at" | "updated_at">;
        Update: Partial<CategoryRow>;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: Insertable<ProductRow, "restaurant_id", "id" | "created_at" | "updated_at">;
        Update: Partial<ProductRow>;
        Relationships: [];
      };
      product_option_groups: {
        Row: ProductOptionGroupRow;
        Insert: Insertable<ProductOptionGroupRow, "restaurant_id" | "product_id", "id" | "created_at" | "updated_at">;
        Update: Partial<ProductOptionGroupRow>;
        Relationships: [];
      };
      product_options: {
        Row: ProductOptionRow;
        Insert: Insertable<ProductOptionRow, "restaurant_id" | "group_id", "id" | "created_at" | "updated_at">;
        Update: Partial<ProductOptionRow>;
        Relationships: [];
      };
      restaurant_tables: {
        Row: RestaurantTableRow;
        Insert: Insertable<RestaurantTableRow, "restaurant_id" | "name" | "identifier", "id" | "created_at" | "updated_at">;
        Update: Partial<RestaurantTableRow>;
        Relationships: [];
      };
      qr_codes: {
        Row: QrCodeRow;
        Insert: Insertable<QrCodeRow, "restaurant_id" | "token", "id" | "created_at" | "updated_at">;
        Update: Partial<QrCodeRow>;
        Relationships: [];
      };
      menu_views: {
        Row: MenuViewRow;
        Insert: Insertable<MenuViewRow, "restaurant_id" | "session_identifier", "id" | "viewed_at">;
        Update: Partial<MenuViewRow>;
        Relationships: [];
      };
      menu_interactions: {
        Row: MenuInteractionRow;
        Insert: Insertable<MenuInteractionRow, "restaurant_id" | "kind" | "session_identifier", "id" | "occurred_at">;
        Update: Partial<MenuInteractionRow>;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: Insertable<OrderRow, "restaurant_id", "id" | "created_at" | "updated_at">;
        Update: Partial<OrderRow>;
        Relationships: [];
      };
      order_items: {
        Row: OrderItemRow;
        Insert: Insertable<OrderItemRow, "order_id" | "name_snapshot" | "unit_price" | "line_total", "id" | "created_at">;
        Update: Partial<OrderItemRow>;
        Relationships: [];
      };
      subscription_plans: {
        Row: SubscriptionPlanRow;
        Insert: Insertable<SubscriptionPlanRow, "code" | "name_ar" | "name_fr" | "name_en", "id" | "created_at" | "updated_at">;
        Update: Partial<SubscriptionPlanRow>;
        Relationships: [];
      };
      subscriptions: {
        Row: SubscriptionRow;
        Insert: Insertable<SubscriptionRow, "restaurant_id" | "plan_id", "id" | "created_at" | "updated_at">;
        Update: Partial<SubscriptionRow>;
        Relationships: [];
      };
      admin_audit_log: {
        Row: AdminAuditLogRow;
        Insert: Insertable<AdminAuditLogRow, "action" | "target_type", "id" | "created_at">;
        Update: Partial<AdminAuditLogRow>;
        Relationships: [];
      };
    };
    // `{ [_ in never]: never }`, not `Record<string, never>`: postgrest-js
    // intersects Tables with Views, and an index signature of `never` would
    // collapse every row type to `never`.
    Views: { [_ in never]: never };
    Functions: {
      resolve_qr_token: {
        Args: { p_slug: string; p_token: string };
        Returns: { qr_code_id: string; restaurant_id: string; table_id: string | null; table_name: string | null }[];
      };
      track_menu_view: {
        Args: {
          p_restaurant: string;
          p_session: string;
          p_table?: string | null;
          p_qr?: string | null;
          p_locale?: LanguageCode | null;
          p_source?: ViewSource;
        };
        Returns: undefined;
      };
      track_menu_interaction: {
        Args: { p_restaurant: string; p_session: string; p_kind: InteractionKind; p_target?: string | null };
        Returns: undefined;
      };
      restaurant_analytics_summary: {
        Args: { p_restaurant: string };
        Returns: {
          views_today: number;
          views_week: number;
          views_month: number;
          views_total: number;
          scans_today: number;
          scans_week: number;
          scans_month: number;
          scans_total: number;
          unique_visitors_month: number;
        }[];
      };
      restaurant_views_timeseries: {
        Args: { p_restaurant: string; p_days?: number };
        Returns: { day: string; views: number; scans: number }[];
      };
      restaurant_top_products: {
        Args: { p_restaurant: string; p_days?: number; p_limit?: number };
        Returns: { product_id: string; name_ar: string | null; name_fr: string | null; name_en: string | null; views: number }[];
      };
      restaurant_top_categories: {
        Args: { p_restaurant: string; p_days?: number; p_limit?: number };
        Returns: { category_id: string; name_ar: string | null; name_fr: string | null; name_en: string | null; views: number }[];
      };
      restaurant_table_activity: {
        Args: { p_restaurant: string; p_days?: number };
        Returns: { table_id: string; table_name: string; scans: number; last_scan: string | null }[];
      };
      restaurant_usage: {
        Args: { p_restaurant: string };
        Returns: {
          categories_used: number;
          categories_limit: number | null;
          products_used: number;
          products_limit: number | null;
          tables_used: number;
          tables_limit: number | null;
          members_used: number;
          members_limit: number | null;
        }[];
      };
      set_product_availability: {
        Args: { p_product: string; p_available: boolean };
        Returns: undefined;
      };
      add_restaurant_member_by_email: {
        Args: { p_restaurant: string; p_email: string; p_role?: RestaurantRole };
        Returns: string;
      };
      admin_platform_stats: {
        Args: Record<string, never>;
        Returns: {
          total_restaurants: number;
          active_restaurants: number;
          suspended_restaurants: number;
          new_restaurants_month: number;
          total_users: number;
          new_users_month: number;
          total_qr_codes: number;
          total_menu_views: number;
          menu_views_month: number;
          total_products: number;
          total_tables: number;
        }[];
      };
      admin_restaurants: {
        Args: { p_search?: string | null; p_status?: string | null; p_limit?: number; p_offset?: number };
        Returns: {
          id: string;
          name: string;
          slug: string;
          status: RestaurantStatus;
          is_published: boolean;
          created_at: string;
          owner_id: string;
          owner_email: string | null;
          owner_name: string | null;
          plan_code: string | null;
          subscription_status: SubscriptionStatus | null;
          product_count: number;
          category_count: number;
          table_count: number;
          view_count: number;
          total_count: number;
        }[];
      };
      admin_users: {
        Args: { p_search?: string | null; p_limit?: number; p_offset?: number };
        Returns: {
          id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          platform_role: PlatformRole;
          is_suspended: boolean;
          created_at: string;
          restaurant_count: number;
          total_count: number;
        }[];
      };
      admin_set_restaurant_status: {
        Args: { p_restaurant: string; p_status: RestaurantStatus; p_reason?: string | null };
        Returns: undefined;
      };
      admin_set_user_role: {
        Args: { p_user: string; p_role: PlatformRole };
        Returns: undefined;
      };
      admin_set_user_suspended: {
        Args: { p_user: string; p_suspended: boolean };
        Returns: undefined;
      };
      admin_set_restaurant_plan: {
        Args: { p_restaurant: string; p_plan_code: string; p_status?: SubscriptionStatus; p_period_end?: string | null };
        Returns: undefined;
      };
      admin_subscription_breakdown: {
        Args: Record<string, never>;
        Returns: { plan_code: string; plan_name_en: string; restaurants: number; active: number }[];
      };
      seed_demo_restaurant: {
        Args: { p_owner: string; p_slug?: string };
        Returns: string;
      };
      remove_demo_restaurant: {
        Args: { p_slug?: string };
        Returns: undefined;
      };
    };
    Enums: {
      platform_role: PlatformRole;
      restaurant_role: RestaurantRole;
      restaurant_status: RestaurantStatus;
      language_code: LanguageCode;
      menu_theme: MenuTheme;
      subscription_status: SubscriptionStatus;
      order_status: OrderStatus;
      view_source: ViewSource;
      interaction_kind: InteractionKind;
    };
    CompositeTypes: { [_ in never]: never };
  };
}

type Tables = Database["public"]["Tables"];

export type Profile = Tables["profiles"]["Row"];
export type Restaurant = Tables["restaurants"]["Row"];
export type RestaurantMember = Tables["restaurant_members"]["Row"];
export type RestaurantSettings = Tables["restaurant_settings"]["Row"];
export type Category = Tables["categories"]["Row"];
export type Product = Tables["products"]["Row"];
export type ProductOptionGroup = Tables["product_option_groups"]["Row"];
export type ProductOption = Tables["product_options"]["Row"];
export type RestaurantTable = Tables["restaurant_tables"]["Row"];
export type QrCode = Tables["qr_codes"]["Row"];
export type SubscriptionPlan = Tables["subscription_plans"]["Row"];
export type Subscription = Tables["subscriptions"]["Row"];
export type AdminAuditLogEntry = Tables["admin_audit_log"]["Row"];
