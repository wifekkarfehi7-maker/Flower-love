import type { Metadata } from "next";

import { TemplateCollection } from "@/components/templates/template-collection";
import { getActiveTemplates } from "@/lib/templates/get-templates";
import { getTemplatePreview } from "@/lib/templates/previews";
import { toTemplateCardItem } from "@/lib/templates/presentation";

export async function generateMetadata(): Promise<Metadata> {
  const [first] = await getActiveTemplates();
  const og = first ? getTemplatePreview(first.slug)?.og : null;
  const title = "المجموعة — Flower & Love";
  const description = "نماذج دعوات زفاف رقمية فاخرة، لكلّ منها خطوطه وألوانه وطريقة وصوله إلى ضيوفكم.";
  return {
    title,
    description,
    openGraph: { title, description, images: og ? [{ url: og.src, width: og.width, height: og.height }] : undefined },
  };
}

export default async function TemplatesPage() {
  const templates = await getActiveTemplates();
  return <TemplateCollection items={templates.map(toTemplateCardItem)} />;
}
