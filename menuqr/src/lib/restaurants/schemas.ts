import { z } from "zod";

import { locales } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/types";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const SLUG = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/;

/**
 * Transform-free like the menu schemas: forms hold strings, and the submit
 * handlers convert empty strings to NULL columns.
 */
export function restaurantSchemas(t: Dictionary) {
  const optionalText = (max = 400) => z.string().trim().max(max, t.validation.maxLength);

  const optionalUrl = z
    .string()
    .trim()
    .max(300, t.validation.maxLength)
    .refine((value) => value === "" || /^https?:\/\/\S+$/.test(value), t.validation.invalidUrl);

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
      .max(120, t.validation.maxLength)
      .refine((value) => value === "" || z.string().email().safeParse(value).success, t.validation.invalidEmail),
    address: optionalText(200),
    google_maps_url: optionalUrl,
    facebook: optionalUrl,
    instagram: optionalUrl,
    tiktok: optionalUrl,
    website: optionalUrl,
  });

  const account = z.object({
    full_name: z.string().trim().min(2, t.validation.nameMin).max(80, t.validation.nameMax),
    phone: optionalText(30),
  });

  return { create, general, branding, contact, account };
}

type Schemas = ReturnType<typeof restaurantSchemas>;
export type CreateRestaurantValues = z.infer<Schemas["create"]>;
export type RestaurantGeneralValues = z.infer<Schemas["general"]>;
export type RestaurantBrandingValues = z.infer<Schemas["branding"]>;
export type RestaurantContactValues = z.infer<Schemas["contact"]>;
export type AccountValues = z.infer<Schemas["account"]>;

