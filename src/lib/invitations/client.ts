"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { DEMO_PAGE_ORDER } from "@/lib/templates/demo-invitation";
import type {
  EventRow,
  GalleryImageRow,
  InvitationPageRow,
  InvitationRow,
  MusicFileRow,
} from "@/types/database";
import type { EventType, PageType } from "@/types/invitation";

export type ActionResult<T = null> = { data: T; error: null } | { data: null; error: string };

function ok<T>(data: T): ActionResult<T> {
  return { data, error: null };
}
function fail<T>(error: string): ActionResult<T> {
  return { data: null, error };
}
const NOT_CONFIGURED = "not_configured";

/** Creates a new draft invitation with the default 10 pages, all enabled in the standard order. */
export async function createDraftInvitation(userId: string): Promise<ActionResult<{ id: string }>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const { data, error } = await supabase
    .from("invitations")
    .insert({ user_id: userId, status: "draft" })
    .select("id")
    .single();

  if (error || !data) return fail(error?.message ?? "insert_failed");

  const pages = DEMO_PAGE_ORDER.map((pageType, i) => ({
    invitation_id: data.id,
    page_type: pageType,
    is_enabled: true,
    sort_order: i,
  }));
  const { error: pagesError } = await supabase.from("invitation_pages").insert(pages);
  if (pagesError) return fail(pagesError.message);

  return ok({ id: data.id });
}

export async function updateInvitationFields(
  id: string,
  patch: Partial<InvitationRow>
): Promise<ActionResult<null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);
  const { error } = await supabase.from("invitations").update(patch).eq("id", id);
  return error ? fail(error.message) : ok(null);
}

export interface EventInput {
  type: EventType;
  name: string;
  date: string | null;
  time: string | null;
  locationName: string | null;
  locationUrl: string | null;
}

/** Replaces all events for an invitation with the given list (small lists — simplest correct approach). */
export async function replaceEvents(invitationId: string, events: EventInput[]): Promise<ActionResult<EventRow[]>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const { error: deleteError } = await supabase.from("events").delete().eq("invitation_id", invitationId);
  if (deleteError) return fail(deleteError.message);

  if (events.length === 0) return ok([]);

  const { data, error } = await supabase
    .from("events")
    .insert(
      events.map((e, i) => ({
        invitation_id: invitationId,
        event_type: e.type,
        name: e.name,
        event_date: e.date,
        event_time: e.time,
        location_name: e.locationName,
        location_url: e.locationUrl,
        sort_order: i,
      }))
    )
    .select("*");

  return error ? fail(error.message) : ok(data ?? []);
}

export async function upsertPages(
  invitationId: string,
  pages: { pageType: PageType; isEnabled: boolean; sortOrder: number }[]
): Promise<ActionResult<InvitationPageRow[]>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const { data, error } = await supabase
    .from("invitation_pages")
    .upsert(
      pages.map((p) => ({
        invitation_id: invitationId,
        page_type: p.pageType,
        is_enabled: p.isEnabled,
        sort_order: p.sortOrder,
      })),
      { onConflict: "invitation_id,page_type" }
    )
    .select("*");

  return error ? fail(error.message) : ok(data ?? []);
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function uploadGalleryImage(
  invitationId: string,
  userId: string,
  file: File,
  sortOrder: number
): Promise<ActionResult<GalleryImageRow>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return fail("invalid_file_type");
  if (file.size > MAX_IMAGE_BYTES) return fail("file_too_large");

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${invitationId}/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from("gallery").upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
  });
  if (uploadError) return fail(uploadError.message);

  const { data: publicUrlData } = supabase.storage.from("gallery").getPublicUrl(path);

  const { data, error } = await supabase
    .from("gallery_images")
    .insert({ invitation_id: invitationId, storage_path: path, url: publicUrlData.publicUrl, sort_order: sortOrder })
    .select("*")
    .single();

  if (error || !data) {
    await supabase.storage.from("gallery").remove([path]);
    return fail(error?.message ?? "insert_failed");
  }

  return ok(data);
}

export async function deleteGalleryImage(imageId: string, storagePath: string): Promise<ActionResult<null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  await supabase.storage.from("gallery").remove([storagePath]);
  const { error } = await supabase.from("gallery_images").delete().eq("id", imageId);
  return error ? fail(error.message) : ok(null);
}

