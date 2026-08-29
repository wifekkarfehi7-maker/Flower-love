-- Skanini — schéma initial (Phase 1 MVP)
-- Modèle de données : voir section 5 du cahier des charges.

create extension if not exists "pgcrypto";

create type payment_mode as enum ('cash', 'online');
create type order_status as enum ('en_attente', 'en_préparation', 'servi');

-- Tenant : un établissement (restaurant/café)
create table tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  nom text not null,
  slug text not null unique,
  logo_url text,
  langue_defaut text not null default 'fr',
  mode_paiement payment_mode not null default 'cash',
  created_at timestamptz not null default now()
);

create index tenants_owner_id_idx on tenants (owner_id);

-- Table : une table physique de l'établissement, identifiée par un QR code
create table tables (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  numero text not null,
  qr_code_url text,
  created_at timestamptz not null default now(),
  unique (tenant_id, numero)
);

create index tables_tenant_id_idx on tables (tenant_id);

-- Category : catégorie de menu (ex. Entrées, Boissons)
create table categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  nom text not null,
  ordre integer not null default 0,
  created_at timestamptz not null default now()
);

create index categories_tenant_id_idx on categories (tenant_id);

-- MenuItem : un plat/article du menu
create table menu_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories (id) on delete cascade,
  nom text not null,
  description text,
  prix numeric(10, 2) not null check (prix >= 0),
  disponible boolean not null default true,
  photo_url text,
  created_at timestamptz not null default now()
);

create index menu_items_category_id_idx on menu_items (category_id);

-- Order : une commande passée sur une table
create table orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants (id) on delete cascade,
  table_id uuid not null references tables (id) on delete restrict,
  statut order_status not null default 'en_attente',
  mode_paiement payment_mode not null default 'cash',
  total numeric(10, 2) not null default 0 check (total >= 0),
  created_at timestamptz not null default now()
);

create index orders_tenant_id_idx on orders (tenant_id);
create index orders_table_id_idx on orders (table_id);

-- OrderItem : une ligne de commande (un plat + quantité)
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  menu_item_id uuid not null references menu_items (id) on delete restrict,
  quantite integer not null check (quantite > 0),
  prix_unitaire numeric(10, 2) not null check (prix_unitaire >= 0)
);

create index order_items_order_id_idx on order_items (order_id);

-- Row Level Security : le gérant (owner_id) n'a accès qu'aux données de ses propres établissements.

alter table tenants enable row level security;
alter table tables enable row level security;
alter table categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

create policy "tenants: owner full access"
  on tenants for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "tables: owner full access"
  on tables for all
  using (exists (select 1 from tenants t where t.id = tenant_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from tenants t where t.id = tenant_id and t.owner_id = auth.uid()));

create policy "categories: owner full access"
  on categories for all
  using (exists (select 1 from tenants t where t.id = tenant_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from tenants t where t.id = tenant_id and t.owner_id = auth.uid()));

create policy "menu_items: owner full access"
  on menu_items for all
  using (
    exists (
      select 1 from categories c
      join tenants t on t.id = c.tenant_id
      where c.id = category_id and t.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from categories c
      join tenants t on t.id = c.tenant_id
      where c.id = category_id and t.owner_id = auth.uid()
    )
  );

create policy "orders: owner full access"
  on orders for all
  using (exists (select 1 from tenants t where t.id = tenant_id and t.owner_id = auth.uid()))
  with check (exists (select 1 from tenants t where t.id = tenant_id and t.owner_id = auth.uid()));

create policy "order_items: owner full access"
  on order_items for all
  using (
    exists (
      select 1 from orders o
      join tenants t on t.id = o.tenant_id
      where o.id = order_id and t.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from orders o
      join tenants t on t.id = o.tenant_id
      where o.id = order_id and t.owner_id = auth.uid()
    )
  );
