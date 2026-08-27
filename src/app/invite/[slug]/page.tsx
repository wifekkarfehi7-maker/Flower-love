import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPublicInvitationBySlug } from "@/lib/invitations/get-public-invitation";
import { InvitationRenderer } from "@/components/invitation/invitation-renderer";
import { ViewTracker } from "@/components/invitation/view-tracker";
import { SITE_NAME, SITE_URL } from "@/lib/config";

export const dynamic = "force-dynamic";

function formatDate(date: string | null) {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00`);
  return d.toLocaleDateString("ar-TN", { day: "numeric", month: "long", year: "numeric" });
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const result = await getPublicInvitationBySlug(params.slug);
  if (!result) return { title: `دعوة الزفاف — ${SITE_NAME}` };

  const { data } = result;
  const names = `${data.groomName} & ${data.brideName}`;
  const date = formatDate(data.weddingDate);
  const description = date
    ? `ادعوكم لحضور حفل زفافنا يوم ${date} ❤️`
    : "ادعوكم لحضور حفل زفافنا ❤️";
  const image = data.coverImageUrl ?? data.gallery[0]?.url;
  const url = `${SITE_URL}/invite/${params.slug}`;

  return {
    title: `${names} — دعوة زفاف`,
    description,
    openGraph: {
      type: "website",
      title: `${names} 💍`,
      description,
      url,
      images: image ? [{ url: image, width: 1200, height: 630, alt: names }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${names} 💍`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PublicInvitationPage({ params }: { params: { slug: string } }) {
  const result = await getPublicInvitationBySlug(params.slug);
  if (!result) notFound();

  const { data, template } = result;

  return (
    <>
      <ViewTracker invitationId={data.id} />
      <InvitationRenderer invitation={data} theme={template.theme} fonts={template.fonts} isPreview={false} />
    </>
  );
}
