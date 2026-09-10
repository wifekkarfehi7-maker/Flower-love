import type { Metadata } from "next";

import { AccountForm } from "@/components/settings/account-form";
import { DemoDataPanel } from "@/components/settings/demo-data-panel";
import { MenuSettingsForm } from "@/components/settings/menu-settings-form";
import { SettingsTabs } from "@/components/settings/settings-tabs";
import { TeamPanel, type TeamMember } from "@/components/settings/team-panel";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getRestaurantContext } from "@/lib/restaurants/get-restaurant-context";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].settings.title,
  robots: { index: false },
};

export default async function SettingsPage() {
  const { active } = await getRestaurantContext();
  const supabase = getSupabaseServerClient();

  let members: TeamMember[] = [];

  if (active && supabase) {
    const { data } = await supabase
      .from("restaurant_members")
      .select("id, user_id, role, profiles:user_id (full_name, email)")
      .eq("restaurant_id", active.id)
      .order("created_at", { ascending: true });

    members = (data ?? []).map((row) => {
      const linked = row.profiles as unknown as { full_name: string | null; email: string | null } | null;
      return {
        id: row.id,
        userId: row.user_id,
        role: row.role,
        fullName: linked?.full_name ?? null,
        email: linked?.email ?? null,
      };
    });
  }

  return (
    <SettingsTabs
      menu={<MenuSettingsForm />}
      account={<AccountForm />}
      team={<TeamPanel initialMembers={members} />}
      demo={<DemoDataPanel />}
    />
  );
}
