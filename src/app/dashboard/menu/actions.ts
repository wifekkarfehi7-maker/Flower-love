"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tenant } from "@/lib/supabase/types";

async function requireTenant() {
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

  return { supabase, tenant };
}

export async function createCategory(formData: FormData) {
  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) return;

  const { supabase, tenant } = await requireTenant();

  const { count } = await supabase
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id);

  await supabase.from("categories").insert({
    tenant_id: tenant.id,
    nom,
    ordre: count ?? 0,
  });

  revalidatePath("/dashboard/menu");
}

export async function deleteCategory(formData: FormData) {
  const categoryId = String(formData.get("category_id") ?? "");
  if (!categoryId) return;

  const { supabase } = await requireTenant();
  await supabase.from("categories").delete().eq("id", categoryId);

  revalidatePath("/dashboard/menu");
}

export async function createMenuItem(formData: FormData) {
  const categoryId = String(formData.get("category_id") ?? "");
  const nom = String(formData.get("nom") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const prix = Number(formData.get("prix"));

  if (!categoryId || !nom || Number.isNaN(prix) || prix < 0) return;

  const { supabase } = await requireTenant();

  await supabase.from("menu_items").insert({
    category_id: categoryId,
    nom,
    description: description || null,
    prix,
  });

  revalidatePath("/dashboard/menu");
}

export async function deleteMenuItem(formData: FormData) {
  const itemId = String(formData.get("item_id") ?? "");
  if (!itemId) return;

  const { supabase } = await requireTenant();
  await supabase.from("menu_items").delete().eq("id", itemId);

  revalidatePath("/dashboard/menu");
}

export async function toggleDisponible(formData: FormData) {
  const itemId = String(formData.get("item_id") ?? "");
  const disponible = formData.get("disponible") === "true";
  if (!itemId) return;

  const { supabase } = await requireTenant();
  await supabase
    .from("menu_items")
    .update({ disponible: !disponible })
    .eq("id", itemId);

  revalidatePath("/dashboard/menu");
}
