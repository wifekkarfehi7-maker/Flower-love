import type { Metadata } from "next";

import { AdminSettingsView } from "@/components/admin/admin-settings-view";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { AdminAuditLogEntry, SubscriptionPlan } from "@/types/database";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].admin.settings,
  robots: { index: false },
};

export default async function AdminSettingsPage() {
  const supabase = getSupabaseServerClient();

  let plans: SubscriptionPlan[] = [];
  let auditLog: (AdminAuditLogEntry & { actorEmail: string | null })[] = [];

  if (supabase) {
    const [plansResult, auditResult] = await Promise.all([
      supabase.from("subscription_plans").select("*").order("sort_order", { ascending: true }),
      supabase
        .from("admin_audit_log")
        .select("*, profiles:actor_id (email)")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    plans = plansResult.data ?? [];
    auditLog = (auditResult.data ?? []).map((entry) => {
      const { profiles, ...rest } = entry as typeof entry & { profiles: { email: string | null } | null };
      return { ...rest, actorEmail: profiles?.email ?? null };
    });
  }

  return <AdminSettingsView initialPlans={plans} auditLog={auditLog} />;
}
