"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export type PanierLigne = { menu_item_id: string; quantite: number };

export type ResultatCommande =
  | { ok: true; orderId: string; total: number }
  | { ok: false; erreur: "panier_vide" | "indisponible" | "introuvable" | "serveur" };

const MAX_LIGNES = 50;
const MAX_QUANTITE = 99;

export async function envoyerCommande(
  slug: string,
  numeroTable: string,
  panier: PanierLigne[],
): Promise<ResultatCommande> {
  // On ne fait confiance qu'aux identifiants et aux quantités : les prix,
  // la disponibilité et l'appartenance à l'établissement sont relus en base.
  const lignes = panier
    .filter((l) => Number.isInteger(l.quantite) && l.quantite > 0)
    .map((l) => ({
      menu_item_id: String(l.menu_item_id),
      quantite: Math.min(l.quantite, MAX_QUANTITE),
    }))
    .slice(0, MAX_LIGNES);

  if (lignes.length === 0) {
    return { ok: false, erreur: "panier_vide" };
  }

  const supabase = createAdminClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id, mode_paiement")
    .eq("slug", slug)
    .maybeSingle();

  if (!tenant) {
    return { ok: false, erreur: "introuvable" };
  }

  const { data: table } = await supabase
    .from("tables")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("numero", numeroTable)
    .maybeSingle();

  if (!table) {
    return { ok: false, erreur: "introuvable" };
  }

  // Les plats doivent appartenir à ce tenant et être disponibles.
  const { data: plats } = await supabase
    .from("menu_items")
    .select("id, prix, disponible, categories!inner(tenant_id)")
    .in(
      "id",
      lignes.map((l) => l.menu_item_id),
    )
    .eq("categories.tenant_id", tenant.id)
    .returns<{ id: string; prix: number; disponible: boolean }[]>();

  if (!plats || plats.length !== lignes.length) {
    return { ok: false, erreur: "introuvable" };
  }

  if (plats.some((p) => !p.disponible)) {
    return { ok: false, erreur: "indisponible" };
  }

  const prixParId = new Map(plats.map((p) => [p.id, Number(p.prix)]));
  const total = lignes.reduce(
    (somme, l) => somme + prixParId.get(l.menu_item_id)! * l.quantite,
    0,
  );

  const { data: commande, error: erreurCommande } = await supabase
    .from("orders")
    .insert({
      tenant_id: tenant.id,
      table_id: table.id,
      mode_paiement: tenant.mode_paiement,
      total: total.toFixed(2),
    })
    .select("id")
    .single();

  if (erreurCommande || !commande) {
    return { ok: false, erreur: "serveur" };
  }

  const { error: erreurLignes } = await supabase.from("order_items").insert(
    lignes.map((l) => ({
      order_id: commande.id,
      menu_item_id: l.menu_item_id,
      quantite: l.quantite,
      prix_unitaire: prixParId.get(l.menu_item_id)!.toFixed(2),
    })),
  );

  if (erreurLignes) {
    // Pas de commande à moitié enregistrée en cuisine.
    await supabase.from("orders").delete().eq("id", commande.id);
    return { ok: false, erreur: "serveur" };
  }

  return { ok: true, orderId: commande.id, total };
}
