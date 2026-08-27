import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TemplateFonts, TemplateRecord, TemplateTheme } from "@/types/invitation";
import type { TemplateRow } from "@/types/database";
import { STATIC_TEMPLATES } from "./static-templates";

function mapRow(row: TemplateRow): TemplateRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    nameAr: row.name_ar,
    category: row.category,
    description: row.description,
    status: row.status,
    sortOrder: row.sort_order,
    theme: row.theme as unknown as TemplateTheme,
    fonts: row.fonts as unknown as TemplateFonts,
  };
}

/** All active templates, sorted for display. Falls back to static data if Supabase isn't configured. */
export async function getActiveTemplates(): Promise<TemplateRecord[]> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [...STATIC_TEMPLATES].sort((a, b) => a.sortOrder - b.sortOrder);

  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("status", "active")
    .order("sort_order", { ascending: true });

  if (error || !data || data.length === 0) {
    return [...STATIC_TEMPLATES].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return data.map(mapRow);
}

/** A single active template by slug, falling back to static data. */
export async function getTemplateBySlug(slug: string): Promise<TemplateRecord | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return STATIC_TEMPLATES.find((t) => t.slug === slug) ?? null;

  const { data, error } = await supabase.from("templates").select("*").eq("slug", slug).eq("status", "active").single();

  if (error || !data) {
    return STATIC_TEMPLATES.find((t) => t.slug === slug) ?? null;
  }

  return mapRow(data);
}

/** A single template by id (any status — used when rendering a specific invitation's chosen template). */
export async function getTemplateById(id: string): Promise<TemplateRecord | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return STATIC_TEMPLATES.find((t) => t.id === id) ?? null;

  const { data, error } = await supabase.from("templates").select("*").eq("id", id).single();

  if (error || !data) {
    return STATIC_TEMPLATES.find((t) => t.id === id) ?? null;
  }

  return mapRow(data);
}
