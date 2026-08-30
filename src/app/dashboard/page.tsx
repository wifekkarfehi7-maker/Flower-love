import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tenant } from "@/lib/supabase/types";
import { createTenant } from "./actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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
    return (
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-serif text-3xl text-navy">
          Créez votre établissement
        </h1>
        <p className="mt-2 text-navy/70">
          Ces informations pourront être modifiées plus tard.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-coral/10 px-3 py-2 text-sm text-coral">
            {error}
          </p>
        )}

        <form action={createTenant} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm text-navy">
            Nom de l&apos;établissement
            <input
              type="text"
              name="nom"
              required
              placeholder="Café Skanini"
              className="rounded-lg border border-navy/20 px-3 py-2 outline-none focus:border-navy"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-navy">
            Langue par défaut
            <select
              name="langue_defaut"
              defaultValue="fr"
              className="rounded-lg border border-navy/20 px-3 py-2 outline-none focus:border-navy"
            >
              <option value="fr">Français</option>
              <option value="ar">Arabe</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm text-navy">
            Mode de paiement
            <select
              name="mode_paiement"
              defaultValue="cash"
              className="rounded-lg border border-navy/20 px-3 py-2 outline-none focus:border-navy"
            >
              <option value="cash">Cash / carte à table</option>
              <option value="online" disabled>
                Paiement en ligne (bientôt)
              </option>
            </select>
          </label>

          <button
            type="submit"
            className="mt-2 rounded-full bg-coral px-4 py-2 font-medium text-white transition hover:brightness-105"
          >
            Créer l&apos;établissement
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-serif text-3xl text-navy">{tenant.nom}</h1>
      <p className="mt-2 text-navy/70">
        Mode de paiement : {tenant.mode_paiement === "cash" ? "Cash / carte à table" : "En ligne"}
        {" · "}Langue par défaut : {tenant.langue_defaut === "fr" ? "Français" : "Arabe"}
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/dashboard/cuisine"
          className="rounded-full bg-gold px-6 py-3 font-medium text-white transition hover:brightness-105"
        >
          Vue cuisine
        </Link>
        <Link
          href="/dashboard/menu"
          className="rounded-full bg-coral px-6 py-3 font-medium text-white transition hover:brightness-105"
        >
          Gérer le menu
        </Link>
        <Link
          href="/dashboard/tables"
          className="rounded-full bg-navy px-6 py-3 font-medium text-white transition hover:brightness-110"
        >
          Tables &amp; QR codes
        </Link>
      </div>
    </div>
  );
}
