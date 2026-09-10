-- ============================================================================
-- MenuQR — 0007_grants
--
-- Every table privilege the application needs, stated explicitly.
--
-- Until this migration the schema carried no table-level GRANTs at all: it
-- worked only because a Supabase project ships default privileges that hand
-- `anon`, `authenticated` and `service_role` full DML on everything created in
-- `public`, leaving RLS as the only thing standing between an anonymous
-- visitor and a DELETE. That is an implicit dependency on how the host happens
-- to be configured, and it fails outright on a plain Postgres or on a project
-- whose `public` schema was recreated.
--
-- So: revoke the blanket grants, then hand back exactly the commands each role
-- has a policy for. RLS still decides which ROWS a caller may touch; these
-- grants decide which COMMANDS are available at all, which means a missing or
-- mistaken policy can no longer be the only thing standing between `anon` and
-- a write. The two layers are derived from the same matrix and must stay in
-- step — supabase/tests/01_rls.sql asserts the result.
--
-- Deliberately untouched: function privileges. 0003-0006 revoke EXECUTE from
-- PUBLIC and grant it to named roles one function at a time; a blanket grant
-- here would paper over that.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Clean slate. `anon` and `authenticated` get nothing back except what is
-- listed below; `service_role` keeps the full access Supabase tooling expects.
revoke all on all tables in schema public from anon, authenticated;
grant all on all tables in schema public to service_role;

-- ---------------------------------------------------------------------------
-- anon — the public menu, and nothing else.
--
-- A guest reads a published venue and its menu. Everything else an anonymous
-- visitor can do (resolving a scanned QR token, recording a view) goes through
-- a SECURITY DEFINER function that validates its own input, so `anon` needs no
-- privilege on the analytics tables and must not be able to enumerate tables,
-- QR tokens, members, profiles or orders.
-- ---------------------------------------------------------------------------
grant select on public.restaurants           to anon;
grant select on public.restaurant_settings   to anon;
grant select on public.categories            to anon;
grant select on public.products              to anon;
grant select on public.product_option_groups to anon;
grant select on public.product_options       to anon;
grant select on public.subscription_plans    to anon;

-- ---------------------------------------------------------------------------
-- authenticated — the dashboard.
--
-- Row scoping is entirely the policies' job: holding INSERT on `restaurants`
-- is not permission to write to somebody else's venue.
-- ---------------------------------------------------------------------------

-- Menu content: created, edited and removed by owners and managers.
grant select, insert, update, delete on public.categories            to authenticated;
grant select, insert, update, delete on public.products              to authenticated;
grant select, insert, update, delete on public.product_option_groups to authenticated;
grant select, insert, update, delete on public.product_options       to authenticated;

-- Venue, tables and QR codes.
grant select, insert, update, delete on public.restaurants        to authenticated;
grant select, insert, update, delete on public.restaurant_members to authenticated;
grant select, insert, update, delete on public.restaurant_tables  to authenticated;
grant select, insert, update, delete on public.qr_codes           to authenticated;

-- Settings are created with the venue and edited in place; there is no policy
-- that deletes one, so there is no DELETE grant either.
grant select, insert, update on public.restaurant_settings to authenticated;

-- The signed-in user's own profile. Rows are created by the auth trigger, and
-- `platform_role` is defended separately by a trigger, so no INSERT or DELETE.
grant select, update on public.profiles to authenticated;

-- Analytics are read-only from the client: rows arrive through the tracking
-- functions, which are the only writers.
grant select on public.menu_views        to authenticated;
grant select on public.menu_interactions to authenticated;

-- Billing. Plans are readable by everyone and writable only by a platform
-- administrator, which the policy enforces.
grant select, insert, update, delete on public.subscription_plans to authenticated;
grant select, insert, update, delete on public.subscriptions      to authenticated;

-- Ordering is not switched on yet, but the tables and their policies exist so
-- it can be enabled without a data migration.
grant select, insert, update, delete on public.orders      to authenticated;
grant select, insert, update, delete on public.order_items to authenticated;

-- Written only by the admin functions; visible to platform administrators.
grant select on public.admin_audit_log to authenticated;
