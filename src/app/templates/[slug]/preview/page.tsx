import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getTemplateBySlug } from "@/lib/templates/get-templates";
import { getTemplatePreview } from "@/lib/templates/previews";
import { demoInvitationFor } from "@/lib/templates/demo-invitation";
import { InvitationPreviewShell } from "@/components/invitation/invitation-preview-shell";
import { templateUseHref } from "@/lib/templates/presentation";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const template = await getTemplateBySlug(params.slug);
  if (!template) return { title: "معاينة النموذج — Flower & Love" };

  const title = `${template.nameAr} · ${template.name} — Flower & Love`;
  const og = getTemplatePreview(template.slug)?.og;
  return {
    title,
    openGraph: { title, images: og ? [{ url: og.src, width: og.width, height: og.height }] : undefined },
    twitter: { card: og ? "summary_large_image" : "summary", title, images: og ? [og.src] : undefined },
  };
}

export default async function TemplatePreviewPage({ params }: { params: { slug: string } }) {
  const template = await getTemplateBySlug(params.slug);
  if (!template) notFound();

  return <InvitationPreviewShell template={template} invitation={demoInvitationFor(template.theme)} ctaHref={templateUseHref(template.slug)} />;
}
