import type { PricingPlanRecord } from "@/types/invitation";

/**
 * Static mirror of `supabase/seed.sql`'s pricing_plans. Used as a fallback so
 * pricing is always visible even before a Supabase project is connected —
 * public pricing data isn't sensitive, so it's safe to ship a copy here.
 * Keep this in sync with the seed file.
 */
export const STATIC_PRICING_PLANS: PricingPlanRecord[] = [
  {
    id: "static-free",
    slug: "free",
    name: "Free",
    nameAr: "مجانية",
    price: 0,
    currency: "TND",
    period: "trial",
    description: "Try the platform and explore what it can do.",
    features: ["Limited templates", "Limited pages", "Watermark", "Draft only (no publishing)"],
    isWatermarked: true,
    sortOrder: 1,
  },
  {
    id: "static-standard",
    slug: "standard",
    name: "Standard",
    nameAr: "أساسية",
    price: 89,
    currency: "TND",
    period: "per_invitation",
    description: "A complete invitation, ready to publish and share.",
    features: ["All templates", "All pages", "No watermark", "Publish and share your invitation"],
    isWatermarked: false,
    sortOrder: 2,
  },
  {
    id: "static-premium",
    slug: "premium",
    name: "Premium",
    nameAr: "مميزة",
    price: 149,
    currency: "TND",
    period: "per_invitation",
    description: "A complete luxury experience with advanced features.",
    features: [
      "Everything in Standard",
      "Custom invitation URL",
      "RSVP confirmation",
      "Detailed analytics",
      "Background music",
      "Invitation QR code",
      "Advanced customization",
    ],
    isWatermarked: false,
    sortOrder: 3,
  },
];
