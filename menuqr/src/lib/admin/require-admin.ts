import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { Profile } from "@/types/database";

/**
 * Gate for every /admin page. The database enforces the same rule
 * independently — each admin RPC re-checks is_super_admin() — so this only
 * decides what gets rendered.
 */
export async function requireAdmin(): Promise<Profile> {
  const { user, profile } = await getCurrentUser();

  if (!user) redirect("/login?next=/admin");
  if (!profile || profile.platform_role !== "super_admin" || profile.is_suspended) redirect("/dashboard");

  return profile;
}
