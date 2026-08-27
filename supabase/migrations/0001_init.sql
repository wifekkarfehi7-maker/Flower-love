-- ─────────────────────────────────────────────────────────────────────────
-- Flower & Love — Initial schema (Phase 2: Authentication + Database)
--
-- Design notes:
--   * Every table that holds owner-specific data is protected by Row Level
--     Security. Policies are written so a signed-in user can only ever see
--     or modify their own rows; admins get elevated access through the
--     `public.is_admin()` helper (SECURITY DEFINER, so it can read
--     `profiles` without recursing into RLS).
--   * `invitations.data jsonb` is the flexible "template engine" payload
--     (theme overrides, page config, custom text, colors, fonts, animation
--     settings, etc). Core relational columns (names, dates, status, slug)
--     stay as real columns because the dashboard and public renderer need
--     to filter/sort on them; everything else that varies per template or
--     per invitation lives in jsonb so we can ship 50+ templates later
--     without another migration.
--   * Guest contact info (`guests`, `rsvps`) is never selectable by anon —
--     only the invitation owner and admins can read it. Public visitors may
--     INSERT an rsvp row for a published invitation, nothing more.
-- ─────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

-- ── Enums ───────────────────────────────────────────────────────────────

create type public.user_role as enum ('customer', 'admin');

create type public.invitation_status as enum (
  'draft',
  'pending_payment',
  'payment_review',
  'paid',
  'active',
  'cancelled',
  'expired'
);

create type public.order_status as enum (
  'draft',
  'pending_payment',
  'payment_review',
  'paid',
  'active',
  'cancelled',
  'expired'
);

create type public.template_status as enum ('active', 'draft', 'disabled');

create type public.rsvp_attendance as enum ('attending', 'not_attending');

create type public.guest_status as enum ('pending', 'attending', 'not_attending');

create type public.event_type as enum ('aqd', 'wedding', 'dinner', 'reception', 'other');

create type public.page_type as enum (
  'cover',
  'invitation',
  'families',
  'countdown',
  'event_details',
  'location',
  'calendar',
  'gallery',
  'rsvp',
  'final_message'
);

-- ── Helper: updated_at trigger ─────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── profiles ────────────────────────────────────────────────────────────
-- One row per auth.users row (1:1), created automatically by the
-- handle_new_user trigger below. `whatsapp` is nullable at the DB level
-- because OAuth sign-ups (Google) don't collect it up front — the app
-- gates those users into a "complete your profile" step before they can
-- create an invitation.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  whatsapp text,
  country text not null default 'TN',
  preferred_language text not null default 'ar' check (preferred_language in ('ar', 'fr', 'en')),
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Extends auth.users with the platform profile fields (WhatsApp, country, language, role).';
comment on column public.profiles.whatsapp is 'Required for customer contact before an invitation can be created; nullable at DB level so OAuth sign-ups can complete it afterwards.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- SECURITY DEFINER so RLS on `profiles` doesn't recurse into itself when
-- other tables' policies call this function.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin());

-- No public INSERT/DELETE policy: profile rows are created only by the
-- handle_new_user trigger (SECURITY DEFINER) and deleted via auth.users cascade.

-- ── handle_new_user trigger ────────────────────────────────────────────
-- Copies signup metadata (collected by the /register form and passed as
-- `options.data` to supabase.auth.signUp) into a new profiles row.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, whatsapp, country, preferred_language)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'whatsapp', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'country', ''), 'TN'),
    coalesce(nullif(new.raw_user_meta_data ->> 'preferred_language', ''), 'ar')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── templates ───────────────────────────────────────────────────────────

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  name_ar text not null,
  category text not null default 'classic',
  description text,
  preview_image_url text,
  status public.template_status not null default 'draft',
  theme jsonb not null default '{}'::jsonb,
  supported_pages public.page_type[] not null default array[
    'cover','invitation','families','countdown','event_details','location','calendar','gallery','rsvp','final_message'
  ]::public.page_type[],
  fonts jsonb not null default '{}'::jsonb,
  animation_settings jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.templates is 'Template engine catalogue — visual design system per template (theme/fonts/animations as jsonb) decoupled from invitation data.';

create trigger templates_set_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

alter table public.templates enable row level security;

