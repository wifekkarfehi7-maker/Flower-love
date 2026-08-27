import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getCurrentUserAndProfile } from "@/lib/auth/get-current-user";
import { getInvitationForBuilder } from "@/lib/invitations/get-invitation";
import { getTemplateById, getActiveTemplates } from "@/lib/templates/get-templates";
import { toInvitationData } from "@/lib/invitations/to-invitation-data";
import { InvitationPreviewShell } from "@/components/invitation/invitation-preview-shell";

export const metadata: Metadata = { title: "معاينة الدعوة — Flower & Love" };
export const dynamic = "force-dynamic";

export default async function InvitationOwnerPreviewPage({ params }: { params: { id: string } }) {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user) redirect(`/login?next=/invitations/${params.id}/preview`);

  const data = await getInvitationForBuilder(params.id, user.id, profile?.role === "admin");
  if (!data) notFound();

  const template = data.invitation.template_id
    ? await getTemplateById(data.invitation.template_id)
    : (await getActiveTemplates())[0] ?? null;
  if (!template) notFound();

  const invitationData = toInvitationData(data.invitation, data.events, data.gallery, data.pages, data.music);

  return (
    <InvitationPreviewShell
      template={template}
      invitation={invitationData}
      variant="owner"
      backHref={`/invitations/${params.id}/builder`}
      ctaHref={null}
    />
  );
}
