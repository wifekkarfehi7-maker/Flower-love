# MenuQR 🍽️

Digital QR menus for restaurants and cafés — built Tunisia-first (TND, Arabic
default, Tunisian menu vocabulary) on an architecture that extends to other
Arabic-speaking and international markets.

> **This is a separate application from the wedding-invitations app at the
> repository root.** It has its own `package.json`, its own Supabase project and
> its own deployment. Nothing here touches the root app, and the root app's
> tooling ignores this folder.

## What it does

A restaurant signs up, builds a menu in Arabic, French and English, and gets a
stable QR code per table. A guest scans it and the menu opens in their browser
in about a second — no app, no login. Prices and dishes can change at any time
without reprinting anything, because the QR encodes only the venue slug and an
opaque table token.

- **Multi-tenant** — many venues on one platform, isolated at the database level
- **Multilingual** — every category and product carries ar/fr/en, with fallback
- **True RTL** — logical properties throughout, direction-aware menus and popovers
- **QR system** — a code per table plus a venue code, print sheets included
- **Analytics** — scans, views, top products, table activity; nothing personal
- **Roles** — owner / manager / staff per venue, plus platform administrators
- **Plans** — free / pro / business with quotas enforced by the database

## Tech stack

- **Next.js 14** (App Router, TypeScript strict, `noUncheckedIndexedAccess`)
- **Tailwind CSS** with a token-based design system
- **Supabase** — Postgres, Auth and Storage
- **Zod** + **React Hook Form** for validation, **Recharts** for analytics,
  **qrcode** for code generation, **dnd-kit** for reordering

## Security model

Row Level Security is the authorization boundary, not a second line of defence:

- The browser talks to Postgres through PostgREST with the signed-in user's own
  JWT. A venue owner **cannot** read or write another venue's rows no matter
  what the client sends.
- **There is no service-role key in this application.** The handful of
  operations that need elevated privilege — bootstrapping a venue's owner row,
  anonymous view tracking, admin actions, adding a teammate by email — are
  narrow `SECURITY DEFINER` functions with a locked `search_path` that re-check
  the caller's rights themselves.
- Anonymous visitors get exactly two capabilities, both through validated RPCs:
  resolve a QR token, and record a de-duplicated view. They cannot enumerate
  tables or QR tokens, and cannot insert analytics rows directly.
- Plan quotas, privilege columns (`platform_role`, venue `status`) and
  cross-tenant product/category consistency are enforced by triggers, so the
  rules hold even against direct API access.

