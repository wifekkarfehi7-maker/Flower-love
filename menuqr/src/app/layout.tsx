import type { Metadata, Viewport } from "next";
import { Cairo, Inter } from "next/font/google";
import Script from "next/script";

import "./globals.css";
import { Providers } from "./providers";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { SITE_NAME, SITE_URL } from "@/lib/config";
import { NO_FLASH_LOCALE_SCRIPT } from "@/lib/i18n/provider";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-latin",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-arabic",
  display: "swap",
});

const DESCRIPTION =
  "منيو رقمي برمز QR للمطاعم والمقاهي في تونس — بالعربية والفرنسية والإنجليزية، مع إحصائيات وطاولات ورموز QR ثابتة.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — منيو رقمي برمز QR للمطاعم والمقاهي`,
    template: `%s — ${SITE_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — منيو رقمي برمز QR`,
    description: DESCRIPTION,
    locale: "ar_TN",
    alternateLocale: ["fr_TN", "en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — منيو رقمي برمز QR`,
    description: DESCRIPTION,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentUser();

  return (
    <html lang="ar-TN" dir="rtl" suppressHydrationWarning>
      <head>
        <Script id="no-flash-locale" strategy="beforeInteractive">
          {NO_FLASH_LOCALE_SCRIPT}
        </Script>
      </head>
      <body className={`${inter.variable} ${cairo.variable} font-sans`} suppressHydrationWarning>
        <Providers user={user} profile={profile} initialLocale={profile?.preferred_language}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
