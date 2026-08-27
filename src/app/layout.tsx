import type { Metadata, Viewport } from "next";
import { Amiri, Cairo, Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";

import "./globals.css";
import { LanguageProvider, NO_FLASH_LOCALE_SCRIPT } from "@/lib/i18n/provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SITE_NAME, SITE_URL } from "@/lib/config";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — دعوات زفاف رقمية فاخرة`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    "اصنع دعوة زفافك الرقمية في دقائق. اختر تصميمك، أضف معلوماتك وصورك، وشارك أجمل لحظاتك مع أحبائك.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — دعوات زفاف رقمية فاخرة`,
    description:
      "اصنع دعوة زفافك الرقمية في دقائق. اختر تصميمك، أضف معلوماتك وصورك، وشارك أجمل لحظاتك مع أحبائك.",
    locale: "ar_TN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — دعوات زفاف رقمية فاخرة`,
    description: "اصنع دعوة زفافك الرقمية في دقائق.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0a09",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <Script id="no-flash-locale" strategy="beforeInteractive">
          {NO_FLASH_LOCALE_SCRIPT}
        </Script>
      </head>
      <body
        className={`${playfair.variable} ${inter.variable} ${amiri.variable} ${cairo.variable} font-body`}
        suppressHydrationWarning
      >
        <LanguageProvider>
          <div className="flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
