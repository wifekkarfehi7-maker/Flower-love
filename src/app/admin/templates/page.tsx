import { getAllTemplatesForAdmin } from "@/lib/templates/get-templates";
import { AdminTemplatesView } from "@/components/admin/templates-view";

export default async function AdminTemplatesPage() {
  const templates = await getAllTemplatesForAdmin();
  return <AdminTemplatesView templates={templates} />;
}
