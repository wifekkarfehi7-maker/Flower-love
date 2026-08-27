import { listAdminOrders } from "@/lib/admin/orders";
import { OrdersListView } from "@/components/admin/orders-list-view";
import type { OrderStatus } from "@/types/database";

export default async function AdminOrdersPage({ searchParams }: { searchParams: { status?: string } }) {
  const statusFilter = searchParams.status as OrderStatus | undefined;
  const orders = await listAdminOrders(statusFilter ? [statusFilter] : undefined);
  return <OrdersListView orders={orders} activeStatus={statusFilter ?? null} />;
}
