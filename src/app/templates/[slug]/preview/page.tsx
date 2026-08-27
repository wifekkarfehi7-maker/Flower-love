import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTemplateBySlug } from "@/lib/templates/get-templates";
import { DEMO_INVITATION } from "@/lib/templates/demo-invitation";
import { InvitationPreviewShell } from "@/components/invitation/invitation-preview-shell";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const template = await getTemplateBySlug(params.slug);
  return { title: template ? `معاينة ${template.nameAr} — Flower & Love` : "معاينة النموذج — Flower & Love" };
}

export default async function TemplatePreviewPage({ params }: { params: { slug: string } }) {
  const template = await getTemplateBySlug(params.slug);
  if (!template) notFound();

  return <InvitationPreviewShell template={template} invitation={DEMO_INVITATION} />;
}
