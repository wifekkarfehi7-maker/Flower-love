"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/supabase/types";

const STATUTS: OrderStatus[] = ["en_attente", "en_préparation", "servi"];

export async function changerStatut(formData: FormData) {
  const orderId = String(formData.get("order_id") ?? "");
  const statut = String(formData.get("statut") ?? "") as OrderStatus;

  if (!orderId || !STATUTS.includes(statut)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Le RLS limite déjà la mise à jour aux commandes de l'établissement du
  // gérant connecté : inutile de refiltrer sur tenant_id ici.
  await supabase.from("orders").update({ statut }).eq("id", orderId);

  revalidatePath("/dashboard/cuisine");
}
