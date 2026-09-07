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
