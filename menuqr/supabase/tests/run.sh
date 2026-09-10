#!/usr/bin/env bash
# Applies the migrations and seed to a scratch database, then runs the
# authorization suite against it. Every expectation raises on failure, so a
# zero exit status means the whole suite passed.
#
#   PGHOST=/tmp PGPORT=5432 PGUSER=postgres ./supabase/tests/run.sh
#
# Requires a Postgres you can create databases on. It never touches your
# Supabase project.
set -euo pipefail

DB="${MENUQR_TEST_DB:-menuqr_test}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

echo "==> recreating database $DB"
psql -q -c "drop database if exists $DB;" -c "create database $DB;" postgres

echo "==> installing Supabase-shaped test harness"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$ROOT/supabase/tests/00_bootstrap.sql" >/dev/null

# MENUQR_TEST_SETUP=1 runs the suite against supabase/setup.sql — the single
# generated file a hosted project is set up from — instead of the migrations it
# is built from. Both must produce the same authorization behaviour, so running
# this mode catches drift after someone edits a migration without regenerating.
if [ "${MENUQR_TEST_SETUP:-0}" = "1" ]; then
  echo "==> applying setup.sql (generated single-file setup)"
  psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$ROOT/supabase/setup.sql" >/dev/null
else
  for file in "$ROOT"/supabase/migrations/*.sql "$ROOT/supabase/seed.sql"; do
    echo "==> applying $(basename "$file")"
    psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$file" >/dev/null
  done
fi

echo "==> running authorization suite"
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$ROOT/supabase/tests/01_rls.sql"
