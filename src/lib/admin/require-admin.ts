import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUserAndProfile } from "@/lib/auth/get-current-user";
import type { ProfileRow } from "@/types/database";

/** Gates every /admin page: signed-out users go to login, signed-in non-admins go home. */
export async function requireAdmin(): Promise<ProfileRow> {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user) redirect("/login?next=/admin");
  if (!profile || profile.role !== "admin") redirect("/");
  return profile;
}
