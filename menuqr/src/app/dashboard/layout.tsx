import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getRestaurantContext } from "@/lib/restaurants/get-restaurant-context";
import { RestaurantProvider } from "@/lib/restaurants/provider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const { active, role, settings, memberships } = await getRestaurantContext();
  if (!active || !role) redirect("/onboarding");

  return (
    <RestaurantProvider
      initialRestaurant={active}
      role={role}
      initialSettings={settings}
      memberships={memberships}
    >
      <DashboardShell>{children}</DashboardShell>
    </RestaurantProvider>
  );
}
