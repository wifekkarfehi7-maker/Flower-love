-- ============================================================================
-- Local test harness: the parts of a Supabase project the migrations depend on
-- (auth roles, auth.users, auth.uid(), storage buckets/objects), so the schema
-- and its RLS policies can be exercised against a plain Postgres instance.
--
-- Not used in production — Supabase provides all of this.
-- ============================================================================

do $$ begin create role anon nologin; exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; end $$;

grant anon, authenticated, service_role to postgres;

create schema if not exists auth;
create schema if not exists storage;

-- Supabase keeps extensions out of `public`. Mirroring that here matters: a
-- SECURITY DEFINER function with a locked search_path cannot reach them, and
-- installing pgcrypto into `public` locally would hide exactly that failure.
create schema if not exists extensions;
create extension if not exists "pgcrypto" schema extensions;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Mirrors Supabase: the current user id comes from the request's JWT claims.
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

create table if not exists storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[],
  created_at timestamptz not null default now()
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text not null,
  owner uuid,
  created_at timestamptz not null default now()
);

alter table storage.objects enable row level security;

-- Supabase's helper: the folder components of an object path, without the file.
create or replace function storage.foldername(name text)
returns text[]
language sql
immutable
as $$
  select (string_to_array(name, '/'))[1:greatest(array_length(string_to_array(name, '/'), 1) - 1, 0)];
$$;

grant usage on schema public, auth, storage to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
grant execute on function storage.foldername(text) to anon, authenticated;
grant select, insert, update, delete on storage.objects to authenticated;
grant select on storage.objects to anon;

alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public grant select on tables to anon;
alter default privileges in schema public grant execute on functions to anon, authenticated;
