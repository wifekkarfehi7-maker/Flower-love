/**
 * Centralized, environment-driven platform configuration.
 * Never hard-code the business WhatsApp number or site URL in components —
 * import them from here so they stay in one place across the app.
 */

/** Business WhatsApp number (digits only, with country code, no "+"). */
export const BUSINESS_WHATSAPP =
  process.env.NEXT_PUBLIC_BUSINESS_WHATSAPP?.replace(/\D/g, "") || "21694409166";

/** Public site URL, no trailing slash — used for share links, QR codes, SEO. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

export const SITE_NAME = "Flower & Love";
