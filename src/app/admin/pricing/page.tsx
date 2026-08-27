import { getAllPricingPlansForAdmin } from "@/lib/pricing/get-plans";
import { AdminPricingView } from "@/components/admin/pricing-view";

export default async function AdminPricingPage() {
  const plans = await getAllPricingPlansForAdmin();
  return <AdminPricingView plans={plans} />;
}
