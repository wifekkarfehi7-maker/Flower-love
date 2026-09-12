"use client";

import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { SITE_NAME, SUPPORT_EMAIL, SUPPORT_WHATSAPP, whatsappLink } from "@/lib/config";
import { useTranslation } from "@/lib/i18n/provider";

export function SiteFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">{t.landing.footerTagline}</p>
        </div>

        <div>
          <h2 className="text-sm font-semibold">{t.landing.footerProduct}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <a href="#features" className="hover:text-foreground">
                {t.nav.features}
              </a>
            </li>
            <li>
              <a href="#pricing" className="hover:text-foreground">
                {t.nav.pricing}
              </a>
            </li>
            <li>
              <a href="#faq" className="hover:text-foreground">
                {t.nav.faq}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-semibold">{t.landing.footerLegal}</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href="/privacy" className="hover:text-foreground">
                {t.landing.footerPrivacy}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-foreground">
                {t.landing.footerTerms}
              </Link>
            </li>
            <li>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-foreground" dir="ltr">
                {SUPPORT_EMAIL}
              </a>
            </li>
            <li>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
                dir="ltr"
              >
                {`+${SUPPORT_WHATSAPP}`}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">
        © {year} {SITE_NAME}. {t.landing.footerRights}
      </div>
    </footer>
  );
}
