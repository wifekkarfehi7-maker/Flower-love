-- ============================================================================
-- MenuQR — authorization test suite
--
-- Exercises the security model as the real roles do: `anon` and
-- `authenticated` with a JWT subject, never as the table owner. Any failed
-- expectation raises, so the script exits non-zero.
--
-- Run against a database with 00_bootstrap.sql + all migrations + seed.sql:
--   psql -v ON_ERROR_STOP=1 -d menuqr_test -f supabase/tests/01_rls.sql
-- ============================================================================

\set QUIET on
\pset tuples_only on
\pset format unaligned

create or replace function public.test_assert(p_condition boolean, p_label text)
returns void
language plpgsql
as $$
begin
  if p_condition is not true then
    raise exception 'FAILED: %', p_label;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Fixtures
-- ---------------------------------------------------------------------------

insert into auth.users (email, raw_user_meta_data)
values ('owner-a@test.tn', '{"full_name":"Owner A"}'::jsonb) returning id as id \gset ownera_
insert into auth.users (email, raw_user_meta_data)
values ('owner-b@test.tn', '{"full_name":"Owner B"}'::jsonb) returning id as id \gset ownerb_
insert into auth.users (email, raw_user_meta_data)
values ('staff@test.tn', '{"full_name":"Staff"}'::jsonb) returning id as id \gset staff_
insert into auth.users (email, raw_user_meta_data)
values ('admin@test.tn', '{"full_name":"Admin"}'::jsonb) returning id as id \gset admin_

do $$
begin
  perform public.test_assert(
    (select count(*) from public.profiles) = 4,
    'a profile row is created for every auth user'
  );
end $$;

-- ---------------------------------------------------------------------------
-- Owner A builds a published venue
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claim.sub', :'ownera_id', false);
set role authenticated;

insert into public.restaurants (owner_id, name, slug, default_language)
values (:'ownera_id', 'Cafe A', 'cafe-a', 'ar') returning id as id \gset resta_

do $$
declare
  v_restaurant uuid := (select id from public.restaurants where slug = 'cafe-a');
begin
  perform public.test_assert(
    exists (select 1 from public.restaurant_members where restaurant_id = v_restaurant and role = 'owner'),
    'creating a venue makes the creator its owner'
  );
  perform public.test_assert(
    exists (select 1 from public.restaurant_settings where restaurant_id = v_restaurant),
    'creating a venue creates its settings row'
  );
  perform public.test_assert(
    exists (select 1 from public.qr_codes where restaurant_id = v_restaurant and table_id is null),
    'creating a venue creates its general QR code'
  );
  perform public.test_assert(
    exists (
      select 1 from public.subscriptions s
      join public.subscription_plans p on p.id = s.plan_id
      where s.restaurant_id = v_restaurant and p.code = 'free'
    ),
    'a new venue starts on the free plan'
  );
end $$;

insert into public.categories (restaurant_id, name_fr, sort_order)
values (:'resta_id', 'Boissons', 1) returning id as id \gset cata_

insert into public.products (restaurant_id, category_id, name_fr, price)
values (:'resta_id', :'cata_id', 'Cappuccino', 3.5) returning id as id \gset proda_

insert into public.restaurant_tables (restaurant_id, name, identifier)
values (:'resta_id', 'Table 1', 'table-1') returning id as id \gset tablea_

do $$
declare
  v_table uuid := (select id from public.restaurant_tables where identifier = 'table-1');
begin
  perform public.test_assert(
    exists (select 1 from public.qr_codes where table_id = v_table and is_active),
    'creating a table generates its QR code'
  );
end $$;

-- Plan quotas are enforced by the database, not only by the interface.
do $$
declare
  v_restaurant uuid := (select id from public.restaurants where slug = 'cafe-a');
  v_failed boolean := false;
