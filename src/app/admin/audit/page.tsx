import { listAuditLog } from "@/lib/admin/audit";
import { AuditLogView } from "@/components/admin/audit-log-view";

export default async function AdminAuditPage() {
  const entries = await listAuditLog();
  return <AuditLogView entries={entries} />;
}
