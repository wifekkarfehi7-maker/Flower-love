import { z } from "zod";

import type { Dictionary } from "@/lib/i18n/types";
import { locales } from "@/lib/i18n/config";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const SLUG = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

export function restaurantSchemas(t: Dictionary) {
  const optionalText = (max = 400) =>
    z
      .string()
      .trim()
      .max(max, t.validation.maxLength)
      .optional()
      .transform((value) => (value ? value : null));

  const optionalUrl = z
    .string()
    .trim()
    .max(300, t.validation.maxLength)
    .optional()
    .refine((value) => !value || /^https?:\/\/\S+$/.test(value), t.validation.invalidUrl)
    .transform((value) => (value ? value : null));

  const slug = z
    .string()
    .trim()
    .toLowerCase()
    .min(3, t.validation.slugMin)
    .max(60, t.validation.maxLength)
    .regex(SLUG, t.validation.slugInvalid);

  const create = z.object({
    name: z.string().trim().min(2, t.validation.nameMin).max(80, t.validation.nameMax),
    slug,
    restaurant_type: z.string().trim().max(40).optional(),
    default_language: z.enum(locales),
  });

  const general = z.object({
    name: z.string().trim().min(2, t.validation.nameMin).max(80, t.validation.nameMax),
    slug,
    restaurant_type: optionalText(40),
    name_ar: optionalText(80),
    name_fr: optionalText(80),
    name_en: optionalText(80),
    description_ar: optionalText(600),
    description_fr: optionalText(600),
    description_en: optionalText(600),
    default_language: z.enum(locales),
    available_languages: z.array(z.enum(locales)).min(1, t.validation.required),
    currency: z.string().trim().min(2).max(8),
    is_published: z.boolean(),
  });

  const branding = z.object({
    logo_url: z.string().nullable(),
    cover_url: z.string().nullable(),
    primary_color: z.string().regex(HEX_COLOR, t.validation.invalidColor),
    secondary_color: z.string().regex(HEX_COLOR, t.validation.invalidColor),
    theme: z.enum(["classic", "modern", "elegant", "minimal", "dark", "coffee", "restaurant"]),
  });

  const contact = z.object({
    phone: optionalText(30),
    email: z
      .string()
      .trim()
      .max(120)
      .optional()
      .refine((value) => !value || z.string().email().safeParse(value).success, t.validation.invalidEmail)
      .transform((value) => (value ? value : null)),
    address: optionalText(200),
    google_maps_url: optionalUrl,
    facebook: optionalUrl,
    instagram: optionalUrl,
    tiktok: optionalUrl,
    website: optionalUrl,
  });

  return { create, general, branding, contact, slug };
}

export type CreateRestaurantValues = z.infer<ReturnType<typeof restaurantSchemas>["create"]>;
export type RestaurantGeneralValues = z.infer<ReturnType<typeof restaurantSchemas>["general"]>;
export type RestaurantBrandingValues = z.infer<ReturnType<typeof restaurantSchemas>["branding"]>;
export type RestaurantContactValues = z.infer<ReturnType<typeof restaurantSchemas>["contact"]>;

export interface OpeningHoursEntry {
  day: number;
  open: string;
  close: string;
  closed: boolean;
}

export const DEFAULT_OPENING_HOURS: OpeningHoursEntry[] = Array.from({ length: 7 }, (_, day) => ({
  day,
  open: "08:00",
  close: "23:00",
  closed: false,
}));

export interface SocialLinks {
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  website?: string | null;
}
