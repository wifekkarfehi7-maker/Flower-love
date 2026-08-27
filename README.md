# Flower & Love 🌸

Premium digital wedding invitations for the Tunisian & Arabic-speaking market — built with Next.js (App Router) and Supabase (Postgres + Auth + Storage). Arabic (including Tunisian Darija) is the default, first-class language; French and English are also supported. Payment is coordinated manually over WhatsApp — there is no online payment gateway.

## Tech stack

- **Next.js 14** (App Router, TypeScript, strict mode)
- **Tailwind CSS**
- **Supabase**: Postgres, Auth, Storage — Row Level Security is the app's primary authorization layer. Almost every write goes straight from a client component to Supabase under the signed-in user's own session and is enforced by RLS policies, not by a separate server-actions/API layer. See `supabase/migrations/` for the full policy set.
- No online payment processor — orders are coordinated over WhatsApp (`NEXT_PUBLIC_BUSINESS_WHATSAPP`).

## Prerequisites

- Node.js 18.18+ (or 20+)
- A [Supabase](https://supabase.com) project (free tier is enough to start)

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project's API settings. Without these, the app still runs — every page and form falls back to a friendly "not configured" state instead of crashing — but nothing is persisted.

3. **Set up the database**

   Run the migrations in order against your Supabase project (SQL Editor, or the Supabase CLI), then the seed file:

   ```
   supabase/migrations/0001_init.sql          -- core schema, enums, RLS policies
   supabase/migrations/0002_storage.sql        -- gallery/music storage buckets + policies
   supabase/migrations/0003_view_tracking.sql  -- anonymous view-count RPC
   supabase/migrations/0004_admin_audit.sql    -- admin audit-log RPC
   supabase/migrations/0005_rsvp_hardening.sql -- RSVP input constraints
   supabase/seed.sql                           -- 8 templates + 3 pricing plans
   ```

   Using the Supabase CLI, this is just:

   ```bash
   supabase db push   # applies supabase/migrations/*.sql in order
   psql "$DATABASE_URL" -f supabase/seed.sql
   ```

4. **Create the first admin**

   New accounts are always created with `role = 'customer'`. There's no UI to become the *first* admin (an admin can only be promoted by an existing admin, from `/admin/users`) — sign up normally through the app once, then run this one-time bootstrap query in the Supabase SQL Editor:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

   From then on, `/admin` is reachable from that account (also linked from the header's account menu), and further admins can be promoted from `/admin/users`.

5. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build (run `build` first) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Deployment

The app is a standard Next.js App Router project — deploy it to [Vercel](https://vercel.com) (recommended, zero config) or any Node.js host that supports Next.js.

**Required environment variables in production:**

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your production Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your production Supabase anon/public key |
| `NEXT_PUBLIC_BUSINESS_WHATSAPP` | Digits only, with country code, no `+` — e.g. `21694409166` |
| `NEXT_PUBLIC_SITE_URL` | Your production domain, no trailing slash — used for share links, the sitemap, and Open Graph metadata |

Steps:

1. Create a production Supabase project and run the setup in [Local setup](#local-setup) steps 3–4 against it.
2. Set up Storage buckets — `0002_storage.sql` creates the `gallery` and `music` buckets and their RLS policies as part of the migration; no manual bucket creation needed.
3. Deploy this repository (e.g. `vercel --prod`, or connect the repo in the Vercel dashboard) with the environment variables above set.
4. Point your domain's DNS at the host, then update `NEXT_PUBLIC_SITE_URL` to match.
5. Bootstrap your first admin account (step 4 above) against the production database.

Security headers (CSP, HSTS, etc. — see `next.config.mjs`) and `robots.txt`/`sitemap.xml` (see `src/app/robots.ts` / `src/app/sitemap.ts`) are already wired up and need no extra configuration on the host.

## Project structure

```
src/app/                    Routes (App Router)
  (site)/                   Marketing + dashboard pages, shared header/footer chrome
  admin/                    Admin dashboard (own sidebar shell, admin-only)
  invitations/[id]/builder  Wedding builder (full-bleed, own design system)
  invitations/[id]/preview  Owner's live preview of their invitation
  invite/[slug]             Public invitation page (what guests see)
src/components/             UI components, grouped by feature area
src/lib/                    Data-access layers, one folder per domain
  supabase/                 Client/server/middleware Supabase factories
  admin/, invitations/, orders/, pricing/, templates/, guests/, auth/, i18n/
src/types/                  Hand-written types mirroring the DB schema + app-level types
supabase/migrations/        SQL migrations, applied in numeric order
supabase/seed.sql           Template catalogue + pricing plans
```

## License

Private, unpublished project. All rights reserved.
