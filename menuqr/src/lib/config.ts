export const SITE_NAME = "MenuQR";

/**
 * Public origin, no trailing slash. QR codes, canonical URLs and OG tags use it.
 *
 * A variable that exists but holds an empty string is the normal shape of a
 * half-filled deployment form, and `??` does not catch it: it only replaces
 * null and undefined, so "" would flow through to `new URL("")` and fail the
 * production build with a bare "TypeError: Invalid URL" pointing at a compiled
 * chunk. Treat blank as absent, and reject a value that is present but not a
 * URL loudly enough to say which variable is wrong — falling back silently
 * there would ship QR codes pointing at localhost, which is worse than a
 * failed build.
 */
function resolveSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return "http://localhost:3000";

  try {
    new URL(configured);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SITE_URL is not a valid URL: ${JSON.stringify(configured)}. ` +
        'Set it to the public origin including the scheme, for example "https://menuqr.vercel.app", or leave it unset.'
    );
  }

  return configured.replace(/\/+$/, "");
}

export const SITE_URL = resolveSiteUrl();

export const DEFAULT_CURRENCY = "TND";

export const SUPPORT_EMAIL = "contact@menuqr.tn";
