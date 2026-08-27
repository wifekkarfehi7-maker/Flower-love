import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getCurrentUserAndProfile } from "@/lib/auth/get-current-user";
import { getInvitationForBuilder } from "@/lib/invitations/get-invitation";
import { getActiveTemplates } from "@/lib/templates/get-templates";
import { getActivePricingPlans } from "@/lib/pricing/get-plans";
import { WeddingBuilder } from "@/components/builder/wedding-builder";

export const metadata: Metadata = { title: "باني الدعوات — Flower & Love" };
export const dynamic = "force-dynamic";

export default async function InvitationBuilderPage({ params }: { params: { id: string } }) {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user) redirect(`/login?next=/invitations/${params.id}/builder`);

  const [data, templates, plans] = await Promise.all([
    getInvitationForBuilder(params.id, user.id, profile?.role === "admin"),
    getActiveTemplates(),
    getActivePricingPlans(),
  ]);

  if (!data) notFound();

  return (
    <WeddingBuilder
      invitation={data.invitation}
      pages={data.pages}
      events={data.events}
      gallery={data.gallery}
      music={data.music}
      templates={templates}
      plans={plans}
      profile={profile}
      userId={user.id}
    />
  );
}