create policy "templates_select_active_public"
  on public.templates for select
  using (status = 'active' or public.is_admin());

create policy "templates_admin_write"
  on public.templates for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── pricing_plans ───────────────────────────────────────────────────────

create table public.pricing_plans (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  name_ar text not null,
  price numeric(10, 2) not null default 0,
  currency text not null default 'TND',
  period text not null default 'per_invitation',
  description text,
  features jsonb not null default '[]'::jsonb,
  is_watermarked boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pricing_plans is 'Admin-editable pricing catalogue — never hard-code prices in the UI, read them from here.';

create trigger pricing_plans_set_updated_at
  before update on public.pricing_plans
  for each row execute function public.set_updated_at();

alter table public.pricing_plans enable row level security;

create policy "pricing_plans_select_active_public"
  on public.pricing_plans for select
  using (is_active = true or public.is_admin());

create policy "pricing_plans_admin_write"
  on public.pricing_plans for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── invitations ─────────────────────────────────────────────────────────

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  template_id uuid references public.templates (id) on delete set null,
  slug text unique,
  groom_name text,
  bride_name text,
  groom_father text,
  bride_father text,
  groom_mother text,
  bride_mother text,
  invitation_text text,
  wedding_date date,
  wedding_time time,
  status public.invitation_status not null default 'draft',
  is_watermarked boolean not null default true,
  view_count integer not null default 0,
  data jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.invitations is 'One row per wedding invitation. `data` jsonb carries builder/theme config so new templates and features do not require schema changes.';

create trigger invitations_set_updated_at
  before update on public.invitations
  for each row execute function public.set_updated_at();

create index invitations_user_id_idx on public.invitations (user_id);
create index invitations_status_idx on public.invitations (status);

alter table public.invitations enable row level security;

create policy "invitations_select_own_admin_or_active"
  on public.invitations for select
  using (status = 'active' or auth.uid() = user_id or public.is_admin());

create policy "invitations_insert_own"
  on public.invitations for insert
  with check (auth.uid() = user_id);

create policy "invitations_update_own_or_admin"
  on public.invitations for update
  using (auth.uid() = user_id or public.is_admin());

create policy "invitations_delete_own_or_admin"
  on public.invitations for delete
  using (auth.uid() = user_id or public.is_admin());

-- ── invitation_pages ────────────────────────────────────────────────────

create table public.invitation_pages (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  page_type public.page_type not null,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (invitation_id, page_type)
);

create trigger invitation_pages_set_updated_at
  before update on public.invitation_pages
  for each row execute function public.set_updated_at();

create index invitation_pages_invitation_id_idx on public.invitation_pages (invitation_id);

alter table public.invitation_pages enable row level security;

create policy "invitation_pages_select_via_invitation"
  on public.invitation_pages for select
  using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id
        and (i.status = 'active' or i.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "invitation_pages_write_via_invitation"
  on public.invitation_pages for all
  using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  );

-- ── events (marriage contract / wedding / dinner / reception) ─────────

create table public.events (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  event_type public.event_type not null default 'wedding',
  name text not null,
  event_date date,
  event_time time,
  location_name text,
  location_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index events_invitation_id_idx on public.events (invitation_id);

alter table public.events enable row level security;

create policy "events_select_via_invitation"
  on public.events for select
  using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id
        and (i.status = 'active' or i.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "events_write_via_invitation"
  on public.events for all
  using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  );

-- ── gallery_images ──────────────────────────────────────────────────────

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  storage_path text not null,
  url text,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index gallery_images_invitation_id_idx on public.gallery_images (invitation_id);

alter table public.gallery_images enable row level security;

create policy "gallery_images_select_via_invitation"
  on public.gallery_images for select
  using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id
        and (i.status = 'active' or i.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "gallery_images_write_via_invitation"
  on public.gallery_images for all
  using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  );

-- ── music_files ─────────────────────────────────────────────────────────

create table public.music_files (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  storage_path text not null,
  url text,
  title text,
  autoplay_after_open boolean not null default true,
  created_at timestamptz not null default now()
);

create index music_files_invitation_id_idx on public.music_files (invitation_id);

alter table public.music_files enable row level security;

create policy "music_files_select_via_invitation"
  on public.music_files for select
  using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id
        and (i.status = 'active' or i.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "music_files_write_via_invitation"
  on public.music_files for all
  using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  );

-- ── guests (host-managed guest list — never public) ────────────────────

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  name text not null,
  phone text,
  status public.guest_status not null default 'pending',
  guest_count integer not null default 1,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger guests_set_updated_at
  before update on public.guests
  for each row execute function public.set_updated_at();

create index guests_invitation_id_idx on public.guests (invitation_id);

alter table public.guests enable row level security;

-- Owner/admin only — a guest list is never public, not even for active invitations.
create policy "guests_owner_or_admin_only"
  on public.guests for all
  using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  );

-- ── rsvps (public submissions on a published invitation) ───────────────

create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  guest_name text not null,
  phone text,
  attendance public.rsvp_attendance not null,
  guest_count integer not null default 1,
  message text,
  created_at timestamptz not null default now()
);

