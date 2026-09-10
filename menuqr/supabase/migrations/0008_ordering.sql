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
