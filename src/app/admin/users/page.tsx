import { listAdminUsers } from "@/lib/admin/users";
import { AdminUsersView } from "@/components/admin/users-view";
import { getCurrentUserAndProfile } from "@/lib/auth/get-current-user";

export default async function AdminUsersPage() {
  const [users, { user }] = await Promise.all([listAdminUsers(), getCurrentUserAndProfile()]);
  return <AdminUsersView users={users} currentUserId={user?.id ?? null} />;
}
