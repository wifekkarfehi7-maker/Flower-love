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
