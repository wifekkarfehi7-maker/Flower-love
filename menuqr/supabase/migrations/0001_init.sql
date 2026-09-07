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

create or replace function public.generate_qr_token()
returns text
language sql
volatile
as $$
  select translate(encode(gen_random_bytes(12), 'base64'), '+/=', '-_x');
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
