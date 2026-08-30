"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tenant } from "@/lib/supabase/types";

async function tenantDuGerant() {
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

  return { supabase, tenant };
}

export async function creerTable(formData: FormData) {
  const numero = String(formData.get("numero") ?? "").trim();
  if (!numero) return;

  const { supabase, tenant } = await tenantDuGerant();

  const { error } = await supabase
    .from("tables")
    .insert({ tenant_id: tenant.id, numero });

  if (error) {
    redirect(`/dashboard/tables?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/tables");
}

export async function supprimerTable(formData: FormData) {
  const tableId = String(formData.get("table_id") ?? "");
  if (!tableId) return;

  const { supabase } = await tenantDuGerant();
  const { error } = await supabase.from("tables").delete().eq("id", tableId);

  if (error) {
    redirect(`/dashboard/tables?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/dashboard/tables");
}
