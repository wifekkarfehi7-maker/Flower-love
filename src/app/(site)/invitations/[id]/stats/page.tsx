import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getCurrentUserAndProfile } from "@/lib/auth/get-current-user";
import { getOwnedInvitation } from "@/lib/invitations/get-owned-invitation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { StatsView, type DayPoint } from "@/components/share/stats-view";

export const metadata: Metadata = { title: "إحصائيات الدعوة — Flower & Love" };
export const dynamic = "force-dynamic";

/** How many days the charts cover, ending today. */
const WINDOW_DAYS = 30;

/** A calendar day (YYYY-MM-DD) in Tunisian time — the same clock the view counter uses. */
function tunisDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(date);
}

export default async function StatsPage({ params }: { params: { id: string } }) {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user) redirect(`/login?next=/invitations/${params.id}/stats`);

  const owned = await getOwnedInvitation(params.id, user.id, profile?.role === "admin");
  if (!owned) notFound();

  const supabase = getSupabaseServerClient();
  const today = tunisDay(new Date());
  const days: string[] = [];
  const cursor = new Date(`${today}T12:00:00Z`);
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    days.push(new Date(cursor.getTime() - i * 86_400_000).toISOString().slice(0, 10));
  }

  const [{ data: dailyViews }, { data: rsvps }, { data: guests }] = await Promise.all([
    owned.isPremium && supabase
      ? supabase.from("invitation_daily_views").select("day, views").eq("invitation_id", params.id).gte("day", days[0]!)
      : Promise.resolve({ data: [] as { day: string; views: number }[] }),
    supabase
      ? supabase.from("rsvps").select("attendance, guest_count, created_at").eq("invitation_id", params.id)
      : Promise.resolve({ data: [] as { attendance: string; guest_count: number; created_at: string }[] }),
    supabase
      ? supabase.from("guests").select("status, guest_count").eq("invitation_id", params.id)
      : Promise.resolve({ data: [] as { status: string; guest_count: number }[] }),
  ]);

  const viewsByDay = new Map((dailyViews ?? []).map((row) => [row.day, row.views]));
  const series: DayPoint[] = days.map((day) => ({ day, views: viewsByDay.get(day) ?? 0, attending: 0, notAttending: 0 }));
  const byDay = new Map(series.map((point) => [point.day, point]));
  for (const r of rsvps ?? []) {
    const point = byDay.get(tunisDay(new Date(r.created_at)));
    if (!point) continue;
    if (r.attendance === "attending") point.attending += 1;
    else point.notAttending += 1;
  }

  const responses = rsvps ?? [];
  const totals = {
    views: owned.invitation.view_count,
    responses: responses.length,
    attendingPeople: responses.filter((r) => r.attendance === "attending").reduce((sum, r) => sum + r.guest_count, 0),
    notAttending: responses.filter((r) => r.attendance === "not_attending").length,
    pendingGuests: (guests ?? []).filter((g) => g.status === "pending").length,
  };

  return <StatsView invitation={owned.invitation} isPremium={owned.isPremium} totals={totals} series={series} />;
}