begin
  for i in 2..5 loop
    insert into public.categories (restaurant_id, name_fr, sort_order) values (v_restaurant, 'Cat ' || i, i);
  end loop;

  begin
    insert into public.categories (restaurant_id, name_fr, sort_order) values (v_restaurant, 'Over limit', 6);
  exception when check_violation then
    v_failed := true;
  end;

  perform public.test_assert(v_failed, 'the free plan category limit is enforced in the database');
end $$;

-- Privileged columns are protected even from the venue's own owner.
do $$
declare
  v_restaurant uuid := (select id from public.restaurants where slug = 'cafe-a');
begin
  update public.restaurants set status = 'suspended' where id = v_restaurant;
  perform public.test_assert(
    (select status from public.restaurants where id = v_restaurant) = 'active',
    'an owner cannot suspend their own venue to escape moderation'
  );

  update public.profiles set platform_role = 'super_admin' where id = auth.uid();
  perform public.test_assert(
    (select platform_role from public.profiles where id = auth.uid()) = 'user',
    'a user cannot promote themselves to platform admin'
  );
end $$;

-- ---------------------------------------------------------------------------
-- Owner B: a second tenant, unpublished
-- ---------------------------------------------------------------------------

reset role;
select set_config('request.jwt.claim.sub', :'ownerb_id', false);
set role authenticated;

insert into public.restaurants (owner_id, name, slug, default_language, is_published)
values (:'ownerb_id', 'Cafe B', 'cafe-b', 'fr', false) returning id as id \gset restb_

do $$
declare
  v_a uuid := (select id from public.restaurants where slug = 'cafe-a');
  v_product uuid;
  v_rows integer;
  v_blocked boolean := false;
begin
  select id into v_product from public.products where restaurant_id = v_a;

  -- A published menu is public by design, so B can read the venue and its
  -- products. What B must never do is write to them, or read anything private.
  update public.restaurants set name = 'Hijacked' where id = v_a;
  get diagnostics v_rows = row_count;
  perform public.test_assert(v_rows = 0, 'another tenant cannot rename a venue');

  update public.products set price = 0 where restaurant_id = v_a;
  get diagnostics v_rows = row_count;
  perform public.test_assert(v_rows = 0, 'another tenant cannot change a venue''s prices');

  delete from public.products where restaurant_id = v_a;
  get diagnostics v_rows = row_count;
  perform public.test_assert(v_rows = 0, 'another tenant cannot delete a venue''s products');

  begin
    insert into public.categories (restaurant_id, name_fr) values (v_a, 'Injected');
  exception when insufficient_privilege then
    v_blocked := true;
  end;
  perform public.test_assert(v_blocked, 'another tenant cannot add categories to a venue');

  perform public.test_assert(
    (select count(*) from public.restaurant_tables where restaurant_id = v_a) = 0,
    'another tenant cannot read a venue''s tables'
  );
  perform public.test_assert(
    (select count(*) from public.qr_codes where restaurant_id = v_a) = 0,
    'another tenant cannot read a venue''s QR tokens'
  );
  perform public.test_assert(
    (select count(*) from public.menu_views where restaurant_id = v_a) = 0,
    'another tenant cannot read a venue''s analytics'
  );
  perform public.test_assert(
    (select count(*) from public.subscriptions where restaurant_id = v_a) = 0,
    'another tenant cannot read a venue''s subscription'
  );
  perform public.test_assert(
    (select count(*) from public.restaurant_members where restaurant_id = v_a) = 0,
    'another tenant cannot read a venue''s team'
  );
end $$;

-- ---------------------------------------------------------------------------
-- Anonymous visitors
-- ---------------------------------------------------------------------------

reset role;
select set_config('request.jwt.claim.sub', '', false);
set role anon;

do $$
begin
  perform public.test_assert(
    (select count(*) from public.restaurants where slug = 'cafe-a') = 1,
    'a published menu is readable by anyone'
  );
  perform public.test_assert(
    (select count(*) from public.restaurants where slug = 'cafe-b') = 0,
    'an unpublished venue is invisible to the public'
  );
