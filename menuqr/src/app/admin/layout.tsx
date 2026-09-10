import { AdminShell } from "@/components/admin/admin-shell";
import { ErrorState } from "@/components/shared/error-state";
import { requireAdmin } from "@/lib/admin/require-admin";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  if (!profile) return <ErrorState variant="forbidden" />;

  return <AdminShell>{children}</AdminShell>;
}
