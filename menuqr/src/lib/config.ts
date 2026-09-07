export const SITE_NAME = "MenuQR";

/** Public origin, no trailing slash. QR codes, canonical URLs and OG tags use it. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

export const DEFAULT_CURRENCY = "TND";

export const SUPPORT_EMAIL = "contact@menuqr.tn";