create index rsvps_invitation_id_idx on public.rsvps (invitation_id);

alter table public.rsvps enable row level security;

-- Anyone (including anonymous visitors) may submit an RSVP on an active
-- invitation. They can never read back RSVP rows — only the owner/admin can.
-- IMPORTANT for the client code that submits this (Phase 6): call
-- `.insert(row)` WITHOUT chaining `.select()` — Postgres RLS evaluates a
-- RETURNING clause against the SELECT policies too, and since anon has no
-- SELECT policy here (by design), an insert().select() would itself fail
-- with a row-level security error even though the insert succeeds.
create policy "rsvps_insert_public_on_active"
  on public.rsvps for insert
  with check (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and i.status = 'active'
    )
  );

create policy "rsvps_select_owner_or_admin"
  on public.rsvps for select
  using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "rsvps_delete_owner_or_admin"
  on public.rsvps for delete
  using (
    exists (
      select 1 from public.invitations i
      where i.id = invitation_id and (i.user_id = auth.uid() or public.is_admin())
    )
  );

-- ── orders ──────────────────────────────────────────────────────────────

create sequence if not exists public.order_number_seq;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default (
    'ORD-' || to_char(now(), 'YYYYMM') || '-' || lpad(nextval('public.order_number_seq')::text, 5, '0')
  ),
  user_id uuid not null references public.profiles (id) on delete cascade,
  invitation_id uuid not null references public.invitations (id) on delete cascade,
  plan_id uuid references public.pricing_plans (id) on delete set null,
  customer_name text not null,
  customer_whatsapp text not null,
  plan_name text not null,
  price numeric(10, 2) not null,
  currency text not null default 'TND',
  status public.order_status not null default 'draft',
  admin_notes text,
  paid_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create index orders_user_id_idx on public.orders (user_id);
create index orders_invitation_id_idx on public.orders (invitation_id);
create index orders_status_idx on public.orders (status);

alter table public.orders enable row level security;

create policy "orders_select_own_or_admin"
  on public.orders for select
  using (auth.uid() = user_id or public.is_admin());

create policy "orders_insert_own"
  on public.orders for insert
  with check (auth.uid() = user_id);

-- Customers may only cancel their own draft/pending orders; every other
-- status transition (PAID, ACTIVE, ...) is an admin-only action performed
-- with the service role from the admin dashboard (Phase 8).
create policy "orders_update_admin_only"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

-- ── payments ────────────────────────────────────────────────────────────

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  amount numeric(10, 2) not null,
  currency text not null default 'TND',
  method text not null default 'whatsapp_manual',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'failed', 'refunded')),
  confirmed_by uuid references public.profiles (id),
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index payments_order_id_idx on public.payments (order_id);

alter table public.payments enable row level security;

-- Payment records are admin-only. Customers see payment status through
-- `orders.status`, not this table directly.
create policy "payments_admin_only"
  on public.payments for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── audit_logs ──────────────────────────────────────────────────────────

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles (id),
  action text not null,
  target_type text not null,
  target_id text,
  previous_status text,
  new_status text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_at_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

create policy "audit_logs_admin_select"
  on public.audit_logs for select
  using (public.is_admin());

-- No insert policy for regular roles: audit entries are written by admin
-- server actions using the service role key, which bypasses RLS entirely.
