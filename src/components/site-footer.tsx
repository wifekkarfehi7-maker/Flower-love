"use client";

import Link from "next/link";

import { Container } from "@/components/ui/container";
import { Wordmark } from "@/components/brand/wordmark";
import { useTranslation } from "@/lib/i18n/use-translation";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

const HELLO = {
  ar: "مرحباً، أريد الاستفسار عن دعوات Flower & Love",
  fr: "Bonjour, j'aimerais en savoir plus sur les invitations Flower & Love",
  en: "Hello, I'd like to know more about Flower & Love invitations",
};

type FooterLink = { href: string; label: string; external?: boolean };

function Column({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h2 className="type-meta">{title}</h2>
      <ul className="mt-5 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="type-small text-ink-600 transition-colors hover:text-ink-900"
              >
                {link.label}
              </a>
            ) : (
              <Link href={link.href} className="type-small text-ink-600 transition-colors hover:text-ink-900">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Quiet on purpose: paper, one hairline above, the wordmark set large and
 * the links small. It closes the page the way a colophon closes a book.
 */
export function SiteFooter() {
  const { t, locale } = useTranslation();

  return (
    <footer className="border-t border-ink-900/10 bg-background">
      <Container className="py-section-sm">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link href="/" aria-label="Flower & Love" className="inline-block outline-offset-8 focus-visible:outline focus-visible:outline-1 focus-visible:outline-ink-900">
              <Wordmark size="lg" />
            </Link>
            <p className="type-body mt-6 max-w-sm">{t.footer.tagline}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-3 lg:col-span-7">
            <Column
              title={t.footer.productTitle}
              links={[
                { href: "/templates", label: t.nav.templates },
                { href: "/#how-it-works", label: t.nav.howItWorks },
                { href: "/#pricing", label: t.nav.pricing },
                { href: "/#faq", label: t.nav.faq },
              ]}
            />
            <Column
              title={t.footer.legalTitle}
              links={[
                { href: "/privacy", label: t.footer.privacy },
                { href: "/terms", label: t.footer.terms },
              ]}
            />
            <Column
              title={t.footer.contact}
              links={[{ href: buildWhatsAppUrl(HELLO[locale]), label: "WhatsApp", external: true }]}
            />
          </div>
        </div>

        <div className="mt-section-sm flex flex-col gap-2 border-t border-ink-900/10 pt-8 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="type-small text-ink-400">
            © {new Date().getFullYear()} <span lang="en">Flower &amp; Love</span> — {t.footer.rights}
          </p>
          <p className="type-small text-ink-400">{t.footer.madeWith}</p>
        </div>
      </Container>
    </footer>
  );
}
