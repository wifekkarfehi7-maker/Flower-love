import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { estLangue, traductions, directionDe, type Langue } from "@/lib/i18n";
import type { Category, MenuItem, Tenant } from "@/lib/supabase/types";
import MenuClient from "./MenuClient";

type CategorieAvecPlats = Category & { menu_items: MenuItem[] };

export default async function PageTableClient({
  params,
}: {
  params: Promise<{ etablissement: string; numero: string }>;
}) {
  const { etablissement, numero } = await params;
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", etablissement)
    .maybeSingle<Tenant>();

  if (!tenant) notFound();

  const { data: table } = await supabase
    .from("tables")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("numero", numero)
    .maybeSingle();

  if (!table) notFound();

  const { data: categories } = await supabase
    .from("categories")
    .select("*, menu_items(*)")
    .eq("tenant_id", tenant.id)
    .order("ordre", { ascending: true })
    .returns<CategorieAvecPlats[]>();

  const langue: Langue = estLangue(tenant.langue_defaut)
    ? tenant.langue_defaut
    : "fr";
  const t = traductions(langue);

  const categoriesNonVides = (categories ?? []).filter(
    (c) => c.menu_items.length > 0,
  );

  return (
    <div dir={directionDe(langue)} lang={langue} className="flex flex-1 flex-col">
      <header className="border-b border-navy/10 bg-white px-5 py-4">
        <h1 className="font-serif text-2xl text-navy">{tenant.nom}</h1>
        <p className="text-sm text-navy/60">
          {t.table} {numero}
        </p>
      </header>

      {categoriesNonVides.length === 0 ? (
        <p className="px-5 py-10 text-center text-navy/60">{t.menuVide}</p>
      ) : (
        <MenuClient
          categories={categoriesNonVides}
          slug={tenant.slug}
          numeroTable={numero}
          langue={langue}
        />
      )}
    </div>
  );
}
