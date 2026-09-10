import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { Profile } from "@/types/database";

/**
 * Gate for every /admin page. Signed-out visitors are sent to the login form;
 * signed-in users without the role get `null`, so the caller can say plainly
 * that they lack access rather than bouncing them somewhere unexplained.
 *
 * The database enforces the same rule independently — every admin RPC
 * re-checks is_super_admin() — so this only decides what gets rendered.
 */
export async function requireAdmin(): Promise<Profile | null> {
  const { user, profile } = await getCurrentUser();

  if (!user) redirect("/login?next=/admin");
  if (!profile || profile.platform_role !== "super_admin" || profile.is_suspended) return null;

  return profile;
}
