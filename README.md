# Skanini

Plateforme web multi-établissements : chaque restaurant/café a son propre
menu digital et son propre système de commande, accessible par un QR code
posé sur chaque table — sans application à télécharger.

Ce projet est initialisé avec Next.js (App Router) + Supabase (base de
données PostgreSQL, authentification). Voir le cahier des charges pour le
contexte produit complet.

## État actuel (Phase 1)

Modèle de données (section 5 du cahier des charges) :
`supabase/migrations/`.

**Back-office gérant**

- création de compte (`/signup`) et connexion (`/login`)
- création de l'établissement (`/dashboard`)
- menu : catégories et plats, prix, description, disponibilité / rupture
  (`/dashboard/menu`)
- tables et QR codes, un QR par table (`/dashboard/tables`)

**Parcours client** (`/[etablissement]/table/[numero]`)

- aucun compte requis : le client scanne le QR de sa table
- menu de l'établissement, plats en rupture affichés mais non commandables
- panier avec quantités et total, envoi de la commande
- interface en français et en arabe (avec RTL), selon la langue par défaut
  de l'établissement

Reste à construire : vue cuisine/caisse temps réel, paiement en ligne
(Phase 3), statistiques.

### Sécurité des commandes

Les prix et le total ne sont jamais lus depuis le navigateur. Le client
envoie des identifiants de plats et des quantités ; le serveur relit les
prix en base, vérifie que chaque plat appartient bien à l'établissement et
qu'il est disponible, puis calcule le total
(`src/app/[etablissement]/actions.ts`).

Le RLS interdit toute écriture de commande depuis la clé publique : seul
le serveur, avec `SUPABASE_SERVICE_ROLE_KEY`, enregistre les commandes. Un
client ne peut pas non plus lire les commandes des autres tables.

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
