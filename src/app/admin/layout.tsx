import type { Metadata } from "next";

import { requireAdmin } from "@/lib/admin/require-admin";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = { title: "لوحة الإدارة — Flower & Love" };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();

  return <AdminShell adminName={profile.full_name}>{children}</AdminShell>;
}
