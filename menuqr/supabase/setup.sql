-- ============================================================================
-- MenuQR — complete database setup, in one file.
--
-- GENERATED FILE — do not edit. Regenerate with supabase/build-setup.sh.
-- The sources of truth are supabase/migrations/*.sql and supabase/seed.sql.
--
-- Paste the whole file into the Supabase SQL Editor (Dashboard -> SQL Editor
-- -> New query) and run it. It is safe to run more than once: tables use
-- IF NOT EXISTS, policies are dropped before being recreated, and the plan
-- rows upsert on their code.
--
-- It does NOT create any user. Sign up through the app first, then promote
-- yourself:
--   update public.profiles set platform_role = 'super_admin'
--    where email = 'you@example.com';
-- ============================================================================

begin;


-- ===========================================================================
-- migrations/0001_init.sql
-- ===========================================================================

-- ============================================================================
-- MenuQR — 0001_init
-- Core multi-tenant schema: profiles, restaurants, menu content, tables,
-- QR codes, analytics, orders, subscriptions.
--
-- Authorization model
-- -------------------
-- Row Level Security is the single source of truth. Every client (browser)
-- talks to Postgres with the signed-in user's own JWT via PostgREST, so a
-- restaurant owner physically cannot read or write another restaurant's rows
-- regardless of what the client sends. There is no service-role key in the
-- application; the few operations that need elevated privilege (bootstrapping
-- a restaurant's owner row, anonymous view tracking, admin actions) are narrow
-- SECURITY DEFINER functions with a locked search_path.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.platform_role as enum ('user', 'super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.restaurant_role as enum ('owner', 'manager', 'staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.restaurant_status as enum ('active', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.language_code as enum ('ar', 'fr', 'en');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.menu_theme as enum ('classic', 'modern', 'elegant', 'minimal', 'dark', 'coffee', 'restaurant');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'expired');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('pending', 'confirmed', 'preparing', 'served', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.view_source as enum ('qr', 'direct', 'link');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.interaction_kind as enum ('product', 'category', 'search');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — one row per auth.users row
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  platform_role public.platform_role not null default 'user',
  preferred_language public.language_code not null default 'ar',
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_platform_role_idx on public.profiles (platform_role);
create index if not exists profiles_email_idx on public.profiles (lower(email));

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- restaurants
-- ---------------------------------------------------------------------------

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name text not null check (char_length(trim(name)) between 2 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$'),
  restaurant_type text,

  name_ar text,
  name_fr text,
  name_en text,
  description_ar text,
  description_fr text,
  description_en text,

  logo_url text,
  cover_url text,

  phone text,
  email text,
  address text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  google_maps_url text,

  currency text not null default 'TND' check (char_length(currency) between 2 and 8),
  default_language public.language_code not null default 'ar',
  available_languages public.language_code[] not null default array['ar', 'fr', 'en']::public.language_code[],

  primary_color text not null default '#0F766E' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  secondary_color text not null default '#F59E0B' check (secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  theme public.menu_theme not null default 'modern',

  status public.restaurant_status not null default 'active',
  is_published boolean not null default true,
  suspended_reason text,

  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint restaurants_available_languages_not_empty check (array_length(available_languages, 1) >= 1)
);

create index if not exists restaurants_owner_idx on public.restaurants (owner_id);
create index if not exists restaurants_status_idx on public.restaurants (status) where deleted_at is null;
create index if not exists restaurants_created_at_idx on public.restaurants (created_at desc);

drop trigger if exists restaurants_touch_updated_at on public.restaurants;
create trigger restaurants_touch_updated_at
  before update on public.restaurants
  for each row execute function public.touch_updated_at();

create or replace function public.is_restaurant_public(p_restaurant uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.restaurants r
    where r.id = p_restaurant
      and r.deleted_at is null
      and r.status = 'active'
      and r.is_published = true
  );
$$;

-- ---------------------------------------------------------------------------
-- restaurant_members
-- ---------------------------------------------------------------------------

create table if not exists public.restaurant_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.restaurant_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, user_id)
);

create index if not exists restaurant_members_user_idx on public.restaurant_members (user_id);

drop trigger if exists restaurant_members_touch_updated_at on public.restaurant_members;
create trigger restaurant_members_touch_updated_at
  before update on public.restaurant_members
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Authorization helpers (SECURITY DEFINER so policies never recurse)
-- ---------------------------------------------------------------------------

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.platform_role = 'super_admin'
      and p.is_suspended = false
  );
$$;

create or replace function public.is_restaurant_member(p_restaurant uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.restaurant_members m
    where m.restaurant_id = p_restaurant
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.restaurant_role_of(p_restaurant uuid)
returns public.restaurant_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.role from public.restaurant_members m
  where m.restaurant_id = p_restaurant
    and m.user_id = auth.uid()
  limit 1;
$$;

-- Owner or manager: full menu / table / QR management.
create or replace function public.can_manage_restaurant(p_restaurant uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_super_admin() or exists (
    select 1 from public.restaurant_members m
    where m.restaurant_id = p_restaurant
      and m.user_id = auth.uid()
      and m.role in ('owner', 'manager')
  );
$$;

-- Owner only: restaurant profile, team, subscription, deletion.
create or replace function public.can_administer_restaurant(p_restaurant uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_super_admin() or exists (
    select 1 from public.restaurant_members m
    where m.restaurant_id = p_restaurant
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

-- ---------------------------------------------------------------------------
-- restaurant_settings — behaviour toggles, kept apart from branding
-- ---------------------------------------------------------------------------

create table if not exists public.restaurant_settings (
  restaurant_id uuid primary key references public.restaurants (id) on delete cascade,
  show_unavailable_products boolean not null default true,
  show_prices boolean not null default true,
  enable_search boolean not null default true,
  enable_cart boolean not null default false,
  show_product_images boolean not null default true,
  allow_search_indexing boolean not null default true,
  price_decimals smallint not null default 3 check (price_decimals between 0 and 3),
  opening_hours jsonb not null default '[]'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  announcement_ar text,
  announcement_fr text,
  announcement_en text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists restaurant_settings_touch_updated_at on public.restaurant_settings;
create trigger restaurant_settings_touch_updated_at
  before update on public.restaurant_settings
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name_ar text,
  name_fr text,
  name_en text,
  description_ar text,
  description_fr text,
  description_en text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_has_a_name check (
    coalesce(nullif(trim(name_ar), ''), nullif(trim(name_fr), ''), nullif(trim(name_en), '')) is not null
  )
);

create index if not exists categories_restaurant_idx on public.categories (restaurant_id, sort_order) where deleted_at is null;

drop trigger if exists categories_touch_updated_at on public.categories;
create trigger categories_touch_updated_at
  before update on public.categories
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  name_ar text,
  name_fr text,
  name_en text,
  description_ar text,
  description_fr text,
  description_en text,
  price numeric(10, 3) not null default 0 check (price >= 0 and price < 1000000),
  compare_at_price numeric(10, 3) check (compare_at_price >= 0 and compare_at_price < 1000000),
  image_url text,
  is_available boolean not null default true,
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_has_a_name check (
    coalesce(nullif(trim(name_ar), ''), nullif(trim(name_fr), ''), nullif(trim(name_en), '')) is not null
  )
);

create index if not exists products_restaurant_idx on public.products (restaurant_id, sort_order) where deleted_at is null;
create index if not exists products_category_idx on public.products (category_id, sort_order) where deleted_at is null;
create index if not exists products_featured_idx on public.products (restaurant_id) where deleted_at is null and is_featured = true;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
  before update on public.products
  for each row execute function public.touch_updated_at();

-- Products must stay inside their own restaurant's categories.
create or replace function public.enforce_product_category_tenant()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.category_id is not null then
    if not exists (
      select 1 from public.categories c
      where c.id = new.category_id and c.restaurant_id = new.restaurant_id
    ) then
      raise exception 'Category % does not belong to restaurant %', new.category_id, new.restaurant_id
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists products_enforce_category_tenant on public.products;
create trigger products_enforce_category_tenant
  before insert or update of category_id, restaurant_id on public.products
  for each row execute function public.enforce_product_category_tenant();

-- ---------------------------------------------------------------------------
-- product options (size / extras / …)
-- ---------------------------------------------------------------------------

create table if not exists public.product_option_groups (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  name_ar text,
  name_fr text,
  name_en text,
  is_required boolean not null default false,
  min_select smallint not null default 0 check (min_select >= 0),
  max_select smallint not null default 1 check (max_select >= 1),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint option_group_select_range check (min_select <= max_select),
  constraint option_group_has_a_name check (
    coalesce(nullif(trim(name_ar), ''), nullif(trim(name_fr), ''), nullif(trim(name_en), '')) is not null
  )
);

create index if not exists product_option_groups_product_idx on public.product_option_groups (product_id, sort_order);

drop trigger if exists product_option_groups_touch_updated_at on public.product_option_groups;
create trigger product_option_groups_touch_updated_at
  before update on public.product_option_groups
  for each row execute function public.touch_updated_at();

create table if not exists public.product_options (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  group_id uuid not null references public.product_option_groups (id) on delete cascade,
  name_ar text,
  name_fr text,
  name_en text,
  price_delta numeric(10, 3) not null default 0 check (price_delta > -1000000 and price_delta < 1000000),
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint option_has_a_name check (
    coalesce(nullif(trim(name_ar), ''), nullif(trim(name_fr), ''), nullif(trim(name_en), '')) is not null
  )
);

create index if not exists product_options_group_idx on public.product_options (group_id, sort_order);

drop trigger if exists product_options_touch_updated_at on public.product_options;
create trigger product_options_touch_updated_at
  before update on public.product_options
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- restaurant_tables  (physical tables: "Table 1", "Terrasse 2", "VIP 1")
-- ---------------------------------------------------------------------------

create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 60),
  identifier text not null check (identifier ~ '^[a-z0-9][a-z0-9-]{0,38}$'),
  zone text,
  seats smallint check (seats > 0 and seats <= 100),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, identifier)
);

create index if not exists restaurant_tables_restaurant_idx on public.restaurant_tables (restaurant_id, sort_order) where deleted_at is null;

drop trigger if exists restaurant_tables_touch_updated_at on public.restaurant_tables;
create trigger restaurant_tables_touch_updated_at
  before update on public.restaurant_tables
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- qr_codes — a stable token per printed QR. Regenerating mints a new token
-- (and retires the printed card); renaming a table never breaks a QR.
-- ---------------------------------------------------------------------------

create table if not exists public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id uuid references public.restaurant_tables (id) on delete cascade,
  token text not null unique check (token ~ '^[A-Za-z0-9_-]{8,64}$'),
  label text,
  is_active boolean not null default true,
  scan_count integer not null default 0,
  last_scanned_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists qr_codes_restaurant_idx on public.qr_codes (restaurant_id);
create unique index if not exists qr_codes_one_per_table_idx on public.qr_codes (table_id) where table_id is not null;
create unique index if not exists qr_codes_one_general_per_restaurant_idx on public.qr_codes (restaurant_id) where table_id is null;

drop trigger if exists qr_codes_touch_updated_at on public.qr_codes;
create trigger qr_codes_touch_updated_at
  before update on public.qr_codes
  for each row execute function public.touch_updated_at();

-- 16 random bytes from a v4 UUID, base64 with a URL-safe alphabet.
--
-- Deliberately avoids pgcrypto's gen_random_bytes(): Supabase installs
-- extensions into their own `extensions` schema, which the locked search_path
-- of the SECURITY DEFINER callers cannot see, so a venue could not be created
-- at all. gen_random_uuid() is core Postgres and always reachable.
create or replace function public.generate_qr_token()
returns text
language sql
volatile
set search_path = public, pg_temp
as $$
  select translate(
    encode(decode(replace(gen_random_uuid()::text, '-', ''), 'hex'), 'base64'),
    '+/=',
    '-_x'
  );
$$;

-- Every table gets its QR the moment it is created.
create or replace function public.handle_new_table()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.qr_codes (restaurant_id, table_id, token, label)
  values (new.restaurant_id, new.id, public.generate_qr_token(), new.name)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists restaurant_tables_create_qr on public.restaurant_tables;
create trigger restaurant_tables_create_qr
  after insert on public.restaurant_tables
  for each row execute function public.handle_new_table();

-- ---------------------------------------------------------------------------
-- analytics
-- ---------------------------------------------------------------------------

create table if not exists public.menu_views (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id uuid references public.restaurant_tables (id) on delete set null,
  qr_code_id uuid references public.qr_codes (id) on delete set null,
  session_identifier text not null check (char_length(session_identifier) between 8 and 64),
  locale public.language_code,
  source public.view_source not null default 'direct',
  viewed_at timestamptz not null default now()
);

create index if not exists menu_views_restaurant_time_idx on public.menu_views (restaurant_id, viewed_at desc);
create index if not exists menu_views_table_idx on public.menu_views (table_id, viewed_at desc);
create index if not exists menu_views_session_idx on public.menu_views (restaurant_id, session_identifier, viewed_at desc);

create table if not exists public.menu_interactions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  kind public.interaction_kind not null,
  target_id uuid,
  session_identifier text not null check (char_length(session_identifier) between 8 and 64),
  occurred_at timestamptz not null default now()
);

create index if not exists menu_interactions_restaurant_time_idx on public.menu_interactions (restaurant_id, occurred_at desc);
create index if not exists menu_interactions_target_idx on public.menu_interactions (restaurant_id, kind, target_id);

-- ---------------------------------------------------------------------------
-- orders — table-side ordering is a post-MVP feature; the schema is in place
-- so it can be switched on without a migration of existing data.
-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id uuid references public.restaurant_tables (id) on delete set null,
  status public.order_status not null default 'pending',
  currency text not null default 'TND',
  subtotal numeric(10, 3) not null default 0 check (subtotal >= 0),
  total numeric(10, 3) not null default 0 check (total >= 0),
  customer_note text,
  session_identifier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_restaurant_idx on public.orders (restaurant_id, created_at desc);

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  name_snapshot text not null,
  quantity smallint not null default 1 check (quantity > 0 and quantity <= 99),
  unit_price numeric(10, 3) not null check (unit_price >= 0),
  options_snapshot jsonb not null default '[]'::jsonb,
  line_total numeric(10, 3) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z_]{2,24}$'),
  name_ar text not null,
  name_fr text not null,
  name_en text not null,
  description_ar text,
  description_fr text,
  description_en text,
  price_monthly numeric(10, 3) not null default 0 check (price_monthly >= 0),
  price_yearly numeric(10, 3) not null default 0 check (price_yearly >= 0),
  currency text not null default 'TND',
  max_categories integer check (max_categories is null or max_categories > 0),
  max_products integer check (max_products is null or max_products > 0),
  max_tables integer check (max_tables is null or max_tables > 0),
  max_members integer check (max_members is null or max_members > 0),
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists subscription_plans_touch_updated_at on public.subscription_plans;
create trigger subscription_plans_touch_updated_at
  before update on public.subscription_plans
  for each row execute function public.touch_updated_at();

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null unique references public.restaurants (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id) on delete restrict,
  status public.subscription_status not null default 'active',
  -- Payment provider is deliberately abstract: no gateway is wired up yet, so
  -- every subscription is created and changed manually until one is.
  provider text not null default 'manual',
  provider_reference text,
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz,
  trial_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_plan_idx on public.subscriptions (plan_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);

drop trigger if exists subscriptions_touch_updated_at on public.subscriptions;
create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- admin audit log
-- ---------------------------------------------------------------------------

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);

-- ---------------------------------------------------------------------------
-- Restaurant bootstrap: owner membership + settings + free plan + house QR.
-- SECURITY DEFINER because the creator is not a member yet at this point.
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_restaurant()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_free_plan uuid;
begin
  insert into public.restaurant_members (restaurant_id, user_id, role)
  values (new.id, new.owner_id, 'owner')
  on conflict (restaurant_id, user_id) do nothing;

  insert into public.restaurant_settings (restaurant_id)
  values (new.id)
  on conflict (restaurant_id) do nothing;

  insert into public.qr_codes (restaurant_id, table_id, token, label)
  values (new.id, null, public.generate_qr_token(), 'General')
  on conflict do nothing;

  select id into v_free_plan from public.subscription_plans where code = 'free' limit 1;
  if v_free_plan is not null then
    insert into public.subscriptions (restaurant_id, plan_id, status)
    values (new.id, v_free_plan, 'active')
    on conflict (restaurant_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists restaurants_bootstrap on public.restaurants;
create trigger restaurants_bootstrap
  after insert on public.restaurants
  for each row execute function public.handle_new_restaurant();

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.restaurant_settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_option_groups enable row level security;
alter table public.product_options enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.qr_codes enable row level security;
alter table public.menu_views enable row level security;
alter table public.menu_interactions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.admin_audit_log enable row level security;

-- profiles -------------------------------------------------------------------

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles: read teammates" on public.profiles;
create policy "profiles: read teammates"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.restaurant_members mine
      join public.restaurant_members theirs on theirs.restaurant_id = mine.restaurant_id
      where mine.user_id = auth.uid()
        and theirs.user_id = public.profiles.id
    )
  );

drop policy if exists "profiles: admins read all" on public.profiles;
create policy "profiles: admins read all"
  on public.profiles for select
  to authenticated
  using (public.is_super_admin());

-- platform_role / is_suspended are protected by the trigger below, so a user
-- updating their own row cannot promote themselves.
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "profiles: admins update all" on public.profiles;
create policy "profiles: admins update all"
  on public.profiles for update
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- auth.uid() is NULL in trusted server contexts (the SQL editor, service
  -- role), which is how the very first administrator is bootstrapped. Signed-in
  -- users never get past this, so nobody can promote themselves.
  if auth.uid() is null or public.is_super_admin() then
    return new;
  end if;
  new.platform_role = old.platform_role;
  new.is_suspended = old.is_suspended;
  return new;
end;
$$;

drop trigger if exists profiles_protect_privileges on public.profiles;
create trigger profiles_protect_privileges
  before update on public.profiles
  for each row execute function public.protect_profile_privileges();

-- restaurants ----------------------------------------------------------------

drop policy if exists "restaurants: public reads published" on public.restaurants;
create policy "restaurants: public reads published"
  on public.restaurants for select
  to anon, authenticated
  using (deleted_at is null and status = 'active' and is_published = true);

-- owner_id is checked directly as well as through membership: INSERT ... RETURNING
-- also applies SELECT policies, and the owner's membership row is only created
-- by the AFTER INSERT trigger, so an unpublished venue would otherwise be
-- unreadable by the person who just created it.
drop policy if exists "restaurants: members read own" on public.restaurants;
create policy "restaurants: members read own"
  on public.restaurants for select
  to authenticated
  using (owner_id = auth.uid() or public.is_restaurant_member(id) or public.is_super_admin());

drop policy if exists "restaurants: owner creates" on public.restaurants;
create policy "restaurants: owner creates"
  on public.restaurants for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and deleted_at is null
    and status = 'active'
    and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_suspended)
  );

drop policy if exists "restaurants: owner updates" on public.restaurants;
create policy "restaurants: owner updates"
  on public.restaurants for update
  to authenticated
  using (public.can_administer_restaurant(id))
  with check (public.can_administer_restaurant(id));

drop policy if exists "restaurants: owner deletes" on public.restaurants;
create policy "restaurants: owner deletes"
  on public.restaurants for delete
  to authenticated
  using (public.can_administer_restaurant(id));

-- Only a super admin may change a restaurant's status or reassign ownership.
create or replace function public.protect_restaurant_privileges()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or public.is_super_admin() then
    return new;
  end if;
  new.status = old.status;
  new.suspended_reason = old.suspended_reason;
  new.owner_id = old.owner_id;
  return new;
end;
$$;

drop trigger if exists restaurants_protect_privileges on public.restaurants;
create trigger restaurants_protect_privileges
  before update on public.restaurants
  for each row execute function public.protect_restaurant_privileges();

-- restaurant_members ---------------------------------------------------------

drop policy if exists "members: read own restaurants" on public.restaurant_members;
create policy "members: read own restaurants"
  on public.restaurant_members for select
  to authenticated
  using (user_id = auth.uid() or public.is_restaurant_member(restaurant_id) or public.is_super_admin());

drop policy if exists "members: owner manages" on public.restaurant_members;
create policy "members: owner manages"
  on public.restaurant_members for insert
  to authenticated
  with check (public.can_administer_restaurant(restaurant_id));

drop policy if exists "members: owner updates" on public.restaurant_members;
create policy "members: owner updates"
  on public.restaurant_members for update
  to authenticated
  using (public.can_administer_restaurant(restaurant_id))
  with check (public.can_administer_restaurant(restaurant_id));

drop policy if exists "members: owner removes" on public.restaurant_members;
create policy "members: owner removes"
  on public.restaurant_members for delete
  to authenticated
  using (public.can_administer_restaurant(restaurant_id) and role <> 'owner');

-- restaurant_settings --------------------------------------------------------

drop policy if exists "settings: public reads" on public.restaurant_settings;
create policy "settings: public reads"
  on public.restaurant_settings for select
  to anon, authenticated
  using (public.is_restaurant_public(restaurant_id));

drop policy if exists "settings: members read" on public.restaurant_settings;
create policy "settings: members read"
  on public.restaurant_settings for select
  to authenticated
  using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

drop policy if exists "settings: managers write" on public.restaurant_settings;
create policy "settings: managers write"
  on public.restaurant_settings for update
  to authenticated
  using (public.can_manage_restaurant(restaurant_id))
  with check (public.can_manage_restaurant(restaurant_id));

drop policy if exists "settings: managers insert" on public.restaurant_settings;
create policy "settings: managers insert"
  on public.restaurant_settings for insert
  to authenticated
  with check (public.can_manage_restaurant(restaurant_id));

-- categories -----------------------------------------------------------------

drop policy if exists "categories: public reads active" on public.categories;
create policy "categories: public reads active"
  on public.categories for select
  to anon, authenticated
  using (deleted_at is null and is_active = true and public.is_restaurant_public(restaurant_id));

drop policy if exists "categories: members read" on public.categories;
create policy "categories: members read"
  on public.categories for select
  to authenticated
  using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

drop policy if exists "categories: managers write" on public.categories;
create policy "categories: managers write"
  on public.categories for insert
  to authenticated
  with check (public.can_manage_restaurant(restaurant_id));

drop policy if exists "categories: managers update" on public.categories;
create policy "categories: managers update"
  on public.categories for update
  to authenticated
  using (public.can_manage_restaurant(restaurant_id))
  with check (public.can_manage_restaurant(restaurant_id));

drop policy if exists "categories: managers delete" on public.categories;
create policy "categories: managers delete"
  on public.categories for delete
  to authenticated
  using (public.can_manage_restaurant(restaurant_id));

-- products -------------------------------------------------------------------

drop policy if exists "products: public reads" on public.products;
create policy "products: public reads"
  on public.products for select
  to anon, authenticated
  using (
    deleted_at is null
    and public.is_restaurant_public(restaurant_id)
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = products.category_id and c.is_active = true and c.deleted_at is null
      )
    )
  );

drop policy if exists "products: members read" on public.products;
create policy "products: members read"
  on public.products for select
  to authenticated
  using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

drop policy if exists "products: managers write" on public.products;
create policy "products: managers write"
  on public.products for insert
  to authenticated
  with check (public.can_manage_restaurant(restaurant_id));

drop policy if exists "products: managers update" on public.products;
create policy "products: managers update"
  on public.products for update
  to authenticated
  using (public.can_manage_restaurant(restaurant_id))
  with check (public.can_manage_restaurant(restaurant_id));

drop policy if exists "products: managers delete" on public.products;
create policy "products: managers delete"
  on public.products for delete
  to authenticated
  using (public.can_manage_restaurant(restaurant_id));

-- product options ------------------------------------------------------------

drop policy if exists "option groups: public reads" on public.product_option_groups;
create policy "option groups: public reads"
  on public.product_option_groups for select
  to anon, authenticated
  using (public.is_restaurant_public(restaurant_id));

drop policy if exists "option groups: members read" on public.product_option_groups;
create policy "option groups: members read"
  on public.product_option_groups for select
  to authenticated
  using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

drop policy if exists "option groups: managers write" on public.product_option_groups;
create policy "option groups: managers write"
  on public.product_option_groups for all
  to authenticated
  using (public.can_manage_restaurant(restaurant_id))
  with check (public.can_manage_restaurant(restaurant_id));

drop policy if exists "options: public reads" on public.product_options;
create policy "options: public reads"
  on public.product_options for select
  to anon, authenticated
  using (public.is_restaurant_public(restaurant_id));

drop policy if exists "options: members read" on public.product_options;
create policy "options: members read"
  on public.product_options for select
  to authenticated
  using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

drop policy if exists "options: managers write" on public.product_options;
create policy "options: managers write"
  on public.product_options for all
  to authenticated
  using (public.can_manage_restaurant(restaurant_id))
  with check (public.can_manage_restaurant(restaurant_id));

-- restaurant_tables ----------------------------------------------------------

drop policy if exists "tables: members read" on public.restaurant_tables;
create policy "tables: members read"
  on public.restaurant_tables for select
  to authenticated
  using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

drop policy if exists "tables: managers write" on public.restaurant_tables;
create policy "tables: managers write"
  on public.restaurant_tables for insert
  to authenticated
  with check (public.can_manage_restaurant(restaurant_id));

drop policy if exists "tables: managers update" on public.restaurant_tables;
create policy "tables: managers update"
  on public.restaurant_tables for update
  to authenticated
  using (public.can_manage_restaurant(restaurant_id))
  with check (public.can_manage_restaurant(restaurant_id));

drop policy if exists "tables: managers delete" on public.restaurant_tables;
create policy "tables: managers delete"
  on public.restaurant_tables for delete
  to authenticated
  using (public.can_manage_restaurant(restaurant_id));

-- qr_codes -------------------------------------------------------------------
-- Anonymous visitors never read this table directly (that would let anyone
-- enumerate every restaurant's tokens); they resolve a token through the
-- resolve_qr_token() function in 0003_analytics.sql instead.

drop policy if exists "qr: members read" on public.qr_codes;
create policy "qr: members read"
  on public.qr_codes for select
  to authenticated
  using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

drop policy if exists "qr: managers write" on public.qr_codes;
create policy "qr: managers write"
  on public.qr_codes for all
  to authenticated
  using (public.can_manage_restaurant(restaurant_id))
  with check (public.can_manage_restaurant(restaurant_id));

-- analytics ------------------------------------------------------------------
-- Writes only happen through the SECURITY DEFINER tracking functions.

drop policy if exists "menu_views: members read" on public.menu_views;
create policy "menu_views: members read"
  on public.menu_views for select
  to authenticated
  using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

drop policy if exists "menu_interactions: members read" on public.menu_interactions;
create policy "menu_interactions: members read"
  on public.menu_interactions for select
  to authenticated
  using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

-- orders ---------------------------------------------------------------------

drop policy if exists "orders: members read" on public.orders;
create policy "orders: members read"
  on public.orders for select
  to authenticated
  using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

drop policy if exists "orders: managers write" on public.orders;
create policy "orders: managers write"
  on public.orders for all
  to authenticated
  using (public.can_manage_restaurant(restaurant_id))
  with check (public.can_manage_restaurant(restaurant_id));

drop policy if exists "order_items: members read" on public.order_items;
create policy "order_items: members read"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (public.is_restaurant_member(o.restaurant_id) or public.is_super_admin())
    )
  );

drop policy if exists "order_items: managers write" on public.order_items;
create policy "order_items: managers write"
  on public.order_items for all
  to authenticated
  using (
    exists (select 1 from public.orders o where o.id = order_items.order_id and public.can_manage_restaurant(o.restaurant_id))
  )
  with check (
    exists (select 1 from public.orders o where o.id = order_items.order_id and public.can_manage_restaurant(o.restaurant_id))
  );

-- subscriptions --------------------------------------------------------------

drop policy if exists "plans: readable by everyone" on public.subscription_plans;
create policy "plans: readable by everyone"
  on public.subscription_plans for select
  to anon, authenticated
  using (is_active = true or public.is_super_admin());

drop policy if exists "plans: admins write" on public.subscription_plans;
create policy "plans: admins write"
  on public.subscription_plans for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "subscriptions: members read" on public.subscriptions;
create policy "subscriptions: members read"
  on public.subscriptions for select
  to authenticated
  using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

-- Plan changes are an admin/billing operation, never a self-service write.
drop policy if exists "subscriptions: admins write" on public.subscriptions;
create policy "subscriptions: admins write"
  on public.subscriptions for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- admin audit log ------------------------------------------------------------

drop policy if exists "audit: admins read" on public.admin_audit_log;
create policy "audit: admins read"
  on public.admin_audit_log for select
  to authenticated
  using (public.is_super_admin());


-- ===========================================================================
-- migrations/0002_storage.sql
-- ===========================================================================

-- ============================================================================
-- MenuQR — 0002_storage
-- One public bucket for every menu image. Paths are always
--   {restaurant_id}/{kind}/{filename}
-- so write access can be authorized from the first path segment alone.
-- Reads are public: menu images are served straight from the CDN to phones on
-- weak connections, and nothing private is ever stored here.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Casting a malformed folder name would abort the policy check, so failures
-- degrade to NULL (and NULL is never a restaurant anyone can manage).
create or replace function public.safe_uuid(p_text text)
returns uuid
language plpgsql
immutable
as $$
begin
  return p_text::uuid;
exception when others then
  return null;
end;
$$;

drop policy if exists "menu images: public read" on storage.objects;
create policy "menu images: public read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'menu-images');

drop policy if exists "menu images: managers upload" on storage.objects;
create policy "menu images: managers upload"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'menu-images'
    and public.can_manage_restaurant(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "menu images: managers update" on storage.objects;
create policy "menu images: managers update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'menu-images'
    and public.can_manage_restaurant(public.safe_uuid((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'menu-images'
    and public.can_manage_restaurant(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "menu images: managers delete" on storage.objects;
create policy "menu images: managers delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'menu-images'
    and public.can_manage_restaurant(public.safe_uuid((storage.foldername(name))[1]))
  );


-- ===========================================================================
-- migrations/0003_analytics.sql
-- ===========================================================================

-- ============================================================================
-- MenuQR — 0003_analytics
-- Anonymous visitors get exactly two write capabilities, both through
-- SECURITY DEFINER functions that validate the restaurant is public and
-- de-duplicate aggressively. No direct INSERT grant on the analytics tables,
-- no personal data: a session identifier is a random string the browser keeps
-- in localStorage, never an IP, a fingerprint or a cookie profile.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- QR token → table resolution
-- ---------------------------------------------------------------------------

create or replace function public.resolve_qr_token(p_slug text, p_token text)
returns table (
  qr_code_id uuid,
  restaurant_id uuid,
  table_id uuid,
  table_name text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select q.id, q.restaurant_id, q.table_id, t.name
  from public.qr_codes q
  join public.restaurants r on r.id = q.restaurant_id
  left join public.restaurant_tables t
    on t.id = q.table_id and t.deleted_at is null and t.is_active = true
  where r.slug = p_slug
    and q.token = p_token
    and q.is_active = true
    and r.deleted_at is null
    and r.status = 'active'
    and r.is_published = true
  limit 1;
$$;

revoke all on function public.resolve_qr_token(text, text) from public;
grant execute on function public.resolve_qr_token(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- View tracking
-- ---------------------------------------------------------------------------

create or replace function public.track_menu_view(
  p_restaurant uuid,
  p_session text,
  p_table uuid default null,
  p_qr uuid default null,
  p_locale public.language_code default null,
  p_source public.view_source default 'direct'
)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_recent_count integer;
begin
  if p_session is null or char_length(p_session) < 8 or char_length(p_session) > 64 then
    return;
  end if;

  if not public.is_restaurant_public(p_restaurant) then
    return;
  end if;

  -- Cheap abuse guard: at most 20 recorded views per session per restaurant
  -- per hour, and never two rows for the same session inside 30 minutes.
  select count(*) into v_recent_count
  from public.menu_views v
  where v.restaurant_id = p_restaurant
    and v.session_identifier = p_session
    and v.viewed_at > now() - interval '1 hour';

  if v_recent_count >= 20 then
    return;
  end if;

  if exists (
    select 1 from public.menu_views v
    where v.restaurant_id = p_restaurant
      and v.session_identifier = p_session
      and v.viewed_at > now() - interval '30 minutes'
  ) then
    return;
  end if;

  insert into public.menu_views (restaurant_id, table_id, qr_code_id, session_identifier, locale, source)
  values (
    p_restaurant,
    (select t.id from public.restaurant_tables t where t.id = p_table and t.restaurant_id = p_restaurant),
    (select q.id from public.qr_codes q where q.id = p_qr and q.restaurant_id = p_restaurant),
    p_session,
    p_locale,
    p_source
  );

  if p_qr is not null then
    update public.qr_codes
      set scan_count = scan_count + 1,
          last_scanned_at = now()
      where id = p_qr and restaurant_id = p_restaurant;
  end if;
end;
$$;

revoke all on function public.track_menu_view(uuid, text, uuid, uuid, public.language_code, public.view_source) from public;
grant execute on function public.track_menu_view(uuid, text, uuid, uuid, public.language_code, public.view_source) to anon, authenticated;

create or replace function public.track_menu_interaction(
  p_restaurant uuid,
  p_session text,
  p_kind public.interaction_kind,
  p_target uuid default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_recent_count integer;
begin
  if p_session is null or char_length(p_session) < 8 or char_length(p_session) > 64 then
    return;
  end if;

  if not public.is_restaurant_public(p_restaurant) then
    return;
  end if;

  select count(*) into v_recent_count
  from public.menu_interactions i
  where i.restaurant_id = p_restaurant
    and i.session_identifier = p_session
    and i.occurred_at > now() - interval '1 hour';

  if v_recent_count >= 200 then
    return;
  end if;

  if exists (
    select 1 from public.menu_interactions i
    where i.restaurant_id = p_restaurant
      and i.session_identifier = p_session
      and i.kind = p_kind
      and i.target_id is not distinct from p_target
      and i.occurred_at > now() - interval '5 minutes'
  ) then
    return;
  end if;

  insert into public.menu_interactions (restaurant_id, kind, target_id, session_identifier)
  values (p_restaurant, p_kind, p_target, p_session);
end;
$$;

revoke all on function public.track_menu_interaction(uuid, text, public.interaction_kind, uuid) from public;
grant execute on function public.track_menu_interaction(uuid, text, public.interaction_kind, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reporting. These run as the caller, so RLS on menu_views / menu_interactions
-- is what stops one restaurant from reading another's numbers.
-- ---------------------------------------------------------------------------

create or replace function public.restaurant_analytics_summary(p_restaurant uuid)
returns table (
  views_today bigint,
  views_week bigint,
  views_month bigint,
  views_total bigint,
  scans_today bigint,
  scans_week bigint,
  scans_month bigint,
  scans_total bigint,
  unique_visitors_month bigint
)
language sql
stable
as $$
  select
    count(*) filter (where viewed_at >= date_trunc('day', now())),
    count(*) filter (where viewed_at >= now() - interval '7 days'),
    count(*) filter (where viewed_at >= now() - interval '30 days'),
    count(*),
    count(*) filter (where source = 'qr' and viewed_at >= date_trunc('day', now())),
    count(*) filter (where source = 'qr' and viewed_at >= now() - interval '7 days'),
    count(*) filter (where source = 'qr' and viewed_at >= now() - interval '30 days'),
    count(*) filter (where source = 'qr'),
    count(distinct session_identifier) filter (where viewed_at >= now() - interval '30 days')
  from public.menu_views
  where restaurant_id = p_restaurant;
$$;

create or replace function public.restaurant_views_timeseries(p_restaurant uuid, p_days integer default 30)
returns table (day date, views bigint, scans bigint)
language sql
stable
as $$
  select
    d::date as day,
    count(v.id) as views,
    count(v.id) filter (where v.source = 'qr') as scans
  from generate_series(
    date_trunc('day', now()) - ((greatest(least(p_days, 365), 1) - 1) || ' days')::interval,
    date_trunc('day', now()),
    interval '1 day'
  ) as d
  left join public.menu_views v
    on v.restaurant_id = p_restaurant
   and v.viewed_at >= d
   and v.viewed_at < d + interval '1 day'
  group by d
  order by d;
$$;

create or replace function public.restaurant_top_products(
  p_restaurant uuid,
  p_days integer default 30,
  p_limit integer default 5
)
returns table (product_id uuid, name_ar text, name_fr text, name_en text, views bigint)
language sql
stable
as $$
  select p.id, p.name_ar, p.name_fr, p.name_en, count(i.id) as views
  from public.menu_interactions i
  join public.products p on p.id = i.target_id and p.restaurant_id = p_restaurant
  where i.restaurant_id = p_restaurant
    and i.kind = 'product'
    and i.occurred_at >= now() - ((greatest(least(p_days, 365), 1)) || ' days')::interval
  group by p.id, p.name_ar, p.name_fr, p.name_en
  order by views desc, p.id
  limit greatest(least(p_limit, 50), 1);
$$;

create or replace function public.restaurant_top_categories(
  p_restaurant uuid,
  p_days integer default 30,
  p_limit integer default 5
)
returns table (category_id uuid, name_ar text, name_fr text, name_en text, views bigint)
language sql
stable
as $$
  select c.id, c.name_ar, c.name_fr, c.name_en, count(i.id) as views
  from public.menu_interactions i
  join public.categories c on c.id = i.target_id and c.restaurant_id = p_restaurant
  where i.restaurant_id = p_restaurant
    and i.kind = 'category'
    and i.occurred_at >= now() - ((greatest(least(p_days, 365), 1)) || ' days')::interval
  group by c.id, c.name_ar, c.name_fr, c.name_en
  order by views desc, c.id
  limit greatest(least(p_limit, 50), 1);
$$;

create or replace function public.restaurant_table_activity(
  p_restaurant uuid,
  p_days integer default 30
)
returns table (table_id uuid, table_name text, scans bigint, last_scan timestamptz)
language sql
stable
as $$
  select t.id, t.name, count(v.id) as scans, max(v.viewed_at) as last_scan
  from public.restaurant_tables t
  left join public.menu_views v
    on v.table_id = t.id
   and v.viewed_at >= now() - ((greatest(least(p_days, 365), 1)) || ' days')::interval
  where t.restaurant_id = p_restaurant
    and t.deleted_at is null
  group by t.id, t.name
  order by scans desc, t.name;
$$;

-- ---------------------------------------------------------------------------
-- Staff may flip availability without holding UPDATE on products.
-- ---------------------------------------------------------------------------

create or replace function public.set_product_availability(p_product uuid, p_available boolean)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_restaurant uuid;
begin
  select restaurant_id into v_restaurant
  from public.products
  where id = p_product and deleted_at is null;

  if v_restaurant is null then
    raise exception 'Product not found' using errcode = 'no_data_found';
  end if;

  if not public.is_restaurant_member(v_restaurant) and not public.is_super_admin() then
    raise exception 'Not allowed' using errcode = 'insufficient_privilege';
  end if;

  update public.products
    set is_available = p_available
    where id = p_product;
end;
$$;

revoke all on function public.set_product_availability(uuid, boolean) from public;
grant execute on function public.set_product_availability(uuid, boolean) to authenticated;


-- ===========================================================================
-- migrations/0004_admin.sql
-- ===========================================================================

-- ============================================================================
-- MenuQR — 0004_admin
-- Super-admin surface. Every function re-checks is_super_admin() itself, so a
-- normal user calling these RPCs directly gets an error rather than data, and
-- every state change is written to admin_audit_log.
-- ============================================================================

create or replace function public.assert_super_admin()
returns void
language plpgsql
stable
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Administrator privileges required' using errcode = 'insufficient_privilege';
  end if;
end;
$$;

create or replace function public.admin_platform_stats()
returns table (
  total_restaurants bigint,
  active_restaurants bigint,
  suspended_restaurants bigint,
  new_restaurants_month bigint,
  total_users bigint,
  new_users_month bigint,
  total_qr_codes bigint,
  total_menu_views bigint,
  menu_views_month bigint,
  total_products bigint,
  total_tables bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_super_admin();

  return query
  select
    (select count(*) from public.restaurants where deleted_at is null),
    (select count(*) from public.restaurants where deleted_at is null and status = 'active'),
    (select count(*) from public.restaurants where deleted_at is null and status = 'suspended'),
    (select count(*) from public.restaurants where deleted_at is null and created_at >= now() - interval '30 days'),
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where created_at >= now() - interval '30 days'),
    (select count(*) from public.qr_codes where is_active = true),
    (select count(*) from public.menu_views),
    (select count(*) from public.menu_views where viewed_at >= now() - interval '30 days'),
    (select count(*) from public.products where deleted_at is null),
    (select count(*) from public.restaurant_tables where deleted_at is null);
end;
$$;

revoke all on function public.admin_platform_stats() from public;
grant execute on function public.admin_platform_stats() to authenticated;

create or replace function public.admin_restaurants(
  p_search text default null,
  p_status text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  name text,
  slug text,
  status public.restaurant_status,
  is_published boolean,
  created_at timestamptz,
  owner_id uuid,
  owner_email text,
  owner_name text,
  plan_code text,
  subscription_status public.subscription_status,
  product_count bigint,
  category_count bigint,
  table_count bigint,
  view_count bigint,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_super_admin();

  return query
  with filtered as (
    select r.*
    from public.restaurants r
    left join public.profiles p on p.id = r.owner_id
    where r.deleted_at is null
      and (
        p_search is null or trim(p_search) = ''
        or r.name ilike '%' || trim(p_search) || '%'
        or r.slug ilike '%' || trim(p_search) || '%'
        or coalesce(p.email, '') ilike '%' || trim(p_search) || '%'
      )
      and (p_status is null or p_status = '' or r.status::text = p_status)
  )
  select
    f.id,
    f.name,
    f.slug,
    f.status,
    f.is_published,
    f.created_at,
    f.owner_id,
    p.email,
    p.full_name,
    pl.code,
    s.status,
    (select count(*) from public.products x where x.restaurant_id = f.id and x.deleted_at is null),
    (select count(*) from public.categories x where x.restaurant_id = f.id and x.deleted_at is null),
    (select count(*) from public.restaurant_tables x where x.restaurant_id = f.id and x.deleted_at is null),
    (select count(*) from public.menu_views x where x.restaurant_id = f.id),
    (select count(*) from filtered)
  from filtered f
  left join public.profiles p on p.id = f.owner_id
  left join public.subscriptions s on s.restaurant_id = f.id
  left join public.subscription_plans pl on pl.id = s.plan_id
  order by f.created_at desc
  limit greatest(least(p_limit, 100), 1)
  offset greatest(p_offset, 0);
end;
$$;

revoke all on function public.admin_restaurants(text, text, integer, integer) from public;
grant execute on function public.admin_restaurants(text, text, integer, integer) to authenticated;

create or replace function public.admin_users(
  p_search text default null,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  platform_role public.platform_role,
  is_suspended boolean,
  created_at timestamptz,
  restaurant_count bigint,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_super_admin();

  return query
  with filtered as (
    select p.*
    from public.profiles p
    where (
      p_search is null or trim(p_search) = ''
      or coalesce(p.email, '') ilike '%' || trim(p_search) || '%'
      or coalesce(p.full_name, '') ilike '%' || trim(p_search) || '%'
      or coalesce(p.phone, '') ilike '%' || trim(p_search) || '%'
    )
  )
  select
    f.id,
    f.email,
    f.full_name,
    f.phone,
    f.platform_role,
    f.is_suspended,
    f.created_at,
    (select count(*) from public.restaurant_members m where m.user_id = f.id),
    (select count(*) from filtered)
  from filtered f
  order by f.created_at desc
  limit greatest(least(p_limit, 100), 1)
  offset greatest(p_offset, 0);
end;
$$;

revoke all on function public.admin_users(text, integer, integer) from public;
grant execute on function public.admin_users(text, integer, integer) to authenticated;

create or replace function public.admin_set_restaurant_status(
  p_restaurant uuid,
  p_status public.restaurant_status,
  p_reason text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_super_admin();

  update public.restaurants
    set status = p_status,
        suspended_reason = case when p_status = 'suspended' then nullif(trim(coalesce(p_reason, '')), '') else null end
    where id = p_restaurant and deleted_at is null;

  if not found then
    raise exception 'Restaurant not found' using errcode = 'no_data_found';
  end if;

  insert into public.admin_audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    auth.uid(),
    case when p_status = 'suspended' then 'restaurant.suspend' else 'restaurant.activate' end,
    'restaurant',
    p_restaurant,
    jsonb_build_object('reason', p_reason)
  );
end;
$$;

revoke all on function public.admin_set_restaurant_status(uuid, public.restaurant_status, text) from public;
grant execute on function public.admin_set_restaurant_status(uuid, public.restaurant_status, text) to authenticated;

create or replace function public.admin_set_user_role(p_user uuid, p_role public.platform_role)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_super_admin();

  if p_user = auth.uid() then
    raise exception 'You cannot change your own platform role' using errcode = 'check_violation';
  end if;

  update public.profiles set platform_role = p_role where id = p_user;

  if not found then
    raise exception 'User not found' using errcode = 'no_data_found';
  end if;

  insert into public.admin_audit_log (actor_id, action, target_type, target_id, metadata)
  values (auth.uid(), 'user.set_role', 'user', p_user, jsonb_build_object('role', p_role));
end;
$$;

revoke all on function public.admin_set_user_role(uuid, public.platform_role) from public;
grant execute on function public.admin_set_user_role(uuid, public.platform_role) to authenticated;

create or replace function public.admin_set_user_suspended(p_user uuid, p_suspended boolean)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_super_admin();

  if p_user = auth.uid() then
    raise exception 'You cannot suspend your own account' using errcode = 'check_violation';
  end if;

  update public.profiles set is_suspended = p_suspended where id = p_user;

  if not found then
    raise exception 'User not found' using errcode = 'no_data_found';
  end if;

  insert into public.admin_audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    auth.uid(),
    case when p_suspended then 'user.suspend' else 'user.activate' end,
    'user',
    p_user,
    '{}'::jsonb
  );
end;
$$;

revoke all on function public.admin_set_user_suspended(uuid, boolean) from public;
grant execute on function public.admin_set_user_suspended(uuid, boolean) to authenticated;

create or replace function public.admin_set_restaurant_plan(
  p_restaurant uuid,
  p_plan_code text,
  p_status public.subscription_status default 'active',
  p_period_end timestamptz default null
)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_plan uuid;
begin
  perform public.assert_super_admin();

  select id into v_plan from public.subscription_plans where code = p_plan_code and is_active = true;
  if v_plan is null then
    raise exception 'Unknown plan %', p_plan_code using errcode = 'no_data_found';
  end if;

  insert into public.subscriptions (restaurant_id, plan_id, status, current_period_start, current_period_end)
  values (p_restaurant, v_plan, p_status, now(), p_period_end)
  on conflict (restaurant_id) do update
    set plan_id = excluded.plan_id,
        status = excluded.status,
        current_period_end = excluded.current_period_end,
        cancel_at_period_end = false;

  insert into public.admin_audit_log (actor_id, action, target_type, target_id, metadata)
  values (
    auth.uid(),
    'subscription.set_plan',
    'restaurant',
    p_restaurant,
    jsonb_build_object('plan', p_plan_code, 'status', p_status)
  );
end;
$$;

revoke all on function public.admin_set_restaurant_plan(uuid, text, public.subscription_status, timestamptz) from public;
grant execute on function public.admin_set_restaurant_plan(uuid, text, public.subscription_status, timestamptz) to authenticated;

create or replace function public.admin_subscription_breakdown()
returns table (plan_code text, plan_name_en text, restaurants bigint, active bigint)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.assert_super_admin();

  return query
  select
    pl.code,
    pl.name_en,
    count(s.id),
    count(s.id) filter (where s.status in ('active', 'trialing'))
  from public.subscription_plans pl
  left join public.subscriptions s on s.plan_id = pl.id
  left join public.restaurants r on r.id = s.restaurant_id and r.deleted_at is null
  group by pl.code, pl.name_en, pl.sort_order
  order by pl.sort_order;
end;
$$;

revoke all on function public.admin_subscription_breakdown() from public;
grant execute on function public.admin_subscription_breakdown() to authenticated;


-- ===========================================================================
-- migrations/0005_plan_limits.sql
-- ===========================================================================

-- ============================================================================
-- MenuQR — 0005_plan_limits
-- Plan quotas are enforced in the database, not just in the UI: a restaurant
-- on the free plan cannot exceed its product/category/table allowance even if
-- someone drives the REST API directly. NULL in a plan column means unlimited.
-- ============================================================================

create or replace function public.plan_limit_for(p_restaurant uuid, p_limit text)
returns integer
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_plan public.subscription_plans%rowtype;
begin
  select pl.* into v_plan
  from public.subscriptions s
  join public.subscription_plans pl on pl.id = s.plan_id
  where s.restaurant_id = p_restaurant
    and s.status in ('active', 'trialing')
  limit 1;

  if not found then
    select pl.* into v_plan from public.subscription_plans pl where pl.code = 'free' limit 1;
  end if;

  if not found then
    return null;
  end if;

  return case p_limit
    when 'categories' then v_plan.max_categories
    when 'products' then v_plan.max_products
    when 'tables' then v_plan.max_tables
    when 'members' then v_plan.max_members
    else null
  end;
end;
$$;

create or replace function public.enforce_category_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit integer;
  v_count integer;
begin
  -- BEFORE triggers run ahead of the RLS WITH CHECK, so a caller with no
  -- rights to this venue would otherwise learn its quota from the error.
  -- Leave those rows to RLS, which rejects them outright.
  if not public.can_manage_restaurant(new.restaurant_id) then
    return new;
  end if;

  v_limit := public.plan_limit_for(new.restaurant_id, 'categories');
  if v_limit is null then
    return new;
  end if;

  select count(*) into v_count
  from public.categories
  where restaurant_id = new.restaurant_id and deleted_at is null;

  if v_count >= v_limit then
    raise exception 'PLAN_LIMIT_CATEGORIES:%', v_limit using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists categories_enforce_limit on public.categories;
create trigger categories_enforce_limit
  before insert on public.categories
  for each row execute function public.enforce_category_limit();

create or replace function public.enforce_product_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit integer;
  v_count integer;
begin
  -- BEFORE triggers run ahead of the RLS WITH CHECK, so a caller with no
  -- rights to this venue would otherwise learn its quota from the error.
  -- Leave those rows to RLS, which rejects them outright.
  if not public.can_manage_restaurant(new.restaurant_id) then
    return new;
  end if;

  v_limit := public.plan_limit_for(new.restaurant_id, 'products');
  if v_limit is null then
    return new;
  end if;

  select count(*) into v_count
  from public.products
  where restaurant_id = new.restaurant_id and deleted_at is null;

  if v_count >= v_limit then
    raise exception 'PLAN_LIMIT_PRODUCTS:%', v_limit using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists products_enforce_limit on public.products;
create trigger products_enforce_limit
  before insert on public.products
  for each row execute function public.enforce_product_limit();

create or replace function public.enforce_table_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit integer;
  v_count integer;
begin
  -- BEFORE triggers run ahead of the RLS WITH CHECK, so a caller with no
  -- rights to this venue would otherwise learn its quota from the error.
  -- Leave those rows to RLS, which rejects them outright.
  if not public.can_manage_restaurant(new.restaurant_id) then
    return new;
  end if;

  v_limit := public.plan_limit_for(new.restaurant_id, 'tables');
  if v_limit is null then
    return new;
  end if;

  select count(*) into v_count
  from public.restaurant_tables
  where restaurant_id = new.restaurant_id and deleted_at is null;

  if v_count >= v_limit then
    raise exception 'PLAN_LIMIT_TABLES:%', v_limit using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists restaurant_tables_enforce_limit on public.restaurant_tables;
create trigger restaurant_tables_enforce_limit
  before insert on public.restaurant_tables
  for each row execute function public.enforce_table_limit();

create or replace function public.enforce_member_limit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_limit integer;
  v_count integer;
begin
  -- BEFORE triggers run ahead of the RLS WITH CHECK, so a caller with no
  -- rights to this venue would otherwise learn its quota from the error.
  -- Leave those rows to RLS, which rejects them outright.
  if not public.can_manage_restaurant(new.restaurant_id) then
    return new;
  end if;

  v_limit := public.plan_limit_for(new.restaurant_id, 'members');
  if v_limit is null then
    return new;
  end if;

  select count(*) into v_count
  from public.restaurant_members
  where restaurant_id = new.restaurant_id;

  if v_count >= v_limit then
    raise exception 'PLAN_LIMIT_MEMBERS:%', v_limit using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists restaurant_members_enforce_limit on public.restaurant_members;
create trigger restaurant_members_enforce_limit
  before insert on public.restaurant_members
  for each row execute function public.enforce_member_limit();

-- Usage panel for the dashboard's subscription page.
create or replace function public.restaurant_usage(p_restaurant uuid)
returns table (
  categories_used bigint,
  categories_limit integer,
  products_used bigint,
  products_limit integer,
  tables_used bigint,
  tables_limit integer,
  members_used bigint,
  members_limit integer
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_restaurant_member(p_restaurant) and not public.is_super_admin() then
    raise exception 'Not allowed' using errcode = 'insufficient_privilege';
  end if;

  return query
  select
    (select count(*) from public.categories where restaurant_id = p_restaurant and deleted_at is null),
    public.plan_limit_for(p_restaurant, 'categories'),
    (select count(*) from public.products where restaurant_id = p_restaurant and deleted_at is null),
    public.plan_limit_for(p_restaurant, 'products'),
    (select count(*) from public.restaurant_tables where restaurant_id = p_restaurant and deleted_at is null),
    public.plan_limit_for(p_restaurant, 'tables'),
    (select count(*) from public.restaurant_members where restaurant_id = p_restaurant),
    public.plan_limit_for(p_restaurant, 'members');
end;
$$;

revoke all on function public.restaurant_usage(uuid) from public;
grant execute on function public.restaurant_usage(uuid) to authenticated;


-- ===========================================================================
-- migrations/0006_team.sql
-- ===========================================================================

-- ============================================================================
-- MenuQR — 0006_team
-- Owners add staff by email. Profiles are not readable across venues, so the
-- lookup happens inside a SECURITY DEFINER function that first proves the
-- caller owns the venue and only ever returns "added" or "no such account" —
-- never any other user's data.
-- ============================================================================

create or replace function public.add_restaurant_member_by_email(
  p_restaurant uuid,
  p_email text,
  p_role public.restaurant_role default 'staff'
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid;
  v_member uuid;
begin
  if not public.can_administer_restaurant(p_restaurant) then
    raise exception 'Not allowed' using errcode = 'insufficient_privilege';
  end if;

  if p_role = 'owner' then
    raise exception 'OWNER_ROLE_NOT_ASSIGNABLE' using errcode = 'check_violation';
  end if;

  select id into v_user
  from public.profiles
  where lower(email) = lower(trim(p_email))
  limit 1;

  if v_user is null then
    raise exception 'USER_NOT_FOUND' using errcode = 'no_data_found';
  end if;

  if exists (
    select 1 from public.restaurant_members
    where restaurant_id = p_restaurant and user_id = v_user
  ) then
    raise exception 'ALREADY_A_MEMBER' using errcode = 'unique_violation';
  end if;

  insert into public.restaurant_members (restaurant_id, user_id, role)
  values (p_restaurant, v_user, p_role)
  returning id into v_member;

  return v_member;
end;
$$;

revoke all on function public.add_restaurant_member_by_email(uuid, text, public.restaurant_role) from public;
grant execute on function public.add_restaurant_member_by_email(uuid, text, public.restaurant_role) to authenticated;


-- ===========================================================================
-- migrations/0007_grants.sql
-- ===========================================================================

-- ============================================================================
-- MenuQR — 0007_grants
--
-- Every table privilege the application needs, stated explicitly.
--
-- Until this migration the schema carried no table-level GRANTs at all: it
-- worked only because a Supabase project ships default privileges that hand
-- `anon`, `authenticated` and `service_role` full DML on everything created in
-- `public`, leaving RLS as the only thing standing between an anonymous
-- visitor and a DELETE. That is an implicit dependency on how the host happens
-- to be configured, and it fails outright on a plain Postgres or on a project
-- whose `public` schema was recreated.
--
-- So: revoke the blanket grants, then hand back exactly the commands each role
-- has a policy for. RLS still decides which ROWS a caller may touch; these
-- grants decide which COMMANDS are available at all, which means a missing or
-- mistaken policy can no longer be the only thing standing between `anon` and
-- a write. The two layers are derived from the same matrix and must stay in
-- step — supabase/tests/01_rls.sql asserts the result.
--
-- Deliberately untouched: function privileges. 0003-0006 revoke EXECUTE from
-- PUBLIC and grant it to named roles one function at a time; a blanket grant
-- here would paper over that.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Clean slate. `anon` and `authenticated` get nothing back except what is
-- listed below; `service_role` keeps the full access Supabase tooling expects.
revoke all on all tables in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;

-- ---------------------------------------------------------------------------
-- anon — the public menu, and nothing else.
--
-- A guest reads a published venue and its menu. Everything else an anonymous
-- visitor can do (resolving a scanned QR token, recording a view) goes through
-- a SECURITY DEFINER function that validates its own input, so `anon` needs no
-- privilege on the analytics tables and must not be able to enumerate tables,
-- QR tokens, members, profiles or orders.
-- ---------------------------------------------------------------------------
grant select on public.restaurants           to anon;
grant select on public.restaurant_settings   to anon;
grant select on public.categories            to anon;
grant select on public.products              to anon;
grant select on public.product_option_groups to anon;
grant select on public.product_options       to anon;
grant select on public.subscription_plans    to anon;

-- ---------------------------------------------------------------------------
-- authenticated — the dashboard.
--
-- Row scoping is entirely the policies' job: holding INSERT on `restaurants`
-- is not permission to write to somebody else's venue.
-- ---------------------------------------------------------------------------

-- Menu content: created, edited and removed by owners and managers.
grant select, insert, update, delete on public.categories            to authenticated;
grant select, insert, update, delete on public.products              to authenticated;
grant select, insert, update, delete on public.product_option_groups to authenticated;
grant select, insert, update, delete on public.product_options       to authenticated;

-- Venue, tables and QR codes.
grant select, insert, update, delete on public.restaurants        to authenticated;
grant select, insert, update, delete on public.restaurant_members to authenticated;
grant select, insert, update, delete on public.restaurant_tables  to authenticated;
grant select, insert, update, delete on public.qr_codes           to authenticated;

-- Settings are created with the venue and edited in place; there is no policy
-- that deletes one, so there is no DELETE grant either.
grant select, insert, update on public.restaurant_settings to authenticated;

-- The signed-in user's own profile. Rows are created by the auth trigger, and
-- `platform_role` is defended separately by a trigger, so no INSERT or DELETE.
grant select, update on public.profiles to authenticated;

-- Analytics are read-only from the client: rows arrive through the tracking
-- functions, which are the only writers.
grant select on public.menu_views        to authenticated;
grant select on public.menu_interactions to authenticated;

-- Billing. Plans are readable by everyone and writable only by a platform
-- administrator, which the policy enforces.
grant select, insert, update, delete on public.subscription_plans to authenticated;
grant select, insert, update, delete on public.subscriptions      to authenticated;

-- Ordering is not switched on yet, but the tables and their policies exist so
-- it can be enabled without a data migration.
grant select, insert, update, delete on public.orders      to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;

-- Written only by the admin functions; visible to platform administrators.
grant select on public.admin_audit_log to authenticated;


-- ===========================================================================
-- migrations/0008_ordering.sql
-- ===========================================================================

-- ============================================================================
-- MenuQR — 0008_ordering
--
-- Turns the browser-only selection list into real orders that reach the venue.
-- The tables have been here since 0001; what was missing is a way for a guest
-- to write one, and that guest is `anon` — a role with no write grant on
-- `orders` at all, and none is added here.
--
-- Instead an order arrives through one SECURITY DEFINER function that decides
-- everything that matters:
--
--   * prices are read from `products`, never taken from the caller, so a
--     forged payload cannot buy a 40 DT dish for 1 DT;
--   * the venue must be published AND have ordering switched on;
--   * the table must belong to that venue, and every product too, so one
--     venue's menu cannot be ordered against another's bill;
--   * an unavailable product is refused rather than silently dropped, because
--     a guest who ordered it should be told;
--   * a session is capped, so the endpoint cannot be used to flood a kitchen.
--
-- Staff hold no UPDATE on orders (same as products): moving an order along its
-- statuses goes through set_order_status, which re-checks membership itself.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- A venue opts in. Off by default: a venue that has not seen the orders screen
-- must not start collecting orders nobody is watching.
-- ---------------------------------------------------------------------------
alter table public.restaurant_settings
  add column if not exists enable_ordering boolean not null default false;

-- Guests read back the order they just placed, and only that one, by knowing
-- its id and the session that created it. There is no policy granting `anon`
-- SELECT on orders, so this stays the only path.
create index if not exists orders_session_idx
  on public.orders (session_identifier, created_at desc);

-- ---------------------------------------------------------------------------
-- place_order
--
-- p_items is [{"product_id": uuid, "quantity": int, "options": [uuid, ...]}].
-- Returns the new order's id.
-- ---------------------------------------------------------------------------
create or replace function public.place_order(
  p_restaurant uuid,
  p_session text,
  p_items jsonb,
  p_table uuid default null,
  p_note text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_order uuid;
  v_table uuid;
  v_recent integer;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity smallint;
  v_options jsonb;
  v_option_total numeric(10, 3);
  v_option_labels jsonb;
  v_unit numeric(10, 3);
  v_subtotal numeric(10, 3) := 0;
  v_count integer := 0;
begin
  if p_session is null or char_length(p_session) < 8 or char_length(p_session) > 64 then
    raise exception 'INVALID_SESSION' using errcode = 'check_violation';
  end if;

  if not public.is_restaurant_public(p_restaurant) then
    raise exception 'VENUE_NOT_AVAILABLE' using errcode = 'no_data_found';
  end if;

  if not exists (
    select 1 from public.restaurant_settings s
    where s.restaurant_id = p_restaurant and s.enable_ordering
  ) then
    raise exception 'ORDERING_DISABLED' using errcode = 'check_violation';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_ORDER' using errcode = 'check_violation';
  end if;

  if jsonb_array_length(p_items) > 40 then
    raise exception 'TOO_MANY_ITEMS' using errcode = 'check_violation';
  end if;

  -- One kitchen, one session: enough for a table that orders a few rounds,
  -- not enough to bury a venue in noise.
  select count(*) into v_recent
  from public.orders o
  where o.restaurant_id = p_restaurant
    and o.session_identifier = p_session
    and o.created_at > now() - interval '1 hour';

  if v_recent >= 10 then
    raise exception 'TOO_MANY_ORDERS' using errcode = 'check_violation';
  end if;

  -- A table id from another venue resolves to NULL rather than leaking that
  -- it exists; the order is still valid, just not attributed to a table.
  select t.id into v_table
  from public.restaurant_tables t
  where t.id = p_table and t.restaurant_id = p_restaurant and t.deleted_at is null;

  insert into public.orders (restaurant_id, table_id, session_identifier, customer_note, currency)
  values (
    p_restaurant,
    v_table,
    p_session,
    nullif(left(coalesce(trim(p_note), ''), 500), ''),
    'TND'
  )
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(1, least(99, coalesce((v_item->>'quantity')::int, 1)));

    -- Orderable means visible on the public menu, which is what the guest
    -- was looking at: not deleted, and in a category that is itself live.
    select p.* into v_product
    from public.products p
    left join public.categories c on c.id = p.category_id
    where p.id = (v_item->>'product_id')::uuid
      and p.restaurant_id = p_restaurant
      and p.deleted_at is null
      and (p.category_id is null or (c.deleted_at is null and c.is_active));

    if v_product.id is null then
      raise exception 'PRODUCT_UNAVAILABLE' using errcode = 'no_data_found';
    end if;

    if not v_product.is_available then
      raise exception 'PRODUCT_SOLD_OUT:%', v_product.id using errcode = 'check_violation';
    end if;

    -- Option surcharges are read from the venue's own option rows, and an
    -- option belonging to another product is simply not found.
    v_option_total := 0;
    v_option_labels := '[]'::jsonb;

    if jsonb_typeof(v_item->'options') = 'array' then
      select
        coalesce(sum(o.price_delta), 0),
        coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'name_ar', o.name_ar, 'name_fr', o.name_fr, 'name_en', o.name_en)), '[]'::jsonb)
      into v_option_total, v_option_labels
      from public.product_options o
      join public.product_option_groups g on g.id = o.group_id
      where g.product_id = v_product.id
        and o.id in (
          select (value #>> '{}')::uuid
          from jsonb_array_elements(v_item->'options')
          where jsonb_typeof(value) = 'string'
        );
    end if;

    v_unit := v_product.price + v_option_total;

    insert into public.order_items (
      order_id, product_id, name_snapshot, quantity, unit_price, options_snapshot, line_total
    )
    values (
      v_order,
      v_product.id,
      coalesce(v_product.name_ar, v_product.name_fr, v_product.name_en, ''),
      v_quantity,
      v_unit,
      v_option_labels,
      v_unit * v_quantity
    );

    v_subtotal := v_subtotal + (v_unit * v_quantity);
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    raise exception 'EMPTY_ORDER' using errcode = 'check_violation';
  end if;

  update public.orders
    set subtotal = v_subtotal, total = v_subtotal
    where id = v_order;

  return v_order;
end;
$$;

revoke all on function public.place_order(uuid, text, jsonb, uuid, text) from public;
grant execute on function public.place_order(uuid, text, jsonb, uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- The guest follows their own order — by id, and only with the session that
-- placed it, so knowing an id is not enough.
-- ---------------------------------------------------------------------------
create or replace function public.order_status_for_session(p_order uuid, p_session text)
returns table (status public.order_status, total numeric, created_at timestamptz)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select o.status, o.total, o.created_at
  from public.orders o
  where o.id = p_order
    and o.session_identifier = p_session
    and p_session is not null
    and char_length(p_session) >= 8;
$$;

revoke all on function public.order_status_for_session(uuid, text) from public;
grant execute on function public.order_status_for_session(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Staff move an order along. They hold no UPDATE grant on orders, so this is
-- the only route, and it re-checks membership rather than trusting the caller.
-- ---------------------------------------------------------------------------
create or replace function public.set_order_status(p_order uuid, p_status public.order_status)
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_restaurant uuid;
begin
  select restaurant_id into v_restaurant from public.orders where id = p_order;

  if v_restaurant is null then
    raise exception 'Order not found' using errcode = 'no_data_found';
  end if;

  if not public.is_restaurant_member(v_restaurant) and not public.is_super_admin() then
    raise exception 'Not allowed' using errcode = 'insufficient_privilege';
  end if;

  update public.orders set status = p_status where id = p_order;
end;
$$;

revoke all on function public.set_order_status(uuid, public.order_status) from public;
grant execute on function public.set_order_status(uuid, public.order_status) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime. The venue's screen subscribes to its own rows; RLS still decides
-- what a subscriber may see, so this publishes nothing it could not read.
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
    ) then
      alter publication supabase_realtime add table public.orders;
    end if;
  end if;
end $$;


-- ===========================================================================
-- seed.sql
-- ===========================================================================

-- ============================================================================
-- MenuQR — seed
-- 1. The three subscription plans (required: a new restaurant is put on the
--    free plan by the restaurants bootstrap trigger).
-- 2. seed_demo_restaurant() / remove_demo_restaurant() — an optional demo
--    café with realistic Tunisian menu items, easy to add and easy to drop.
--
-- Feature lists are stored as translation KEYS, not sentences: the app renders
-- them from its own ar/fr/en dictionaries so plans stay multilingual.
-- ============================================================================

insert into public.subscription_plans (
  code, name_ar, name_fr, name_en,
  description_ar, description_fr, description_en,
  price_monthly, price_yearly, currency,
  max_categories, max_products, max_tables, max_members,
  features, sort_order
) values
(
  'free',
  'مجاني', 'Gratuit', 'Free',
  'ابدأ بمنيو رقمي بسيط ورمز QR واحد.',
  'Commencez avec un menu digital simple et un QR code.',
  'Start with a simple digital menu and one QR code.',
  0, 0, 'TND',
  5, 30, 3, 1,
  '["menu_digital","qr_basic","languages_three","mobile_menu"]'::jsonb,
  1
),
(
  'pro',
  'برو', 'Pro', 'Pro',
  'لمطعم أو مقهى يخدم بجدية: منتجات أكثر، طاولات أكثر وإحصائيات.',
  'Pour un restaurant ou café actif : plus de produits, plus de tables et des statistiques.',
  'For a working restaurant or café: more products, more tables and analytics.',
  29.900, 299.000, 'TND',
  null, 300, 25, 3,
  '["everything_free","categories_unlimited","qr_per_table","analytics","custom_branding","product_options"]'::jsonb,
  2
),
(
  'business',
  'بيزنس', 'Business', 'Business',
  'لفرق العمل والمشاريع الكبيرة: كل شيء بلا حدود ودعم بالأولوية.',
  'Pour les équipes et les grandes enseignes : tout en illimité et support prioritaire.',
  'For teams and larger venues: everything unlimited plus priority support.',
  79.900, 799.000, 'TND',
  null, null, null, 15,
  '["everything_pro","products_unlimited","tables_unlimited","staff_accounts","advanced_analytics","priority_support"]'::jsonb,
  3
)
on conflict (code) do update set
  name_ar = excluded.name_ar,
  name_fr = excluded.name_fr,
  name_en = excluded.name_en,
  description_ar = excluded.description_ar,
  description_fr = excluded.description_fr,
  description_en = excluded.description_en,
  price_monthly = excluded.price_monthly,
  price_yearly = excluded.price_yearly,
  max_categories = excluded.max_categories,
  max_products = excluded.max_products,
  max_tables = excluded.max_tables,
  max_members = excluded.max_members,
  features = excluded.features,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Demo restaurant
--   select public.seed_demo_restaurant('<your-user-uuid>');
--   select public.remove_demo_restaurant();
-- ---------------------------------------------------------------------------

create or replace function public.seed_demo_restaurant(
  p_owner uuid,
  p_slug text default 'cafe-el-medina'
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_restaurant uuid;
  v_breakfast uuid;
  v_pizza uuid;
  v_sandwich uuid;
  v_drinks uuid;
  v_desserts uuid;
  v_pro uuid;
begin
  if auth.uid() is not null and auth.uid() <> p_owner and not public.is_super_admin() then
    raise exception 'You can only seed demo data onto your own account' using errcode = 'insufficient_privilege';
  end if;

  if not exists (select 1 from public.profiles where id = p_owner) then
    raise exception 'No profile for %', p_owner using errcode = 'no_data_found';
  end if;

  if exists (select 1 from public.restaurants where slug = p_slug) then
    raise exception 'Slug % is already taken', p_slug using errcode = 'unique_violation';
  end if;

  insert into public.restaurants (
    owner_id, name, slug, restaurant_type,
    name_ar, name_fr, name_en,
    description_ar, description_fr, description_en,
    phone, address, currency, default_language,
    primary_color, secondary_color, theme
  ) values (
    p_owner, 'Café El Medina', p_slug, 'cafe',
    'قهوة المدينة', 'Café El Medina', 'Café El Medina',
    'قهوة تونسية أصيلة في قلب المدينة العتيقة — فطور، بيتزا، ساندويتش ومشروبات.',
    'Un café tunisien authentique au cœur de la médina — petit déjeuner, pizza, sandwichs et boissons.',
    'An authentic Tunisian café in the heart of the medina — breakfast, pizza, sandwiches and drinks.',
    '+216 71 000 000', 'Rue de la Kasbah, Tunis',
    'TND', 'ar',
    '#0F766E', '#F59E0B', 'coffee'
  )
  returning id into v_restaurant;

  -- The demo shows off per-table QR codes and analytics, so put it on Pro.
  select id into v_pro from public.subscription_plans where code = 'pro';
  if v_pro is not null then
    update public.subscriptions set plan_id = v_pro where restaurant_id = v_restaurant;
  end if;

  insert into public.categories (restaurant_id, name_ar, name_fr, name_en, sort_order)
  values (v_restaurant, 'فطور الصباح', 'Petit Déjeuner', 'Breakfast', 1)
  returning id into v_breakfast;

  insert into public.categories (restaurant_id, name_ar, name_fr, name_en, sort_order)
  values (v_restaurant, 'بيتزا', 'Pizza', 'Pizza', 2)
  returning id into v_pizza;

  insert into public.categories (restaurant_id, name_ar, name_fr, name_en, sort_order)
  values (v_restaurant, 'ساندويتش', 'Sandwich', 'Sandwich', 3)
  returning id into v_sandwich;

  insert into public.categories (restaurant_id, name_ar, name_fr, name_en, sort_order)
  values (v_restaurant, 'مشروبات', 'Boissons', 'Drinks', 4)
  returning id into v_drinks;

  insert into public.categories (restaurant_id, name_ar, name_fr, name_en, sort_order)
  values (v_restaurant, 'حلويات', 'Desserts', 'Desserts', 5)
  returning id into v_desserts;

  insert into public.products (
    restaurant_id, category_id, name_ar, name_fr, name_en,
    description_ar, description_fr, description_en, price, sort_order, is_featured
  ) values
  (v_restaurant, v_breakfast, 'لبلابي', 'Lablabi', 'Lablabi',
   'حمص ساخن بالخبز، الهريسة، الكمون وزيت الزيتون.',
   'Pois chiches chauds avec pain, harissa, cumin et huile d''olive.',
   'Hot chickpeas with bread, harissa, cumin and olive oil.', 6.000, 1, true),
  (v_restaurant, v_breakfast, 'كرواسون', 'Croissant', 'Croissant',
   'كرواسون بالزبدة طازج كل صباح.',
   'Croissant pur beurre, cuit chaque matin.',
   'All-butter croissant, baked every morning.', 1.500, 2, false),
  (v_restaurant, v_breakfast, 'شكشوكة', 'Chakchouka', 'Chakchouka',
   'طماطم، فلفل وبيض على الطريقة التونسية.',
   'Tomates, poivrons et œufs à la tunisienne.',
   'Tomatoes, peppers and eggs, Tunisian style.', 8.500, 3, false),
  (v_restaurant, v_pizza, 'بيتزا مارغريتا', 'Pizza Margherita', 'Margherita Pizza',
   'صلصة طماطم، موزاريلا وريحان.',
   'Sauce tomate, mozzarella et basilic.',
   'Tomato sauce, mozzarella and basil.', 12.500, 1, true),
  (v_restaurant, v_pizza, 'بيتزا تن', 'Pizza Thon', 'Tuna Pizza',
   'تن، زيتون، موزاريلا وصلصة طماطم.',
   'Thon, olives, mozzarella et sauce tomate.',
   'Tuna, olives, mozzarella and tomato sauce.', 15.000, 2, false),
  (v_restaurant, v_pizza, 'بيتزا أربعة أجبان', 'Pizza 4 Fromages', 'Four Cheese Pizza',
   'موزاريلا، غرويار، شيدر وجبن أزرق.',
   'Mozzarella, gruyère, cheddar et bleu.',
   'Mozzarella, gruyère, cheddar and blue cheese.', 17.000, 3, false),
  (v_restaurant, v_sandwich, 'ساندويتش إسكالوب', 'Sandwich Escalope', 'Escalope Sandwich',
   'إسكالوب دجاج، سلطة، جبن وصلصة.',
   'Escalope de poulet, salade, fromage et sauce.',
   'Chicken escalope, salad, cheese and sauce.', 7.500, 1, true),
  (v_restaurant, v_sandwich, 'ساندويتش تن', 'Sandwich Thon', 'Tuna Sandwich',
   'تن، بيض، زيتون وهريسة في خبز طابونة.',
   'Thon, œuf, olives et harissa dans du pain tabouna.',
   'Tuna, egg, olives and harissa in tabouna bread.', 5.500, 2, false),
  (v_restaurant, v_sandwich, 'شاباتي دجاج', 'Chapati Poulet', 'Chicken Chapati',
   'دجاج مشوي، جبن، سلطة وصلصة الثوم.',
   'Poulet grillé, fromage, salade et sauce à l''ail.',
   'Grilled chicken, cheese, salad and garlic sauce.', 9.000, 3, false),
  (v_restaurant, v_drinks, 'قهوة إكسبرس', 'Café Express', 'Espresso',
   'قهوة تونسية قوية.',
   'Café tunisien serré.',
   'Strong Tunisian espresso.', 1.800, 1, false),
  (v_restaurant, v_drinks, 'كابوتشينو', 'Cappuccino', 'Cappuccino',
   'إكسبرس بحليب مرغي وقليل من القرفة.',
   'Espresso, lait mousseux et une pointe de cannelle.',
   'Espresso, foamed milk and a hint of cinnamon.', 3.500, 2, true),
  (v_restaurant, v_drinks, 'عصير برتقال', 'Jus d''Orange', 'Orange Juice',
   'برتقال طازج معصور في الحين.',
   'Oranges fraîchement pressées.',
   'Freshly squeezed oranges.', 5.000, 3, false),
  (v_restaurant, v_drinks, 'شاي بالنعناع', 'Thé à la Menthe', 'Mint Tea',
   'شاي أحمر بالنعناع والصنوبر.',
   'Thé à la menthe avec pignons de pin.',
   'Mint tea with pine nuts.', 2.500, 4, false),
  (v_restaurant, v_desserts, 'كريب نوتيلا', 'Crêpe Nutella', 'Nutella Crêpe',
   'كريب طازج بالنوتيلا والموز.',
   'Crêpe fraîche au Nutella et banane.',
   'Fresh crêpe with Nutella and banana.', 8.500, 1, true),
  (v_restaurant, v_desserts, 'بقلاوة', 'Baklawa', 'Baklava',
   'بقلاوة تونسية باللوز والعسل.',
   'Baklawa tunisienne aux amandes et miel.',
   'Tunisian baklava with almonds and honey.', 4.000, 2, false);

  insert into public.restaurant_tables (restaurant_id, name, identifier, zone, seats, sort_order) values
  (v_restaurant, 'Table 1', 'table-1', 'Salle', 4, 1),
  (v_restaurant, 'Table 2', 'table-2', 'Salle', 4, 2),
  (v_restaurant, 'Table 3', 'table-3', 'Salle', 2, 3),
  (v_restaurant, 'Terrasse 1', 'terrasse-1', 'Terrasse', 6, 4),
  (v_restaurant, 'Terrasse 2', 'terrasse-2', 'Terrasse', 6, 5),
  (v_restaurant, 'VIP 1', 'vip-1', 'VIP', 8, 6);

  update public.restaurant_settings
    set opening_hours = '[
      {"day":0,"open":"07:00","close":"23:00","closed":false},
      {"day":1,"open":"07:00","close":"23:00","closed":false},
      {"day":2,"open":"07:00","close":"23:00","closed":false},
      {"day":3,"open":"07:00","close":"23:00","closed":false},
      {"day":4,"open":"07:00","close":"23:00","closed":false},
      {"day":5,"open":"07:00","close":"00:00","closed":false},
      {"day":6,"open":"08:00","close":"00:00","closed":false}
    ]'::jsonb
    where restaurant_id = v_restaurant;

  return v_restaurant;
end;
$$;

revoke all on function public.seed_demo_restaurant(uuid, text) from public;
grant execute on function public.seed_demo_restaurant(uuid, text) to authenticated;

create or replace function public.remove_demo_restaurant(p_slug text default 'cafe-el-medina')
returns void
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_restaurant uuid;
  v_owner uuid;
begin
  select id, owner_id into v_restaurant, v_owner from public.restaurants where slug = p_slug;
  if v_restaurant is null then
    return;
  end if;

  if auth.uid() is not null and auth.uid() <> v_owner and not public.is_super_admin() then
    raise exception 'Not allowed' using errcode = 'insufficient_privilege';
  end if;

  delete from public.restaurants where id = v_restaurant;
end;
$$;

revoke all on function public.remove_demo_restaurant(text) from public;
grant execute on function public.remove_demo_restaurant(text) to authenticated;


commit;

-- ============================================================================
-- Verification — the three plan rows should come back as the plan catalogue,
-- and every count below should be non-zero.
-- ============================================================================
select code, name_en, price_monthly, currency,
       max_categories, max_products, max_tables, max_members
  from public.subscription_plans
 order by sort_order;

select
  (select count(*) from pg_tables   where schemaname = 'public')  as tables,
  (select count(*) from pg_policies where schemaname = 'public')  as policies,
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public')                                   as functions,
  (select count(*) from storage.buckets where id = 'menu-images') as image_bucket;
