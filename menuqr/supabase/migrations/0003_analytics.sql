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
