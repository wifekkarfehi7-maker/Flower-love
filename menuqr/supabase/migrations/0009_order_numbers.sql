-- ============================================================================
-- MenuQR — 0009_order_numbers
--
-- A guest who has just ordered wants something to hold on to, and a waiter
-- carrying three plates wants something to call out. A uuid is neither. Each
-- order gets a small number, counted per venue and restarted each day, so the
-- room talks in "طلبية 12" rather than in identifiers.
--
-- Two orders must never share a number, and two phones tapping send at the
-- same moment is exactly when they would: read-then-insert races. The counter
-- is taken under a transaction advisory lock keyed on the venue, so orders for
-- one venue are numbered one at a time while other venues carry on untouched.
-- ============================================================================

alter table public.orders
  add column if not exists order_number integer;

-- Existing rows keep their place in the day they were placed.
update public.orders o
set order_number = numbered.rank
from (
  select id, row_number() over (
    partition by restaurant_id, date_trunc('day', created_at)
    order by created_at
  ) as rank
  from public.orders
) numbered
where numbered.id = o.id and o.order_number is null;

create index if not exists orders_daily_number_idx
  on public.orders (restaurant_id, created_at desc, order_number);

-- ---------------------------------------------------------------------------
-- place_order, with the number assigned as the order is written.
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
  v_number integer;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity smallint;
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

  select count(*) into v_recent
  from public.orders o
  where o.restaurant_id = p_restaurant
    and o.session_identifier = p_session
    and o.created_at > now() - interval '1 hour';

  if v_recent >= 10 then
    raise exception 'TOO_MANY_ORDERS' using errcode = 'check_violation';
  end if;

  select t.id into v_table
  from public.restaurant_tables t
  where t.id = p_table and t.restaurant_id = p_restaurant and t.deleted_at is null;

  -- Number the order. The lock is held to the end of this transaction, so the
  -- read and the insert below cannot be interleaved by another order for this
  -- same venue.
  perform pg_advisory_xact_lock(hashtext('menuqr.order_number:' || p_restaurant::text));

  select coalesce(max(o.order_number), 0) + 1 into v_number
  from public.orders o
  where o.restaurant_id = p_restaurant
    and o.created_at >= date_trunc('day', now());

  insert into public.orders (
    restaurant_id, table_id, session_identifier, customer_note, currency, order_number
  )
  values (
    p_restaurant,
    v_table,
    p_session,
    nullif(left(coalesce(trim(p_note), ''), 500), ''),
    'TND',
    v_number
  )
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(1, least(99, coalesce((v_item->>'quantity')::int, 1)));

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
-- The guest's own view of their order: enough to show a receipt without ever
-- reading the orders table.
-- ---------------------------------------------------------------------------
-- The returned shape changes, and CREATE OR REPLACE cannot do that.
drop function if exists public.order_status_for_session(uuid, text);

create function public.order_status_for_session(p_order uuid, p_session text)
returns table (
  status public.order_status,
  total numeric,
  created_at timestamptz,
  order_number integer,
  table_name text,
  items jsonb
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    o.status,
    o.total,
    o.created_at,
    o.order_number,
    t.name,
    coalesce(
      (
        select jsonb_agg(jsonb_build_object(
          'name', i.name_snapshot,
          'quantity', i.quantity,
          'line_total', i.line_total
        ) order by i.created_at)
        from public.order_items i
        where i.order_id = o.id
      ),
      '[]'::jsonb
    )
  from public.orders o
  left join public.restaurant_tables t on t.id = o.table_id
  where o.id = p_order
    and o.session_identifier = p_session
    and p_session is not null
    and char_length(p_session) >= 8;
$$;

revoke all on function public.order_status_for_session(uuid, text) from public;
grant execute on function public.order_status_for_session(uuid, text) to anon, authenticated;
