"use client";

import { useMemo, useState, useTransition } from "react";
import { envoyerCommande, type ResultatCommande } from "@/app/[etablissement]/actions";
import { traductions, type Langue } from "@/lib/i18n";
import type { Category, MenuItem } from "@/lib/supabase/types";

type CategorieAvecPlats = Category & { menu_items: MenuItem[] };

export default function MenuClient({
  categories,
  slug,
  numeroTable,
  langue,
}: {
  categories: CategorieAvecPlats[];
  slug: string;
  numeroTable: string;
  langue: Langue;
}) {
  const t = traductions(langue);
  const [panier, setPanier] = useState<Record<string, number>>({});
  const [envoi, demarrerEnvoi] = useTransition();
  const [resultat, setResultat] = useState<ResultatCommande | null>(null);

  const platsParId = useMemo(() => {
    const index = new Map<string, MenuItem>();
    for (const categorie of categories) {
      for (const plat of categorie.menu_items) index.set(plat.id, plat);
    }
    return index;
  }, [categories]);

  const lignes = Object.entries(panier).filter(([, q]) => q > 0);
  const total = lignes.reduce(
    (somme, [id, q]) => somme + Number(platsParId.get(id)?.prix ?? 0) * q,
    0,
  );

  const modifier = (id: string, delta: number) =>
    setPanier((p) => {
      const quantite = Math.max(0, (p[id] ?? 0) + delta);
      const suivant = { ...p, [id]: quantite };
      if (quantite === 0) delete suivant[id];
      return suivant;
    });

  const messageErreur = (r: ResultatCommande) =>
    r.ok
      ? null
      : {
          panier_vide: t.erreurPanierVide,
          indisponible: t.erreurIndisponible,
          introuvable: t.erreurIntrouvable,
          serveur: t.erreurServeur,
        }[r.erreur];

  const envoyer = () =>
    demarrerEnvoi(async () => {
      const r = await envoyerCommande(
        slug,
        numeroTable,
        lignes.map(([menu_item_id, quantite]) => ({ menu_item_id, quantite })),
      );
      setResultat(r);
      if (r.ok) setPanier({});
    });

  if (resultat?.ok) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-gold/20 text-3xl">
          ✓
        </div>
        <h2 className="font-serif text-2xl text-navy">{t.commandeEnvoyee}</h2>
        <p className="text-navy/70">{t.commandeEnCuisine}</p>
        <p className="text-navy/70">
          {t.total} : {resultat.total.toFixed(2)} {t.devise}
        </p>
        <p className="max-w-xs text-sm text-navy/60">{t.paiementCash}</p>
        <button
          type="button"
          onClick={() => setResultat(null)}
          className="mt-4 rounded-full bg-coral px-6 py-3 font-medium text-white"
        >
          {t.nouvelleCommande}
        </button>
      </div>
    );
  }

  const erreur = resultat ? messageErreur(resultat) : null;

  return (
    <>
      <div className="flex-1 px-5 pb-56 pt-6">
        {categories.map((categorie) => (
          <section key={categorie.id} className="mb-8">
            <h2 className="font-serif text-xl text-navy">{categorie.nom}</h2>
            <ul className="mt-3 flex flex-col divide-y divide-navy/10">
              {categorie.menu_items.map((plat) => {
                const quantite = panier[plat.id] ?? 0;
                return (
                  <li key={plat.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-navy">{plat.nom}</p>
                      {plat.description && (
                        <p className="text-sm text-navy/60">{plat.description}</p>
                      )}
                      <p className="mt-0.5 text-sm text-navy/80">
                        {Number(plat.prix).toFixed(2)} {t.devise}
                      </p>
                    </div>

                    {!plat.disponible ? (
                      <span className="shrink-0 rounded-full bg-navy/10 px-3 py-1 text-xs text-navy/50">
                        {t.indisponible}
                      </span>
                    ) : quantite === 0 ? (
                      <button
                        type="button"
                        onClick={() => modifier(plat.id, 1)}
                        className="shrink-0 rounded-full bg-coral px-4 py-2 text-sm font-medium text-white"
                      >
                        {t.ajouter}
                      </button>
                    ) : (
                      <div className="flex shrink-0 items-center gap-3">
                        <button
                          type="button"
                          aria-label={t.retirer}
                          onClick={() => modifier(plat.id, -1)}
                          className="size-9 rounded-full bg-navy/10 text-lg text-navy"
                        >
                          −
                        </button>
                        <span className="w-5 text-center font-medium text-navy">
                          {quantite}
                        </span>
                        <button
                          type="button"
                          aria-label={t.ajouter}
                          onClick={() => modifier(plat.id, 1)}
                          className="size-9 rounded-full bg-coral text-lg text-white"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-navy/10 bg-white px-5 pb-6 pt-4 shadow-[0_-4px_16px_rgba(47,60,126,0.08)]">
        {erreur && (
          <p className="mb-3 rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">
            {erreur}
          </p>
        )}
        <div className="mb-3 flex items-baseline justify-between">
          <span className="font-medium text-navy">{t.votreCommande}</span>
          <span className="font-serif text-xl text-navy">
            {total.toFixed(2)} {t.devise}
          </span>
        </div>
        <button
          type="button"
          onClick={envoyer}
          disabled={lignes.length === 0 || envoi}
          className="w-full rounded-full bg-coral py-3 font-medium text-white transition disabled:bg-navy/20 disabled:text-navy/50"
        >
          {envoi ? t.envoiEnCours : t.envoyer}
        </button>
        <p className="mt-2 text-center text-xs text-navy/50">{t.paiementCash}</p>
      </div>
    </>
  );
}
