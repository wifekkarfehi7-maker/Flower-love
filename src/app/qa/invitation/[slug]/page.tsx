import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { getTemplateBySlug } from "@/lib/templates/get-templates";
import { demoInvitationFor } from "@/lib/templates/demo-invitation";

/*
 * A bare invitation for automated QA: the real renderer, the demo couple and
 * a template, with no preview chrome, plus the two things a public invitation
 * can have that the template preview cannot: a music track and no photos.
 * Off unless the server runs with ENABLE_QA_ROUTES=1, so a deployment never
 * serves it.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "QA invitation",
  robots: { index: false, follow: false },
};

export default async function QaInvitationPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { music?: string; photo?: string };
}) {
  if (process.env.ENABLE_QA_ROUTES !== "1") notFound();
  const template = await getTemplateBySlug(params.slug);
  if (!template) notFound();

  const demo = demoInvitationFor(template.theme);
  // Same-origin paths only: this exists to test the music path, not to play arbitrary URLs.
  const music = searchParams.music?.startsWith("/") && !searchParams.music.startsWith("//") ? searchParams.music : null;
  const invitation = {
    ...demo,
    ...(searchParams.photo === "0" ? { coverImageUrl: undefined, gallery: [] } : {}),
    ...(music ? { music: { url: music, autoplayAfterOpen: true } } : {}),
  };

  return <InvitationRenderer invitation={invitation} theme={template.theme} fonts={template.fonts} isPreview={false} />;
}
