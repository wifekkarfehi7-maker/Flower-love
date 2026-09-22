-- ============================================================================
-- MenuQR — 0011_reviews
--
-- A guest rates the venue and can say why. Written the same way an order is,
-- and for the same reason: `anon` holds no write on the table, so everything
-- goes through one SECURITY DEFINER function that decides what is allowed.
--
-- What it decides, and why each one matters:
--   * the venue must be published — a review cannot be filed against a venue
--     that is not open to the public;
--   * a rating outside 1..5 is refused, not clamped into a score nobody gave;
--   * a table id from another venue is dropped, not honoured;
--   * one review per session per venue per day, so a single phone cannot
--     manufacture a reputation — good or bad;
--   * the note is trimmed and capped, because it is displayed to staff.
--
-- Reviews are not shown on the public menu. A venue reads its own; nothing
-- here lets one venue read another's, and nothing lets a guest read anyone's.
-- ============================================================================

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  table_id uuid references public.restaurant_tables (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 500),
  session_identifier text,
  created_at timestamptz not null default now()
);

create index if not exists reviews_restaurant_idx
  on public.reviews (restaurant_id, created_at desc);
create index if not exists reviews_session_idx
  on public.reviews (restaurant_id, session_identifier, created_at desc);

alter table public.reviews enable row level security;

-- The venue reads its own, and only its own.
drop policy if exists "reviews: members read" on public.reviews;
create policy "reviews: members read"
  on public.reviews for select
  to authenticated
  using (public.is_restaurant_member(restaurant_id) or public.is_super_admin());

-- Removing a review is an owner's call, not a waiter's.
drop policy if exists "reviews: owners delete" on public.reviews;
create policy "reviews: owners delete"
  on public.reviews for delete
  to authenticated
  using (public.can_administer_restaurant(restaurant_id));

-- This table is created after 0007_grants, so it is born holding the blanket
-- default privileges that migration exists to claw back. Revoke first, then
-- hand back only what a policy backs; otherwise `anon` keeps full DML on it.
revoke all on public.reviews from anon, authenticated;

grant select, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
-- `anon` gets nothing: the function below is the only way in.

-- ---------------------------------------------------------------------------
-- leave_review
-- ---------------------------------------------------------------------------
create or replace function public.leave_review(
  p_restaurant uuid,
  p_session text,
  p_rating smallint,
  p_comment text default null,
  p_table uuid default null,
  p_order uuid default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  v_review uuid;
  v_table uuid;
  v_order uuid;
begin
  if p_session is null or char_length(p_session) < 8 or char_length(p_session) > 64 then
    raise exception 'INVALID_SESSION' using errcode = 'check_violation';
  end if;

  if not public.is_restaurant_public(p_restaurant) then
    raise exception 'VENUE_NOT_AVAILABLE' using errcode = 'no_data_found';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'INVALID_RATING' using errcode = 'check_violation';
  end if;

  -- One voice per session per day. Without this a single phone could file a
  -- hundred reviews and the average would mean nothing.
  if exists (
    select 1 from public.reviews r
    where r.restaurant_id = p_restaurant
      and r.session_identifier = p_session
      and r.created_at >= date_trunc('day', now())
  ) then
    raise exception 'ALREADY_REVIEWED' using errcode = 'unique_violation';
  end if;

  select t.id into v_table
  from public.restaurant_tables t
  where t.id = p_table and t.restaurant_id = p_restaurant and t.deleted_at is null;

  -- An order is only attached when it belongs to this venue AND to this
  -- session, so a review cannot be pinned to somebody else's meal.
  select o.id into v_order
  from public.orders o
  where o.id = p_order
    and o.restaurant_id = p_restaurant
    and o.session_identifier = p_session;

  insert into public.reviews (restaurant_id, table_id, order_id, rating, comment, session_identifier)
  values (
    p_restaurant,
    v_table,
    v_order,
    p_rating,
    nullif(left(coalesce(trim(p_comment), ''), 500), ''),
    p_session
  )
  returning id into v_review;

  return v_review;
end;
$$;

revoke all on function public.leave_review(uuid, text, smallint, text, uuid, uuid) from public;
grant execute on function public.leave_review(uuid, text, smallint, text, uuid, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Whether this session has already had its say, so the guest is shown their
-- own state rather than a form that will be refused.
-- ---------------------------------------------------------------------------
create or replace function public.has_reviewed_today(p_restaurant uuid, p_session text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.reviews r
    where r.restaurant_id = p_restaurant
      and r.session_identifier = p_session
      and p_session is not null
      and char_length(p_session) >= 8
      and r.created_at >= date_trunc('day', now())
  );
$$;

revoke all on function public.has_reviewed_today(uuid, text) from public;
grant execute on function public.has_reviewed_today(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- The venue's summary, for the dashboard.
-- ---------------------------------------------------------------------------
create or replace function public.restaurant_review_summary(p_restaurant uuid)
returns table (
  total bigint,
  average numeric,
  five bigint,
  four bigint,
  three bigint,
  two bigint,
  one bigint
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    count(*),
    round(avg(r.rating)::numeric, 2),
    count(*) filter (where r.rating = 5),
    count(*) filter (where r.rating = 4),
    count(*) filter (where r.rating = 3),
    count(*) filter (where r.rating = 2),
    count(*) filter (where r.rating = 1)
  from public.reviews r
  where r.restaurant_id = p_restaurant
    and (public.is_restaurant_member(p_restaurant) or public.is_super_admin());
$$;

revoke all on function public.restaurant_review_summary(uuid) from public;
grant execute on function public.restaurant_review_summary(uuid) to authenticated;
