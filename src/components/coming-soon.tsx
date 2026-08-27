"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { useTranslation } from "@/lib/i18n/use-translation";

/**
 * Honest "not built yet" placeholder for the invitation builder, which
 * lands in a later phase. Offers a working WhatsApp fallback instead of a
 * dead end.
 */
export function ComingSoon() {
  const { t, dir } = useTranslation();
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    <section className="flex min-h-[calc(100vh-5rem)] items-center bg-ink-50/60 py-20">
      <Container className="max-w-lg">
        <div className="rounded-[2rem] border border-ink-100 bg-white p-8 text-center shadow-card sm:p-12">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold-gradient shadow-soft">
            <Heart className="h-6 w-6 text-ink-950" fill="currentColor" />
          </span>

          <span className="mt-6 inline-flex items-center rounded-full bg-gold-50 px-3 py-1 text-xs font-semibold text-gold-700">
            {t.comingSoon.badge}
          </span>

          <h1 className="mt-4 font-heading text-2xl font-bold text-ink-900 sm:text-3xl">
            {t.comingSoon.builderTitle}
          </h1>

          <p className="mt-4 text-balance leading-relaxed text-ink-500">{t.comingSoon.builderDescription}</p>

          <div className="mt-8 flex flex-col gap-3">
            <WhatsAppButton message={t.comingSoon.builderWhatsappMessage} size="lg">
              {t.comingSoon.whatsappCta}
            </WhatsAppButton>
            <Button asChild variant="ghost">
              <Link href="/my-invitations">
                <BackIcon className="h-4 w-4" />
                {t.comingSoon.backHome}
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
