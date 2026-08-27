"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { GuestRow, GuestStatus } from "@/types/database";
type GuestUpdate = Partial<GuestRow>;

export type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string };

function ok<T>(data: T): ActionResult<T> {
  return { data, error: null };
}
function fail<T>(error: string): ActionResult<T> {
  return { data: null, error };
}
const NOT_CONFIGURED = "not_configured";

export interface GuestInput {
  name: string;
  phone: string | null;
  status: GuestStatus;
  guestCount: number;
  notes: string | null;
}

export async function addGuest(invitationId: string, input: GuestInput): Promise<ActionResult<GuestRow>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const { data, error } = await supabase
    .from("guests")
    .insert({
      invitation_id: invitationId,
      name: input.name,
      phone: input.phone,
      status: input.status,
      guest_count: input.guestCount,
      notes: input.notes,
    })
    .select("*")
    .single();

  return error || !data ? fail(error?.message ?? "insert_failed") : ok(data);
}

export async function updateGuest(id: string, input: Partial<GuestInput>): Promise<ActionResult<GuestRow>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const patch: GuestUpdate = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.status !== undefined) patch.status = input.status;
  if (input.guestCount !== undefined) patch.guest_count = input.guestCount;
  if (input.notes !== undefined) patch.notes = input.notes;

  const { data, error } = await supabase.from("guests").update(patch).eq("id", id).select("*").single();
  return error || !data ? fail(error?.message ?? "update_failed") : ok(data);
}

export async function deleteGuest(id: string): Promise<ActionResult<null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);
  const { error } = await supabase.from("guests").delete().eq("id", id);
  return error ? fail(error.message) : ok(null);
}

export async function deleteRsvp(id: string): Promise<ActionResult<null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);
  const { error } = await supabase.from("rsvps").delete().eq("id", id);
  return error ? fail(error.message) : ok(null);
}
