import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Category, MenuItem, Tenant } from "@/lib/supabase/types";
import {
  createCategory,
  createMenuItem,
  deleteCategory,
  deleteMenuItem,
  toggleDisponible,
} from "./actions";

type CategoryWithItems = Category & { menu_items: MenuItem[] };

export default async function MenuPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle<Tenant>();

  if (!tenant) {
    redirect("/dashboard");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("*, menu_items(*)")
    .eq("tenant_id", tenant.id)
    .order("ordre", { ascending: true })
    .returns<CategoryWithItems[]>();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
      <div>
        <h1 className="font-serif text-3xl text-navy">Menu — {tenant.nom}</h1>
        <p className="mt-2 text-navy/70">
          Ajoutez des catégories et des plats. Une rupture se marque en
          décochant &laquo; disponible &raquo;.
        </p>
      </div>

      <form
        action={createCategory}
        className="flex items-end gap-3 rounded-2xl bg-white p-4 shadow-sm"
      >
        <label className="flex flex-1 flex-col gap-1 text-sm text-navy">
          Nouvelle catégorie
          <input
            type="text"
            name="nom"
            required
            placeholder="Entrées"
            className="rounded-lg border border-navy/20 px-3 py-2 outline-none focus:border-navy"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-navy px-5 py-2 font-medium text-white transition hover:brightness-110"
        >
          Ajouter
        </button>
      </form>

      {categories?.length === 0 && (
        <p className="text-navy/60">Aucune catégorie pour l&apos;instant.</p>
      )}

      {categories?.map((category) => (
        <section key={category.id} className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
            <h2 className="font-serif text-xl text-navy">{category.nom}</h2>
            <form action={deleteCategory}>
              <input type="hidden" name="category_id" value={category.id} />
              <button
                type="submit"
                className="whitespace-nowrap text-sm text-coral hover:underline"
              >
                Supprimer la catégorie
              </button>
            </form>
          </div>

          <ul className="mt-4 flex flex-col divide-y divide-navy/10">
            {category.menu_items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-baseline gap-x-2 font-medium text-navy">
                    <span>{item.nom}</span>
                    <span className="whitespace-nowrap font-normal text-navy/60">
                      {item.prix.toFixed(2)} DT
                    </span>
                  </p>
                  {item.description && (
                    <p className="text-sm text-navy/60">{item.description}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <form action={toggleDisponible}>
                    <input type="hidden" name="item_id" value={item.id} />
                    <input
                      type="hidden"
                      name="disponible"
                      value={String(item.disponible)}
                    />
                    <button
                      type="submit"
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.disponible
                          ? "bg-gold/20 text-gold"
                          : "bg-navy/10 text-navy/50"
                      }`}
                    >
                      {item.disponible ? "Disponible" : "Rupture"}
                    </button>
                  </form>
                  <form action={deleteMenuItem}>
                    <input type="hidden" name="item_id" value={item.id} />
                    <button
                      type="submit"
                      className="text-sm text-coral hover:underline"
                    >
                      Supprimer
                    </button>
                  </form>
                </div>
              </li>
            ))}
            {category.menu_items.length === 0 && (
              <li className="py-3 text-sm text-navy/50">Aucun plat.</li>
            )}
          </ul>

          <form
            action={createMenuItem}
            className="mt-4 flex flex-wrap items-end gap-3 border-t border-navy/10 pt-4"
          >
            <input type="hidden" name="category_id" value={category.id} />
            <label className="flex flex-col gap-1 text-sm text-navy">
              Nom du plat
              <input
                type="text"
                name="nom"
                required
                className="rounded-lg border border-navy/20 px-3 py-2 outline-none focus:border-navy"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-navy">
              Description
              <input
                type="text"
                name="description"
                className="rounded-lg border border-navy/20 px-3 py-2 outline-none focus:border-navy"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-navy">
              Prix (DT)
              <input
                type="number"
                name="prix"
                required
                min="0"
                step="0.01"
                className="w-28 rounded-lg border border-navy/20 px-3 py-2 outline-none focus:border-navy"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-coral px-5 py-2 font-medium text-white transition hover:brightness-105"
            >
              Ajouter le plat
            </button>
          </form>
        </section>
      ))}
    </div>
  );
}