end $$;

-- Tables and QR tokens are not merely filtered to nothing for a guest: since
-- 0007_grants `anon` holds no SELECT on them at all, so the read is refused
-- before any policy is consulted. Assert the refusal itself — a version that
-- only counted rows would still pass if the grant came back.
do $$
declare
  v_denied boolean;
begin
  begin
    perform count(*) from public.restaurant_tables;
    v_denied := false;
  exception when insufficient_privilege then
    v_denied := true;
  end;
  perform public.test_assert(v_denied, 'the public cannot enumerate tables');

  begin
    perform count(*) from public.qr_codes;
    v_denied := false;
  exception when insufficient_privilege then
    v_denied := true;
  end;
  perform public.test_assert(v_denied, 'the public cannot enumerate QR tokens');
end $$;

-- View tracking: allowed, de-duplicated, and only for public venues.
do $$
declare
  v_a uuid := (select id from public.restaurants where slug = 'cafe-a');
  v_b uuid;
begin
  perform public.track_menu_view(v_a, 'session-abcdef123456', null, null, 'ar', 'qr');
  perform public.track_menu_view(v_a, 'session-abcdef123456', null, null, 'ar', 'qr');
  perform public.track_menu_view(v_a, 'short', null, null, 'ar', 'qr');

  select id into v_b from public.restaurants r where r.slug = 'cafe-b';
  perform public.track_menu_view(coalesce(v_b, gen_random_uuid()), 'session-zzzzzz999999', null, null, 'fr', 'direct');
end $$;

reset role;
do $$
begin
  perform public.test_assert(
    (select count(*) from public.menu_views) = 1,
    'repeat views from one session inside the window are counted once'
  );
  perform public.test_assert(
    (select count(*) from public.menu_views where session_identifier = 'short') = 0,
    'a malformed session identifier records nothing'
  );
  perform public.test_assert(
    (select count(*) from public.menu_views mv join public.restaurants r on r.id = mv.restaurant_id where r.slug = 'cafe-b') = 0,
    'an unpublished venue records no views'
  );
end $$;

-- Token resolution only answers for a live, published venue. The token is read
-- here as the owner, because anon deliberately cannot list qr_codes at all.
select q.token as token
from public.qr_codes q
join public.restaurants r on r.id = q.restaurant_id
where r.slug = 'cafe-a' and q.table_id is not null \gset tablea_

-- Carried through a setting because psql does not interpolate variables inside
-- dollar-quoted blocks.
select set_config('test.qr_token', :'tablea_token', false);

set role anon;
do $$
declare
  v_token text := current_setting('test.qr_token', true);
begin
  perform public.test_assert(
    (select count(*) from public.resolve_qr_token('cafe-a', v_token)) = 1,
    'a table QR token resolves for a published venue'
  );
  perform public.test_assert(
    (select count(*) from public.resolve_qr_token('cafe-a', 'not-a-real-token')) = 0,
    'an unknown QR token resolves to nothing'
  );
end $$;

-- ---------------------------------------------------------------------------
-- Staff role: availability only
-- ---------------------------------------------------------------------------

reset role;
select set_config('request.jwt.claim.sub', :'ownera_id', false);
set role authenticated;

-- The free plan has a single seat, already taken by the owner.
do $$
declare
  v_blocked boolean := false;
begin
  begin
    insert into public.restaurant_members (restaurant_id, user_id, role)
    values (
      (select id from public.restaurants where slug = 'cafe-a'),
      (select id from public.profiles where email = 'staff@test.tn'),
      'staff'
    );
  exception when check_violation then
    v_blocked := true;
  end;
  perform public.test_assert(v_blocked, 'the free plan team-size limit is enforced');
end $$;

