"use client";

import { SUPPORT_EMAIL } from "@/lib/config";
import { useTranslation } from "@/lib/i18n/provider";
import { PRIVACY, TERMS } from "@/lib/legal/content";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function LegalPage({ document: kind }: { document: "privacy" | "terms" }) {
  const { locale } = useTranslation();
  const content = (kind === "privacy" ? PRIVACY : TERMS)[locale];

  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{content.title}</h1>
        <p className="mt-3 text-muted-foreground">{content.intro}</p>

        <div className="mt-10 space-y-8">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-base font-semibold">{section.heading}</h2>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline" dir="ltr">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </main>

      <SiteFooter />
    </>
  );
}
