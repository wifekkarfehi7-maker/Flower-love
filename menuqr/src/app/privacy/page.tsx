import type { Metadata } from "next";

import { LegalPage } from "@/components/marketing/legal-page";
import { SITE_URL } from "@/lib/config";
import { defaultLocale } from "@/lib/i18n/config";
import { PRIVACY } from "@/lib/legal/content";

export const metadata: Metadata = {
  title: PRIVACY[defaultLocale].title,
  description: PRIVACY[defaultLocale].intro,
  alternates: { canonical: `${SITE_URL}/privacy` },
};

export default function PrivacyPage() {
  return <LegalPage document="privacy" />;
}
