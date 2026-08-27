import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { GuestRow, InvitationRow, RsvpRow } from "@/types/database";

export interface GuestPageData {
  invitation: InvitationRow;
  guests: GuestRow[];
  rsvps: RsvpRow[];
}

/** Loads an invitation with its guest list and RSVP responses. Returns null if not found or not owned by userId (unless isAdmin). */
export async function getGuestPageData(
  invitationId: string,
  userId: string,
  isAdmin = false
): Promise<GuestPageData | null> {
  const supabase = getSupabaseServerClient();
  if (!supabase) return null;

  const { data: invitation } = await supabase.from("invitations").select("*").eq("id", invitationId).single();
  if (!invitation || (invitation.user_id !== userId && !isAdmin)) return null;

  const [{ data: guests }, { data: rsvps }] = await Promise.all([
    supabase.from("guests").select("*").eq("invitation_id", invitationId).order("created_at", { ascending: false }),
    supabase.from("rsvps").select("*").eq("invitation_id", invitationId).order("created_at", { ascending: false }),
  ]);

  return { invitation, guests: guests ?? [], rsvps: rsvps ?? [] };
}
