import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserAndProfile } from "@/lib/auth/get-current-user";
import { MyInvitationsView, type InvitationStats } from "@/components/dashboard/my-invitations-view";
import type { InvitationRow } from "@/types/database";

export const metadata: Metadata = {
  title: "دعواتي — Flower & Love",
};

export const dynamic = "force-dynamic";

export default async function MyInvitationsPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  // Defense in depth — middleware already guards this route.
  if (!user) redirect("/login?next=/my-invitations");

  if (!profile?.full_name || !profile?.whatsapp) {
    redirect("/complete-profile?next=/my-invitations");
  }

  const supabase = getSupabaseServerClient();
  let invitations: InvitationRow[] = [];
  const stats: Record<string, InvitationStats> = {};

  if (supabase) {
    const { data } = await supabase
      .from("invitations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    invitations = data ?? [];

    const ids = invitations.map((i) => i.id);
    if (ids.length > 0) {
      const [{ data: rsvps }, { data: guests }] = await Promise.all([
        supabase.from("rsvps").select("invitation_id, attendance, guest_count").in("invitation_id", ids),
        supabase.from("guests").select("invitation_id, status").in("invitation_id", ids),
      ]);

      for (const id of ids) {
        stats[id] = { attending: 0, pending: 0 };
      }
      for (const r of rsvps ?? []) {
        if (r.attendance === "attending") stats[r.invitation_id]!.attending += r.guest_count;
      }
      for (const g of guests ?? []) {
        if (g.status === "pending") stats[g.invitation_id]!.pending += 1;
      }
    }
  }

  return <MyInvitationsView profile={profile} invitations={invitations} stats={stats} />;
}
