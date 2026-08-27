import { getAdminOverview } from "@/lib/admin/overview";
import { OverviewView } from "@/components/admin/overview-view";

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview();
  return <OverviewView overview={overview} />;
}
