import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { getActiveTemplates } from "@/lib/templates/get-templates";
import { MotifIcon } from "@/components/invitation/motif-icon";
import { fontFamilyFor } from "@/components/invitation/theme";

export const metadata: Metadata = {
  title: "النماذج — Flower & Love",
  description: "تصفح كل نماذج دعوات الزفاف الرقمية الفاخرة، كل نموذج بهوية بصرية مستقلة بالكامل.",
};

export default async function TemplatesPage() {
  const templates = await getActiveTemplates();

  return (
    <section className="bg-background py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-sm font-semibold tracking-wide text-gold-600">تصاميم فاخرة</span>
          <h1 className="mt-3 font-heading text-3xl font-bold text-ink-900 sm:text-4xl">كل النماذج</h1>
          <p className="mt-4 text-ink-500">
            كل نموذج مصمم بهوية بصرية مستقلة: ألوان، خطوط، تخطيط وحركات مختلفة تماماً.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {templates.map((template) => (
            <Link
              key={template.slug}
              href={`/templates/${template.slug}/preview`}
              className="group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-2xl p-5 shadow-card ring-1 ring-black/5 transition-transform duration-500 hover:-translate-y-1"
              style={{
                backgroundColor: template.theme.background,
                backgroundImage:
                  template.theme.backgroundStyle === "gradient"
                    ? `linear-gradient(165deg, ${template.theme.background}, ${template.theme.surface})`
                    : template.theme.backgroundStyle === "radial"
                      ? `radial-gradient(circle at 50% 0%, ${template.theme.surface}, ${template.theme.background} 75%)`
                      : undefined,
                color: template.theme.text,
              }}
            >
              <div className="flex items-start justify-between">
                <MotifIcon motif={template.theme.motif} className="h-5 w-5 opacity-80" />
                <Badge variant="outline" className="border-white/30 bg-black/10 text-[10px] opacity-90 backdrop-blur-sm">
                  {template.category}
                </Badge>
              </div>
              <div>
                <p className="text-lg leading-snug" style={{ fontFamily: fontFamilyFor(template.fonts.heading) }}>
                  {template.name}
                </p>
                <p className="mt-1 text-xs opacity-70">{template.nameAr}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
