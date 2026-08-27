import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getTemplateById } from "@/lib/templates/get-templates";
import { toInvitationData } from "./to-invitation-data";
import type { InvitationData, TemplateRecord } from "@/types/invitation";

export interface PublicInvitation {
  data: InvitationData;
  template: TemplateRecord;
}

/**
 * Loads a published invitation by its public slug. Relies entirely on RLS
 * (`invitations_select_own_admin_or_active`) — anonymous visitors can only
 * ever see rows where status = 'active', so this naturally returns null for
 * both "wrong slug" and "not published yet" without leaking which.
 */
export async function getPublicInvitationBySlug(slug: string): Promise<PublicInvitation | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data: invitation } = await supabase
    .from("invitations")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!invitation) return null;

  const template = invitation.template_id ? await getTemplateById(invitation.template_id) : null;
  if (!template) return null;

  const [{ data: events }, { data: gallery }, { data: pages }, { data: music }] = await Promise.all([
    supabase.from("events").select("*").eq("invitation_id", invitation.id).order("sort_order"),
    supabase.from("gallery_images").select("*").eq("invitation_id", invitation.id).order("sort_order"),
    supabase.from("invitation_pages").select("*").eq("invitation_id", invitation.id).order("sort_order"),
    supabase.from("music_files").select("*").eq("invitation_id", invitation.id).limit(1).maybeSingle(),
  ]);

  return {
    data: toInvitationData(invitation, events ?? [], gallery ?? [], pages ?? [], music ?? null),
    template,
  };
}
