"use client";

import { getVisitorSession } from "@/lib/analytics/session";
import type { Dictionary } from "@/lib/i18n/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Files a guest's rating through the one function allowed to write it. The
 * session is the same opaque per-browser value analytics and ordering use, so
 * "one review a day" means one per phone without knowing whose phone it is.
 */
export async function leaveReview(options: {
  restaurantId: string;
  rating: number;
  comment: string;
  tableId: string | null;
  orderId?: string | null;
}): Promise<{ ok: true } | { error: string }> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { error: "NOT_CONFIGURED" };

  const { error } = await supabase.rpc("leave_review", {
    p_restaurant: options.restaurantId,
    p_session: getVisitorSession(),
    p_rating: options.rating,
    p_comment: options.comment.trim() || null,
    p_table: options.tableId,
    p_order: options.orderId ?? null,
  });

  if (error) return { error: error.message };
  return { ok: true };
}

/** So a guest who already spoke today sees a thank-you, not a form that will be refused. */
export async function hasReviewedToday(restaurantId: string): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return false;

  const { data } = await supabase.rpc("has_reviewed_today", {
    p_restaurant: restaurantId,
    p_session: getVisitorSession(),
  });
  return data === true;
}

export function reviewErrorMessage(raw: string, t: Dictionary): string {
  if (raw.includes("ALREADY_REVIEWED")) return t.reviews.alreadyReviewed;
  if (raw.includes("VENUE_NOT_AVAILABLE")) return t.menu.notFoundText;
  return t.reviews.failed;
}
