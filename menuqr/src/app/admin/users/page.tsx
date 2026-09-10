import type { Metadata } from "next";

import { AdminUsersView, type AdminUserRow } from "@/components/admin/admin-users-view";
import { defaultLocale } from "@/lib/i18n/config";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: dictionaries[defaultLocale].admin.users,
  robots: { index: false },
};

export default async function AdminUsersPage() {
  const supabase = getSupabaseServerClient();
  let rows: AdminUserRow[] = [];

  if (supabase) {
    const { data } = await supabase.rpc("admin_users", { p_search: null, p_limit: 20, p_offset: 0 });
    rows = (data ?? []).map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      phone: row.phone,
      role: row.platform_role,
      isSuspended: row.is_suspended,
      createdAt: row.created_at,
      restaurantCount: Number(row.restaurant_count ?? 0),
      totalCount: Number(row.total_count ?? 0),
    }));
  }

  return <AdminUsersView initialRows={rows} />;
}