export async function reorderGalleryImages(images: { id: string; sortOrder: number }[]): Promise<ActionResult<null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const results = await Promise.all(
    images.map((img) => supabase.from("gallery_images").update({ sort_order: img.sortOrder }).eq("id", img.id))
  );
  const firstError = results.find((r) => r.error);
  return firstError?.error ? fail(firstError.error.message) : ok(null);
}

const MAX_AUDIO_BYTES = 15 * 1024 * 1024;
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/mp3"];

/** Replaces the invitation's music track (one track per invitation for now). */
export async function uploadMusic(
  invitationId: string,
  userId: string,
  file: File,
  existing?: MusicFileRow | null
): Promise<ActionResult<MusicFileRow>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) return fail("invalid_file_type");
  if (file.size > MAX_AUDIO_BYTES) return fail("file_too_large");

  if (existing) {
    await supabase.storage.from("music").remove([existing.storage_path]);
    await supabase.from("music_files").delete().eq("id", existing.id);
  }

  const path = `${userId}/${invitationId}/${crypto.randomUUID()}.mp3`;
  const { error: uploadError } = await supabase.storage.from("music").upload(path, file, {
    contentType: file.type,
    cacheControl: "3600",
  });
  if (uploadError) return fail(uploadError.message);

  const { data: publicUrlData } = supabase.storage.from("music").getPublicUrl(path);

  const { data, error } = await supabase
    .from("music_files")
    .insert({ invitation_id: invitationId, storage_path: path, url: publicUrlData.publicUrl, title: file.name })
    .select("*")
    .single();

  if (error || !data) {
    await supabase.storage.from("music").remove([path]);
    return fail(error?.message ?? "insert_failed");
  }

  return ok(data);
}

export async function deleteMusic(musicId: string, storagePath: string): Promise<ActionResult<null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  await supabase.storage.from("music").remove([storagePath]);
  const { error } = await supabase.from("music_files").delete().eq("id", musicId);
  return error ? fail(error.message) : ok(null);
}

export async function setMusicAutoplay(musicId: string, autoplay: boolean): Promise<ActionResult<null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);
  const { error } = await supabase.from("music_files").update({ autoplay_after_open: autoplay }).eq("id", musicId);
  return error ? fail(error.message) : ok(null);
}

export async function deleteInvitation(id: string): Promise<ActionResult<null>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);
  const { error } = await supabase.from("invitations").delete().eq("id", id);
  return error ? fail(error.message) : ok(null);
}

/**
 * Duplicates an invitation's configurable data (couple info, dates, events,
 * template, pages, fonts) under a brand-new id. Gallery/music files are not
 * copied — the owner re-attaches media on the new draft.
 */
export async function duplicateInvitation(source: InvitationRow, userId: string): Promise<ActionResult<{ id: string }>> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return fail(NOT_CONFIGURED);

  const { data: newInvitation, error } = await supabase
    .from("invitations")
    .insert({
      user_id: userId,
      template_id: source.template_id,
      groom_name: source.groom_name,
      bride_name: source.bride_name,
      groom_father: source.groom_father,
      bride_father: source.bride_father,
      groom_mother: source.groom_mother,
      bride_mother: source.bride_mother,
      invitation_text: source.invitation_text,
      wedding_date: source.wedding_date,
      wedding_time: source.wedding_time,
      data: source.data,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !newInvitation) return fail(error?.message ?? "insert_failed");

  const [{ data: pages }, { data: events }] = await Promise.all([
    supabase.from("invitation_pages").select("*").eq("invitation_id", source.id),
    supabase.from("events").select("*").eq("invitation_id", source.id),
  ]);

  if (pages && pages.length > 0) {
    await supabase.from("invitation_pages").insert(
      pages.map((p) => ({
        invitation_id: newInvitation.id,
        page_type: p.page_type,
        is_enabled: p.is_enabled,
        sort_order: p.sort_order,
        config: p.config,
      }))
    );
  }

  if (events && events.length > 0) {
    await supabase.from("events").insert(
      events.map((e) => ({
        invitation_id: newInvitation.id,
        event_type: e.event_type,
        name: e.name,
        event_date: e.event_date,
        event_time: e.event_time,
        location_name: e.location_name,
        location_url: e.location_url,
        sort_order: e.sort_order,
      }))
    );
  }

  return ok({ id: newInvitation.id });
}
