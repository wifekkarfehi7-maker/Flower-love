import type { Metadata, Viewport } from "next";
import {
  Amiri,
  Cairo,
  Cinzel,
  Cormorant_Garamond,
  Inter,
  Noto_Kufi_Arabic,
  Noto_Naskh_Arabic,
  Pinyon_Script,
  Playfair_Display,
} from "next/font/google";
import Script from "next/script";

import "./globals.css";
import { LanguageProvider, NO_FLASH_LOCALE_SCRIPT } from "@/lib/i18n/provider";
import { AuthProvider } from "@/lib/auth/provider";
import { getCurrentUserAndProfile } from "@/lib/auth/get-current-user";
import { SITE_NAME, SITE_URL } from "@/lib/config";

const playfair = Playfair_Display({
  // No metric fallback: next/font's fallback face is local("Times New Roman")
  // with no unicode-range, and on Windows it carries Arabic — so it would
  // draw every Arabic glyph before the stack reached Amiri or Naskh.
  adjustFontFallback: false,
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

/* Invitation typography: editorial serif, Roman display caps, copperplate script,
   and two Arabic faces (Naskh for reading, Kufi for display). */
const cormorant = Cormorant_Garamond({
  // No metric fallback: next/font's fallback face is local("Times New Roman")
  // with no unicode-range, and on Windows it carries Arabic — so it would
  // draw every Arabic glyph before the stack reached Amiri or Naskh.
  adjustFontFallback: false,
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const cinzel = Cinzel({
  // No metric fallback: next/font's fallback face is local("Times New Roman")
  // with no unicode-range, and on Windows it carries Arabic — so it would
  // draw every Arabic glyph before the stack reached Amiri or Naskh.
  adjustFontFallback: false,
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-cinzel",
  display: "swap",
});

const pinyon = Pinyon_Script({
  // No metric fallback: next/font's fallback face is local("Times New Roman")
  // with no unicode-range, and on Windows it carries Arabic — so it would
  // draw every Arabic glyph before the stack reached Amiri or Naskh.
  adjustFontFallback: false,
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-pinyon",
  display: "swap",
});

const notoNaskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-naskh",
  display: "swap",
});

const notoKufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "600"],
  variable: "--font-kufi",
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getCurrentUserAndProfile();

  return (
    /*
     * The font variables live on <html>, the same element that declares the
     * aliases in globals.css (--font-heading: var(--font-cormorant) …). A
     * custom property resolves where it is declared: with these on <body>,
     * every alias on :root was invalid and the whole site fell through to
     * the operating system's default font.
     */
    <html lang="ar" dir="rtl" suppressHydrationWarning className={`${playfair.variable} ${inter.variable} ${amiri.variable} ${cairo.variable} ${cormorant.variable} ${cinzel.variable} ${pinyon.variable} ${notoNaskh.variable} ${notoKufi.variable}`}>
      <head>
        <Script id="no-flash-locale" strategy="beforeInteractive">
          {NO_FLASH_LOCALE_SCRIPT}
        </Script>
      </head>
      <body
        className="font-body"
        suppressHydrationWarning
      >
        <LanguageProvider>
          <AuthProvider initialUser={user} initialProfile={profile}>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
