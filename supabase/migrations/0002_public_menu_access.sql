-- Skanini — accès public au menu (parcours client par QR code)
--
-- Le client attablé n'a aucun compte : il scanne le QR de sa table et doit
-- pouvoir lire le menu de l'établissement. On ouvre donc la lecture — et
-- uniquement la lecture — sur les tables qui composent un menu public.
--
-- Ce qui reste fermé : orders et order_items. Une commande ne doit jamais
-- être lisible par un autre client, ni insérée directement depuis le
-- navigateur (les prix et le total seraient à la merci du client). Les
-- commandes sont créées côté serveur, avec la clé service_role, après
-- validation des prix en base — voir src/app/[etablissement]/actions.ts.

create policy "tenants: lecture publique"
  on tenants for select
  using (true);

create policy "tables: lecture publique"
  on tables for select
  using (true);

create policy "categories: lecture publique"
  on categories for select
  using (true);

create policy "menu_items: lecture publique"
  on menu_items for select
  using (true);
