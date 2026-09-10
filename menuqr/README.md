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
- **Ordering** — a guest sends an order from their phone and it lands on the
  venue's screen; off by default, per venue
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
- Table grants are least-privilege and explicit (`0007_grants.sql`), rather
  than the blanket DML a Supabase project grants every role by default. `anon`
  holds no write anywhere and can read only what a published menu needs, so a
  mistaken policy cannot by itself expose a write to the internet.

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

**Fastest path — a full local Supabase stack.** With Docker running:

```bash
supabase start          # Postgres, Auth, Storage, PostgREST, mail catcher
```

The CLI applies `supabase/migrations/*.sql` in order and then `supabase/seed.sql`,
and prints the API URL and anon key to put in `.env.local`. `supabase status`
reprints them; `supabase db reset` reapplies everything from scratch. Email is
captured locally (nothing is sent), so the password-reset link is readable at
<http://127.0.0.1:54324>.

**Against a hosted project — one paste.** `supabase/setup.sql` is every
migration and the seed concatenated in order. Open the Supabase dashboard →
**SQL Editor** → **New query**, paste the whole file, and run it. It ends by
printing the plan catalogue and a count of tables, policies, functions and the
image bucket, so a successful run is visible rather than assumed.

It is safe to run again: tables use `IF NOT EXISTS`, every policy is dropped
before it is recreated, and the plan rows upsert on their code. The file is
generated — after editing anything under `migrations/` or `seed.sql`, run
`supabase/build-setup.sh` and commit the result.

**Or apply the pieces individually**, in this order:

```
supabase/migrations/0001_init.sql         core schema, enums, RLS policies
supabase/migrations/0002_storage.sql      menu-images bucket + path-scoped policies
supabase/migrations/0003_analytics.sql    QR resolution, view tracking, reporting
supabase/migrations/0004_admin.sql        super-admin RPCs + audit log
supabase/migrations/0005_plan_limits.sql  plan quota enforcement
supabase/migrations/0006_team.sql         add a teammate by email
supabase/migrations/0007_grants.sql       least-privilege table grants
supabase/migrations/0008_ordering.sql     guest ordering + live order status
supabase/migrations/0009_order_numbers.sql per-venue daily order numbers
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
| `npm run e2e` | Full end-to-end run in a real browser (see below) |

## Tests

### End-to-end

`e2e/flow.mjs` drives a real browser through the whole product against a
running stack, asserting against the database rather than against what the UI
claims: register, log in, create a venue, build a menu, upload an image, open
the public menu, scan a table QR, read the analytics that scan produced, reset
a password through the emailed link, and exercise the admin surface and the
demo venue.

```bash
supabase start
npm run dev
npm run e2e            # 71 checks; exits non-zero on the first failure
```

It needs a Chromium build; point `E2E_CHROME` at one if Playwright's default
lookup doesn't find yours. `E2E_BASE` targets a different origin (for example a
`next start` build on another port), and screenshots land in `/tmp/menuqr-e2e`.

### Against a hosted project

`e2e/flow.mjs` asserts through `docker exec psql` and reads confirmation mail
out of the local Inbucket, so it needs the local stack. To check a hosted
project instead, `e2e/hosted-api-check.mjs` performs the operations the
application performs — the same inserts, the same RPCs, the same storage paths
— as the real `authenticated` and `anon` roles over HTTPS, and asserts on what
comes back: the bootstrap triggers, plan assignment, menu content, image upload
and public serving, QR generation and resolution, view and interaction
tracking, the scan counter, and the boundaries `anon` must not cross.

```bash
E2E_EMAIL=you@example.com E2E_PASSWORD=... node e2e/hosted-api-check.mjs
```

It reads the project from `.env.local` and needs an already-confirmed account
(a hosted project mails its confirmation link to a real inbox). It leaves the
venue it creates in place so you can look at it, and it is a check of the
backend contract rather than of the interface — the interface is what
`flow.mjs` covers.

### Authorization

The authorization model is verified against a real Postgres instance, driving
the database as the actual `anon` and `authenticated` roles rather than as the
table owner. Roughly seventy-five assertions — two of them sweeping every table in the
schema — cover tenant isolation, role boundaries, plan quotas, privilege
escalation, anonymous tracking, ordering (including forged prices and
cross-tenant products), admin gating, table grants and storage path scoping.

```bash
PGHOST=/tmp PGPORT=5432 PGUSER=postgres ./supabase/tests/run.sh
```

`MENUQR_TEST_SETUP=1` runs the same suite against the generated
`supabase/setup.sql` instead of the migrations it is built from. Both must
behave identically, so this catches a migration edited without regenerating the
setup file.

It creates its own scratch database (`menuqr_test`), applies the migrations and
seed, and exits non-zero on the first failed expectation. It never touches your
Supabase project. `supabase/tests/00_bootstrap.sql` stands in for the parts of a
Supabase project the schema depends on (`auth.users`, `auth.uid()`, storage
tables, and the permissive default privileges a real project ships with) so the
suite runs on plain Postgres.

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
/dashboard/orders         Live orders from the phone
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

## Ordering

Off by default, and switched on per venue under **Settings → Menu** (the basket
has to be on too — a venue cannot take orders through a list its guests were
never shown).

An order is written by one `SECURITY DEFINER` function, because a guest is
`anon` and `anon` holds no write on `orders` at all. That function is where the
rules live: the venue must be published and accepting orders, the table and
every product must belong to it, a sold-out dish is refused rather than quietly
dropped, and **prices are read from the menu**, so a forged payload cannot buy a
40 DT dish for one. A session is capped at ten orders an hour, which is more
than a table needs and less than a flood.

Each order gets a small number, counted per venue and restarted daily, so the
room talks in "order 12" rather than in identifiers. It is assigned inside
`place_order` under a transaction advisory lock keyed on the venue, because two
phones tapping send at the same moment is precisely when a read-then-insert
would hand out the same number twice. The guest sees it on a receipt that also
carries the table, the lines, the total and a trail showing how far the kitchen
has got; the venue's screen shows the same number beside the order.

The venue's screen takes orders over Supabase Realtime with an opt-in chime,
and re-reads on a timer regardless. That second path is the point: a café's
wifi drops, a socket dies without saying so, and a screen that trusted the
socket would stop showing orders with nothing to indicate it. Staff move an
order along through `set_order_status`, which re-checks membership — they hold
no `UPDATE` on the table itself.

Payment is not part of this. An order tells the kitchen what a table wants; the
bill is settled the way it already was.

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

Those three are the whole list — there is no service-role key to configure.
The image allow-list and the Content-Security-Policy are derived from
`NEXT_PUBLIC_SUPABASE_URL` at build time, so a self-hosted Supabase on a custom
domain (or a local stack) works without editing `next.config.mjs`. Because they
are baked in at build time, changing that variable means rebuilding.

1. Create a production Supabase project and run `supabase/setup.sql` in the
   SQL Editor.
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
