import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getCurrentUserAndProfile } from "@/lib/auth/get-current-user";
import { getOwnedInvitation } from "@/lib/invitations/get-owned-invitation";
import { ShareView } from "@/components/share/share-view";

export const metadata: Metadata = { title: "مشاركة الدعوة — Flower & Love" };
export const dynamic = "force-dynamic";

export default async function SharePage({ params }: { params: { id: string } }) {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user) redirect(`/login?next=/invitations/${params.id}/share`);

  const owned = await getOwnedInvitation(params.id, user.id, profile?.role === "admin");
  if (!owned) notFound();

  return <ShareView invitation={owned.invitation} isPremium={owned.isPremium} />;
}
