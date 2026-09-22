-- ============================================================================
-- MenuQR — 0012_function_grants
--
-- 0007 took the blanket table grants away from `anon`; this does the same for
-- functions, and for the same reason.
--
-- On a hosted Supabase project every new function in `public` is granted
-- EXECUTE directly to anon, authenticated and service_role by default
-- privileges — not through PUBLIC. So the `revoke all ... from public` each
-- migration wrote after a function never touched anon's own grant: every
-- function meant for signed-in staff stayed callable from the open internet.
--
-- Most of them check the caller themselves and refuse. Two did not:
-- seed_demo_restaurant and remove_demo_restaurant skipped their ownership
-- check when there was no signed-in user at all — which is exactly what an
-- anonymous caller is — and remove_demo_restaurant deletes any venue by slug.
-- Their bodies are fixed in seed.sql; this closes the door for every function.
--
-- What a guest keeps is the list below: what the public menu calls, and what
-- the policies a guest reads under call. Everything else of ours is staff-only.
-- ============================================================================

do $$
declare
  r record;
  v_guest_functions constant text[] := array[
    -- called by the public menu
    'resolve_qr_token',
    'track_menu_view',
    'track_menu_interaction',
    'place_order',
    'order_status_for_session',
    'leave_review',
    'has_reviewed_today',
    -- called by the policies a guest's reads are checked against
    'is_restaurant_public',
    'is_super_admin'
  ];
begin
  for r in
    select p.oid::regprocedure as fn
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and not (p.proname = any (v_guest_functions))
      -- An extension's functions are the extension's business.
      and not exists (
        select 1 from pg_depend d
        where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e'
      )
  loop
    -- Staff keep exactly what they had: grant first, so revoking PUBLIC can
    -- never take away a function a signed-in user reached only through it.
    execute format('grant execute on function %s to authenticated, service_role', r.fn);
    execute format('revoke execute on function %s from public, anon', r.fn);
  end loop;
end $$;
