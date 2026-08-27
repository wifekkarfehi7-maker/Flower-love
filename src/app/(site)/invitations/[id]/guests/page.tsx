import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getCurrentUserAndProfile } from "@/lib/auth/get-current-user";
import { getGuestPageData } from "@/lib/guests/get-guest-data";
import { GuestManagementView } from "@/components/guests/guest-management-view";

export const metadata: Metadata = { title: "إدارة الضيوف — Flower & Love" };
export const dynamic = "force-dynamic";

export default async function GuestsPage({ params }: { params: { id: string } }) {
  const { user } = await getCurrentUserAndProfile();
  if (!user) redirect(`/login?next=/invitations/${params.id}/guests`);

  const data = await getGuestPageData(params.id, user.id);
  if (!data) notFound();

  return <GuestManagementView invitation={data.invitation} guests={data.guests} rsvps={data.rsvps} />;
}
