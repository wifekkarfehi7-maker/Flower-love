# Skanini

Plateforme web multi-établissements : chaque restaurant/café a son propre
menu digital et son propre système de commande, accessible par un QR code
posé sur chaque table — sans application à télécharger.

Ce projet est initialisé avec Next.js (App Router) + Supabase (base de
données PostgreSQL, authentification). Voir le cahier des charges pour le
contexte produit complet.

## État actuel (Phase 1 — étape 1)

- Modèle de données (section 5 du cahier des charges) : `supabase/migrations/0001_init.sql`
- Back-office gérant :
  - création de compte (`/signup`) et connexion (`/login`)
  - création de l'établissement (`/dashboard`)
  - gestion du menu : catégories et plats, prix, description, disponibilité
    / rupture (`/dashboard/menu`)

Reste à construire (prochaines étapes) : page client par table (QR code),
vue cuisine/caisse en temps réel, génération des QR codes, paiement en
ligne, interface arabe.

## Configuration

Deux options : un Supabase local (rien à créer, tout tourne sur la
machine — pratique pour développer) ou un projet Supabase hébergé
(nécessaire pour déployer).

### Option A — Supabase local (Docker requis)

```bash
npm install
npx supabase start          # démarre Postgres + Auth + API, applique les migrations
```

La commande affiche `API_URL` et `ANON_KEY` : les reporter dans
`.env.local` (voir `.env.local.example`). Les migrations de
`supabase/migrations/` sont appliquées automatiquement au démarrage.
`npx supabase stop` arrête le tout.

### Option B — projet Supabase hébergé

1. Créer un projet sur [Supabase](https://supabase.com).
2. Copier `.env.local.example` vers `.env.local` et renseigner :

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

   (Project Settings → API dans le tableau de bord Supabase.)

3. Appliquer la migration `supabase/migrations/0001_init.sql` sur le projet
   Supabase — soit en collant son contenu dans l'éditeur SQL du tableau de
   bord, soit via la Supabase CLI :

   ```bash
   supabase link --project-ref <ref-du-projet>
   supabase db push
   ```

## Développement

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Identité visuelle

- Couleurs : Navy `#2F3C7E`, Coral `#F96167`, Gold `#E8B23A`, fond crème `#FAF6ED`
- Typographies : Fraunces (titres) / Inter (texte courant)

Ces tokens sont définis dans `src/app/globals.css` et exposés comme
utilitaires Tailwind (`bg-navy`, `text-coral`, `font-serif`, etc.).
