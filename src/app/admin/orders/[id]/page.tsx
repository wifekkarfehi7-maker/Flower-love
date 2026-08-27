import { notFound } from "next/navigation";

import { getAdminOrderDetail } from "@/lib/admin/orders";
import { OrderDetailView } from "@/components/admin/order-detail-view";

export const dynamic = "force-dynamic";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const detail = await getAdminOrderDetail(params.id);
  if (!detail) notFound();

  return <OrderDetailView detail={detail} />;
}
