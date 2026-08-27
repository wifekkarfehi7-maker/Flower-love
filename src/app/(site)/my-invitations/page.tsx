import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUserAndProfile } from "@/lib/auth/get-current-user";
import { MyInvitationsView } from "@/components/dashboard/my-invitations-view";
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

  if (supabase) {
    const { data } = await supabase
      .from("invitations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    invitations = data ?? [];
  }

  return <MyInvitationsView profile={profile} invitations={invitations} />;
}
