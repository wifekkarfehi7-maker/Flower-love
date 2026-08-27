"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { logAdminAction } from "./log-action";
import type { TemplateStatus } from "@/types/database";

export type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string };
function ok<T>(data: T): ActionResult<T> {
  return { data, error: null };
}
function fail<T>(error: string): ActionResult<T> {
  return { data: null, error };
}
const NOT_CONFIGURED = "not_configured";

export type TemplateAdminPatch = {
  name?: string;
  nameAr?: string;
  description?: string | null;
  status?: TemplateStatus;
  sortOrder?: number;
};

export async function updateTemplate(id: string, patch: TemplateAdminPatch): Promise<ActionResult<null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const { error } = await supabase
    .from("templates")
    .update({
      ...(patch.name !== undefined && { name: patch.name }),
      ...(patch.nameAr !== undefined && { name_ar: patch.nameAr }),
      ...(patch.description !== undefined && { description: patch.description }),
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.sortOrder !== undefined && { sort_order: patch.sortOrder }),
    })
    .eq("id", id);
  if (error) return fail(error.message);

  await logAdminAction(supabase, "update_template", "template", id, null, patch.status ?? null, patch);
  return ok(null);
}