-- Fixture: put the venue on a plan with room for staff.
reset role;
update public.subscriptions
set plan_id = (select id from public.subscription_plans where code = 'pro')
where restaurant_id = :'resta_id';

select set_config('request.jwt.claim.sub', :'ownera_id', false);
set role authenticated;

insert into public.restaurant_members (restaurant_id, user_id, role)
values (:'resta_id', :'staff_id', 'staff');

reset role;
select set_config('request.jwt.claim.sub', :'staff_id', false);
set role authenticated;

do $$
declare
  v_product uuid := (select id from public.products limit 1);
  v_rows integer;
  v_blocked boolean := false;
begin
  perform public.test_assert(
    (select count(*) from public.restaurant_tables) = 1,
    'staff can see their own venue''s tables'
  );

  update public.products set price = 999 where id = v_product;
  get diagnostics v_rows = row_count;
  perform public.test_assert(v_rows = 0, 'staff cannot edit product prices');

  begin
    insert into public.categories (restaurant_id, name_fr)
    values ((select restaurant_id from public.products where id = v_product), 'Staff category');
  exception when insufficient_privilege then
    v_blocked := true;
  end;
  perform public.test_assert(v_blocked, 'staff cannot create categories');

  perform public.set_product_availability(v_product, false);
  perform public.test_assert(
    (select is_available from public.products where id = v_product) = false,
    'staff can mark a dish sold out'
  );
end $$;

-- ---------------------------------------------------------------------------
-- Platform administration
-- ---------------------------------------------------------------------------

do $$
declare
  v_denied boolean := false;
begin
  begin
    perform public.admin_platform_stats();
  exception when insufficient_privilege then
    v_denied := true;
  end;
  perform public.test_assert(v_denied, 'a normal user cannot call admin reporting');
end $$;

-- Bootstrapping the first administrator, exactly as the README describes:
-- from a trusted SQL session with no signed-in user.
reset role;
select set_config('request.jwt.claim.sub', '', false);
update public.profiles set platform_role = 'super_admin' where id = :'admin_id';

do $$
begin
  perform public.test_assert(
    (select platform_role from public.profiles where email = 'admin@test.tn') = 'super_admin',
    'the first administrator can be bootstrapped from a trusted SQL session'
  );
end $$;

select set_config('request.jwt.claim.sub', :'admin_id', false);
set role authenticated;

do $$
declare
  v_a uuid := (select id from public.restaurants where slug = 'cafe-a');
begin
  perform public.test_assert(
    (select total_restaurants from public.admin_platform_stats()) = 2,
    'an admin sees every venue in platform stats'
  );
  perform public.test_assert(
    (select count(*) from public.admin_restaurants(null, null, 20, 0)) = 2,
    'an admin can list venues across tenants'
  );

  perform public.admin_set_restaurant_status(v_a, 'suspended', 'testing');
  perform public.test_assert(
    (select status from public.restaurants where id = v_a) = 'suspended',
    'an admin can suspend a venue'
  );
  perform public.test_assert(
    exists (select 1 from public.admin_audit_log where action = 'restaurant.suspend'),
    'admin actions are written to the audit log'
  );
end $$;

-- A suspended venue disappears from the public menu immediately.
reset role;
select set_config('request.jwt.claim.sub', '', false);
set role anon;

do $$
begin
  perform public.test_assert(
    (select count(*) from public.restaurants where slug = 'cafe-a') = 0,
    'a suspended venue is no longer public'
  );
  perform public.test_assert(
    (select count(*) from public.products) = 0,
    'a suspended venue''s products are no longer public'
  );
end $$;

-- ---------------------------------------------------------------------------
-- Storage: writes are scoped to the folder named after the venue
-- ---------------------------------------------------------------------------

reset role;
select set_config('request.jwt.claim.sub', :'ownerb_id', false);
set role authenticated;

do $$
declare
  v_a uuid := (select id from public.restaurants r where r.slug = 'cafe-a');
  v_b uuid := (select id from public.restaurants r where r.slug = 'cafe-b');
  v_blocked boolean := false;