All of this is covered by an executable test suite — see [Tests](#tests).

## Local setup

**Prerequisites:** Node.js 18.18+ (or 20+) and a [Supabase](https://supabase.com)
project (the free tier is enough).

```bash
cd menuqr
npm install
cp .env.example .env.local     # then fill in the two Supabase values
```

Without those variables the app still runs: every page and form shows a friendly
"backend not configured" state instead of crashing, and the marketing site is
fully functional.

### Database

Run the migrations in order against your Supabase project (SQL Editor or CLI),
then the seed:

```
supabase/migrations/0001_init.sql         core schema, enums, RLS policies
supabase/migrations/0002_storage.sql      menu-images bucket + path-scoped policies
supabase/migrations/0003_analytics.sql    QR resolution, view tracking, reporting
supabase/migrations/0004_admin.sql        super-admin RPCs + audit log
supabase/migrations/0005_plan_limits.sql  plan quota enforcement
supabase/migrations/0006_team.sql         add a teammate by email
supabase/seed.sql                         the three plans + demo-venue functions
```

With the Supabase CLI:

```bash
supabase db push
psql "$DATABASE_URL" -f supabase/seed.sql
```

### First administrator

Accounts are always created as ordinary users. Sign up through the app once,
then promote yourself from the Supabase SQL editor:

```sql
update public.profiles set platform_role = 'super_admin' where email = 'you@example.com';
```

This works from the SQL editor (a trusted session with no signed-in user) but
**not** from the application — a signed-in user can never promote themselves.
After that, `/admin` is reachable and further admins can be promoted from
`/admin/users`.

### Demo data

From **Settings → Team** in the dashboard, or from SQL:

```sql
select public.seed_demo_restaurant('<your-user-uuid>');  -- Café El Medina
select public.remove_demo_restaurant();                  -- and cleanly gone again
```

### Run it

```bash
npm run dev        # http://localhost:3000
```

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Tests

The authorization model is verified against a real Postgres instance, driving
the database as the actual `anon` and `authenticated` roles rather than as the
table owner. Roughly forty assertions cover tenant isolation, role boundaries,
plan quotas, privilege escalation, anonymous tracking, admin gating and storage
path scoping.

```bash
PGHOST=/tmp PGPORT=5432 PGUSER=postgres ./supabase/tests/run.sh
```

It creates its own scratch database (`menuqr_test`), applies the migrations and
seed, and exits non-zero on the first failed expectation. It never touches your
Supabase project. `supabase/tests/00_bootstrap.sql` stands in for the parts of a
Supabase project the schema depends on (`auth.users`, `auth.uid()`, storage
tables) so the suite runs on plain Postgres.

## Routes

```
/                         Landing page
/menu/[slug]              Public menu (?t=<token> identifies the scanned table)
/privacy, /terms          Policies

/login /register /forgot-password /reset-password
/onboarding               Two-step venue creation

/dashboard                Overview, setup checklist, recent activity
/dashboard/menu           Menu structure, category by category
/dashboard/categories     Categories with drag ordering
/dashboard/products       Products, filters, options, availability
/dashboard/tables         Tables and zones, bulk creation
/dashboard/qr             QR codes: download, print, regenerate
/dashboard/qr/print       Printable QR cards
/dashboard/analytics      Scans, views, top products, table activity
/dashboard/restaurant     Profile, branding, hours, contact
/dashboard/settings       Menu settings, account, team, demo data
/dashboard/subscription   Plan, usage and quotas

/admin                    Platform overview
/admin/restaurants        Search, suspend/activate, change plan
/admin/users              Search, roles, suspension
/admin/subscriptions      Plan distribution
/admin/settings           Plan catalogue + audit log
```

## Roles

| Capability | Owner | Manager | Staff |
| --- | :---: | :---: | :---: |
| Menu, tables, QR codes | ✅ | ✅ | — |
| Mark a dish sold out | ✅ | ✅ | ✅ |
| Analytics | ✅ | ✅ | — |
| Venue profile and branding | ✅ | — | — |
| Team and subscription | ✅ | — | — |

Staff hold no `UPDATE` grant on products at all; toggling availability goes
through a dedicated function, so the boundary is enforced by the database.

## Performance notes

The public menu is the page that matters: it is opened on a phone, on mobile
data, seconds after a scan.

- It is read through a **cookie-free** Supabase client, so the page stays
  cacheable, and the whole menu arrives in one round trip.
- The result is cached under a per-venue tag; the dashboard purges that tag
  through an auth-checked route as soon as an owner saves, so edits are visible
  immediately without giving up caching.
- Per-visit work (resolving the scanned table, recording the view) happens in
  the browser, off the critical render path.
- Uploaded images are downscaled and re-encoded to WebP in the browser before
  upload — a 4 MB camera photo becomes roughly 100 KB.

## Deployment

Standard Next.js App Router project — deploy to Vercel or any Node host.

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production anon/public key |
| `NEXT_PUBLIC_SITE_URL` | Public origin, no trailing slash — QR targets, canonical URLs, sitemap |

1. Create a production Supabase project and apply the migrations and seed.
2. Storage is created by `0002_storage.sql`; no manual bucket setup.
3. Deploy with the variables above, then point your domain and update
   `NEXT_PUBLIC_SITE_URL` to match.
4. Bootstrap your first administrator against the production database.

Security headers (CSP, HSTS, frame and MIME protections) are configured in
`next.config.mjs`; `robots.txt` and `sitemap.xml` are generated at runtime, and
each venue's menu is only listed when the venue leaves indexing enabled.

## Deliberately not built

Honesty matters more here than a longer feature list:

- **No online payments.** No gateway is connected. Payment sits behind a
  `PaymentProvider` interface (`src/lib/billing/provider.ts`) with a single
  manual implementation, and the UI says plainly that upgrades are arranged
  directly. Adding Konnect, Flouci, Paymee or ClicToPay means implementing that
  interface — no schema or UI redesign.
- **No table ordering.** The guest-side selection list is local to the browser
  and clearly labelled as a reference for talking to the waiter. The `orders`
  and `order_items` tables exist so ordering can be switched on later without a
  data migration.
- **No phone authentication yet.** Email and password only; the profile already
  carries a phone number for when it is added.

## Project structure

```
src/app/                Routes (App Router)
  (auth)/               Login, register, password reset
  dashboard/            Venue dashboard
  admin/                Platform administration
  menu/[slug]/          Public menu
  api/menu/revalidate/  Auth-checked cache purge
src/components/         UI grouped by feature area
src/lib/
  supabase/             Browser, server, anon and middleware clients
  i18n/                 Config, ar/fr/en dictionaries, provider, formatting
  menu/                 Schemas, mappers, themes, public-menu reads
  qr/                   Token URLs and code rendering
  analytics/            Tracking hook and reporting queries
  billing/              Plans and the payment-provider interface
  restaurants/, auth/, admin/, storage/, legal/
src/types/database.ts   Hand-written mirror of the SQL schema
supabase/migrations/    Applied in numeric order
supabase/tests/         Authorization suite + Postgres harness
```

## License

Private, unpublished project. All rights reserved.
