import { listAdminInvitations } from "@/lib/admin/invitations";
import { AdminInvitationsView } from "@/components/admin/invitations-view";
import type { InvitationStatus } from "@/types/database";

export default async function AdminInvitationsPage({ searchParams }: { searchParams: { status?: string } }) {
  const statusFilter = searchParams.status as InvitationStatus | undefined;
  const invitations = await listAdminInvitations(statusFilter ? [statusFilter] : undefined);
  return <AdminInvitationsView invitations={invitations} activeStatus={statusFilter ?? null} />;
}
