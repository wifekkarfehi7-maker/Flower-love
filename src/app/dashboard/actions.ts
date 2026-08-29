"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";

export async function createTenant(formData: FormData) {
  const nom = String(formData.get("nom") ?? "").trim();
  const langueDefaut = String(formData.get("langue_defaut") ?? "fr");
  const modePaiement = String(formData.get("mode_paiement") ?? "cash");

  if (!nom) {
    redirect("/dashboard?error=Le nom de l'établissement est requis");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const baseSlug = slugify(nom) || "etablissement";
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;

  const { error } = await supabase.from("tenants").insert({
    owner_id: user.id,
    nom,
    slug,
    langue_defaut: langueDefaut,
    mode_paiement: modePaiement,
  });

  if (error) {
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}