begin
  insert into storage.objects (bucket_id, name) values ('menu-images', v_b || '/product/own.webp');

  begin
    insert into storage.objects (bucket_id, name) values ('menu-images', v_a || '/product/stolen.webp');
  exception when insufficient_privilege then
    v_blocked := true;
  end;
  perform public.test_assert(v_blocked, 'a tenant cannot upload into another tenant''s image folder');

  begin
    insert into storage.objects (bucket_id, name) values ('menu-images', 'not-a-uuid/product/x.webp');
  exception when insufficient_privilege then
    v_blocked := true;
  end;
  perform public.test_assert(v_blocked, 'a malformed image path is rejected rather than crashing the policy');
end $$;

reset role;
select set_config('request.jwt.claim.sub', '', false);

-- ---------------------------------------------------------------------------
-- Table privileges (0007_grants)
--
-- RLS decides which rows a caller reaches; these grants decide which commands
-- exist for them at all. The suite checks both so that neither layer is
-- silently carrying the other — in particular, `anon` must hold no write
-- anywhere, so a mistaken policy cannot by itself expose a write to the
-- internet.
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
  -- Everything a guest reads to render a published menu.
  v_public_read text[] := array[
    'restaurants', 'restaurant_settings', 'categories',
    'products', 'product_option_groups', 'product_options',
    'subscription_plans'
  ];
begin
  for r in
    select tablename from pg_tables where schemaname = 'public'
  loop
    -- No write reaches an anonymous visitor, on any table.
    perform public.test_assert(
      not has_table_privilege('anon', 'public.' || quote_ident(r.tablename), 'INSERT')
      and not has_table_privilege('anon', 'public.' || quote_ident(r.tablename), 'UPDATE')
      and not has_table_privilege('anon', 'public.' || quote_ident(r.tablename), 'DELETE'),
      format('anon holds no write grant on %s', r.tablename)
    );

    -- And it reads only what the public menu needs.
    perform public.test_assert(
      has_table_privilege('anon', 'public.' || quote_ident(r.tablename), 'SELECT')
        = (r.tablename = any(v_public_read)),
      format('anon read grant on %s matches the public-menu set', r.tablename)
    );
  end loop;
end $$;

do $$
begin
  -- Profiles are created by the auth trigger and deleted with the user.
  perform public.test_assert(
    not has_table_privilege('authenticated', 'public.profiles', 'INSERT')
    and not has_table_privilege('authenticated', 'public.profiles', 'DELETE'),
    'a signed-in user cannot insert or delete profile rows'
  );

  -- Analytics rows arrive through the tracking functions, which are the only
  -- writers; the audit log is written only by the admin functions.
  perform public.test_assert(
    not has_table_privilege('authenticated', 'public.menu_views', 'INSERT')
    and not has_table_privilege('authenticated', 'public.menu_interactions', 'INSERT')
    and not has_table_privilege('authenticated', 'public.admin_audit_log', 'INSERT'),
    'analytics and audit rows cannot be written directly by a client'
  );

  -- Settings live and die with their venue; nothing deletes one on its own.
  perform public.test_assert(
    not has_table_privilege('authenticated', 'public.restaurant_settings', 'DELETE'),
    'settings rows cannot be deleted independently of their venue'
  );

  -- The dashboard still has the grants it actually needs.
  perform public.test_assert(
    has_table_privilege('authenticated', 'public.restaurants', 'INSERT')
    and has_table_privilege('authenticated', 'public.categories', 'DELETE')
    and has_table_privilege('authenticated', 'public.products', 'UPDATE')
    and has_table_privilege('authenticated', 'public.qr_codes', 'INSERT'),
    'the dashboard keeps the grants the product needs'
  );
end $$;

\pset tuples_only off
\echo 'ALL AUTHORIZATION TESTS PASSED'
