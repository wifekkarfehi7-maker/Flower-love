#!/usr/bin/env bash
# Regenerates supabase/setup.sql — every migration, in order, plus the seed,
# concatenated into one file so a hosted project can be set up with a single
# paste into the Supabase SQL Editor. Run after changing anything under
# migrations/ or seed.sql, and commit the result.
set -euo pipefail

cd "$(dirname "$0")"
out=setup.sql

{
  cat <<'HEADER'
-- ============================================================================
-- MenuQR — complete database setup, in one file.
--
-- GENERATED FILE — do not edit. Regenerate with supabase/build-setup.sh.
-- The sources of truth are supabase/migrations/*.sql and supabase/seed.sql.
--
-- Paste the whole file into the Supabase SQL Editor (Dashboard -> SQL Editor
-- -> New query) and run it. It is safe to run more than once: tables use
-- IF NOT EXISTS, policies are dropped before being recreated, and the plan
-- rows upsert on their code.
--
-- It does NOT create any user. Sign up through the app first, then promote
-- yourself:
--   update public.profiles set platform_role = 'super_admin'
--    where email = 'you@example.com';
-- ============================================================================

begin;
HEADER

  for f in migrations/*.sql seed.sql; do
    printf '\n\n-- ===========================================================================\n'
    printf -- '-- %s\n' "$f"
    printf -- '-- ===========================================================================\n\n'
    cat "$f"
  done

  cat <<'FOOTER'


commit;

-- ============================================================================
-- Verification — the three plan rows should come back as the plan catalogue,
-- and every count below should be non-zero.
-- ============================================================================
select code, name_en, price_monthly, currency,
       max_categories, max_products, max_tables, max_members
  from public.subscription_plans
 order by sort_order;

select
  (select count(*) from pg_tables   where schemaname = 'public')  as tables,
  (select count(*) from pg_policies where schemaname = 'public')  as policies,
  (select count(*) from pg_proc p
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public')                                   as functions,
  (select count(*) from storage.buckets where id = 'menu-images') as image_bucket;
FOOTER
} > "$out"

printf 'wrote %s (%s lines, %s)\n' "$out" "$(wc -l < "$out")" "$(du -h "$out" | cut -f1)"
