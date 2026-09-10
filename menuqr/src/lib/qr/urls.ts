import { SITE_URL } from "@/lib/config";

/**
 * A printed QR must survive every later edit, so it encodes only the venue
 * slug and an opaque table token — never prices, product ids or anything else
 * that changes. Regenerating a token is the one deliberate way to retire a
 * printed card.
 */
export function menuUrl(slug: string) {
  return `${SITE_URL}/menu/${slug}`;
}

export function qrTargetUrl(slug: string, token: string | null) {
  return token ? `${menuUrl(slug)}?t=${encodeURIComponent(token)}` : menuUrl(slug);
}

export const QR_TOKEN_PARAM = "t";
export const TABLE_PARAM = "table";
