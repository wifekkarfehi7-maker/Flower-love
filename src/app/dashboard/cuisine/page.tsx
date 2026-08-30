import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderStatus, Tenant } from "@/lib/supabase/types";
import CommandesLive from "./CommandesLive";
import { changerStatut } from "./actions";

type LigneCommande = {
  quantite: number;
  prix_unitaire: number;
  menu_items: { nom: string } | null;
};

type CommandeComplete = Order & {
  tables: { numero: string } | null;
  order_items: LigneCommande[];
};

const LIBELLE: Record<OrderStatus, string> = {
  en_attente: "En attente",
  "en_préparation": "En préparation",
  servi: "Servie",
};

function heure(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function PageCuisine() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<Tenant>();

  if (!tenant) redirect("/dashboard");

  const { data: commandes } = await supabase
    .from("orders")
    .select("*, tables(numero), order_items(quantite, prix_unitaire, menu_items(nom))")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: true })
    .returns<CommandeComplete[]>();

  const actives = (commandes ?? []).filter((c) => c.statut !== "servi");
  const servies = (commandes ?? [])
    .filter((c) => c.statut === "servi")
    .slice(-6)
    .reverse();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl text-navy">Cuisine</h1>
          <p className="mt-1 text-navy/70">
            {actives.length === 0
              ? "Aucune commande en cours."
              : `${actives.length} commande${actives.length > 1 ? "s" : ""} en cours.`}
          </p>
        </div>
        <CommandesLive tenantId={tenant.id} />
      </div>

      <ul className="grid gap-4 sm:grid-cols-2">
        {actives.map((commande) => (
          <li
            key={commande.id}
            className={`flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-sm ${
              commande.statut === "en_attente"
                ? "border-s-4 border-coral"
                : "border-s-4 border-gold"
            }`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-serif text-xl text-navy">
                Table {commande.tables?.numero ?? "?"}
              </h2>
              <span className="text-sm text-navy/60">
                {heure(commande.created_at)}
              </span>
            </div>

            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                commande.statut === "en_attente"
                  ? "bg-coral/15 text-coral"
                  : "bg-gold/20 text-gold"
              }`}
            >
              {LIBELLE[commande.statut]}
            </span>

            <ul className="flex flex-col gap-1 border-t border-navy/10 pt-3">
              {commande.order_items.map((ligne, i) => (
                <li key={i} className="flex justify-between gap-3 text-navy">
                  <span>
                    <span className="font-medium">{ligne.quantite} ×</span>{" "}
                    {ligne.menu_items?.nom ?? "—"}
                  </span>
                  <span className="whitespace-nowrap text-navy/60">
                    {(ligne.quantite * Number(ligne.prix_unitaire)).toFixed(2)} DT
                  </span>
                </li>
              ))}
            </ul>

            <p className="flex justify-between border-t border-navy/10 pt-3 font-medium text-navy">
              <span>Total</span>
              <span>{Number(commande.total).toFixed(2)} DT</span>
            </p>

            <div className="flex flex-wrap gap-2">
              {commande.statut === "en_attente" && (
                <form action={changerStatut}>
                  <input type="hidden" name="order_id" value={commande.id} />
                  <input type="hidden" name="statut" value="en_préparation" />
                  <button
                    type="submit"
                    className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                  >
                    Commencer
                  </button>
                </form>
              )}
              <form action={changerStatut}>
                <input type="hidden" name="order_id" value={commande.id} />
                <input type="hidden" name="statut" value="servi" />
                <button
                  type="submit"
                  className="rounded-full bg-coral px-4 py-2 text-sm font-medium text-white transition hover:brightness-105"
                >
                  Servie
                </button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      {servies.length > 0 && (
        <section className="mt-2">
          <h2 className="font-serif text-lg text-navy/70">
            Dernières commandes servies
          </h2>
          <ul className="mt-3 flex flex-col divide-y divide-navy/10 rounded-2xl bg-white px-5 shadow-sm">
            {servies.map((commande) => (
              <li
                key={commande.id}
                className="flex items-center justify-between gap-3 py-3 text-sm text-navy/70"
              >
                <span>Table {commande.tables?.numero ?? "?"}</span>
                <span>{heure(commande.created_at)}</span>
                <span>{Number(commande.total).toFixed(2)} DT</span>
                <form action={changerStatut}>
                  <input type="hidden" name="order_id" value={commande.id} />
                  <input type="hidden" name="statut" value="en_attente" />
                  <button
                    type="submit"
                    className="text-coral hover:underline"
                    title="Remettre la commande en cours"
                  >
                    Rouvrir
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
