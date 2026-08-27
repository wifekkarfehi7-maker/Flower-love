import { BUSINESS_WHATSAPP } from "./config";

/**
 * Builds a wa.me deep link with a URL-encoded, pre-filled message.
 * Defaults to the platform's business WhatsApp number; pass `phone` to
 * target a specific customer number instead (e.g. from an admin dashboard).
 */
export function buildWhatsAppUrl(message: string, phone: string = BUSINESS_WHATSAPP): string {
  const digitsOnly = phone.replace(/\D/g, "");
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}

/**
 * Structured order message template — used once real orders exist
 * (Phase 7) to notify the business with real invitation/order data.
 */
export interface OrderWhatsAppMessageInput {
  customerName: string;
  customerWhatsapp: string;
  invitationName: string;
  invitationId: string;
  planName: string;
  price: string;
  currency?: string;
  previewUrl: string;
}

export function buildOrderMessage({
  customerName,
  customerWhatsapp,
  invitationName,
  invitationId,
  planName,
  price,
  currency = "TND",
  previewUrl,
}: OrderWhatsAppMessageInput): string {
  return [
    "مرحباً، أرغب في تفعيل دعوة زفافي.",
    "",
    `الاسم: ${customerName}`,
    `واتساب: ${customerWhatsapp}`,
    `الدعوة: ${invitationName}`,
    `رقم الدعوة: ${invitationId}`,
    `الباقة: ${planName}`,
    `السعر: ${price} ${currency}`,
    "",
    "معاينة الدعوة:",
    previewUrl,
  ].join("\n");
}
