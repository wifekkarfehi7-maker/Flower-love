"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

import { Container } from "@/components/ui/container";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n/use-translation";

export function SiteFooter() {
  const { t } = useTranslation();

  return (
    <footer className="bg-ink-950 pt-16 text-ink-300">
      <Container>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-gradient">
                <Heart className="h-4 w-4 text-ink-950" fill="currentColor" />
              </span>
              <span className="font-heading text-lg font-semibold text-white">
                Flower <span className="text-gold-400">&amp;</span> Love
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-balance text-sm leading-relaxed text-ink-400">
              {t.footer.tagline}
            </p>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold text-white">{t.footer.productTitle}</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><a href="#templates" className="hover:text-gold-300">{t.nav.templates}</a></li>
              <li><a href="#pricing" className="hover:text-gold-300">{t.nav.pricing}</a></li>
              <li><a href="#how-it-works" className="hover:text-gold-300">{t.nav.howItWorks}</a></li>
              <li><a href="#faq" className="hover:text-gold-300">{t.nav.faq}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading text-sm font-semibold text-white">{t.footer.legalTitle}</h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li><Link href="/privacy" className="hover:text-gold-300">{t.footer.privacy}</Link></li>
              <li><Link href="/terms" className="hover:text-gold-300">{t.footer.terms}</Link></li>
              <li><a href="#contact" className="hover:text-gold-300">{t.footer.contact}</a></li>
            </ul>
          </div>
        </div>

        <Separator className="mt-12 bg-white/10" />

        <div className="flex flex-col items-center justify-between gap-3 py-8 text-xs text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Flower &amp; Love — {t.footer.rights}</p>
          <p>{t.footer.madeWith}</p>
        </div>
      </Container>
    </footer>
  );
}
