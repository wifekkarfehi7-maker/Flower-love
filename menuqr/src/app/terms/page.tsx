import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { SITE_URL } from "@/lib/config";
import { defaultLocale } from "@/lib/i18n/config";
import { TERMS } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: TERMS[defaultLocale].title,
  description: TERMS[defaultLocale].intro,
  alternates: { canonical: `${SITE_URL}/terms` },
};

export default function TermsPage() {
  return <LegalPage document="terms" />;
}
