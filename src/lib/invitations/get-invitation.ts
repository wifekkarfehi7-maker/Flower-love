import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { EventRow, GalleryImageRow, InvitationPageRow, InvitationRow, MusicFileRow } from "@/types/database";

export interface InvitationBuilderData {
  invitation: InvitationRow;
  pages: InvitationPageRow[];
  events: EventRow[];
  gallery: GalleryImageRow[];
  music: MusicFileRow | null;
}

/** Loads an invitation with all its related builder data. Returns null if not found or not owned by userId (unless isAdmin). */
export async function getInvitationForBuilder(
  id: string,
  userId: string,
  isAdmin = false
): Promise<InvitationBuilderData | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data: invitation } = await supabase.from("invitations").select("*").eq("id", id).single();
  if (!invitation || (invitation.user_id !== userId && !isAdmin)) return null;

  const [{ data: pages }, { data: events }, { data: gallery }, { data: music }] = await Promise.all([
    supabase.from("invitation_pages").select("*").eq("invitation_id", id).order("sort_order"),
    supabase.from("events").select("*").eq("invitation_id", id).order("sort_order"),
    supabase.from("gallery_images").select("*").eq("invitation_id", id).order("sort_order"),
    supabase.from("music_files").select("*").eq("invitation_id", id).limit(1).maybeSingle(),
  ]);

  return {
    invitation,
    pages: pages ?? [],
    events: events ?? [],
    gallery: gallery ?? [],
    music: music ?? null,
  };
}
