import { z } from "zod";

import type { Dictionary } from "@/lib/i18n/types";

/**
 * Schemas validate the *form* shape (everything a string, as typed), and the
 * mappers in ./mappers.ts turn a validated form into database columns. Keeping
 * zod transform-free means react-hook-form's input and output types match,
 * which keeps every dialog's typing straightforward.
 */
function hasAnyName(values: { name_ar?: string; name_fr?: string; name_en?: string }) {
  return Boolean(values.name_ar?.trim() || values.name_fr?.trim() || values.name_en?.trim());
}

const NUMERIC = /^\d{1,6}([.,]\d{1,3})?$/;

export function menuSchemas(t: Dictionary) {
  const shortText = z.string().trim().max(120, t.validation.maxLength);
  const longText = z.string().trim().max(600, t.validation.maxLength);

  const localized = {
    name_ar: shortText,
    name_fr: shortText,
    name_en: shortText,
    description_ar: longText,
    description_fr: longText,
    description_en: longText,
  };

  const requiredPrice = z
    .string()
    .trim()
    .min(1, t.validation.required)
    .regex(NUMERIC, t.validation.priceInvalid);

  const optionalPrice = z
    .string()
    .trim()
    .refine((value) => value === "" || NUMERIC.test(value), t.validation.priceInvalid);

  const category = z
    .object({
      ...localized,
      image_url: z.string().nullable(),
      is_active: z.boolean(),
    })
    .refine(hasAnyName, { message: t.validation.atLeastOneName, path: ["name_ar"] });

  const product = z
    .object({
      ...localized,
      category_id: z.string(),
      price: requiredPrice,
      compare_at_price: optionalPrice,
      image_url: z.string().nullable(),
      is_available: z.boolean(),
      is_featured: z.boolean(),
    })
    .refine(hasAnyName, { message: t.validation.atLeastOneName, path: ["name_ar"] });

  const optionGroup = z
    .object({
      name_ar: shortText,
      name_fr: shortText,
      name_en: shortText,
      is_required: z.boolean(),
      min_select: z.coerce.number().int().min(0).max(20),
      max_select: z.coerce.number().int().min(1).max(20),
    })
    .refine(hasAnyName, { message: t.validation.atLeastOneName, path: ["name_ar"] })
    .refine((values) => values.min_select <= values.max_select, {
      message: t.validation.required,
      path: ["max_select"],
    });

  const option = z
    .object({
      name_ar: shortText,
      name_fr: shortText,
      name_en: shortText,
      price_delta: z
        .string()
        .trim()
        .refine((value) => value === "" || /^-?\d{1,6}([.,]\d{1,3})?$/.test(value), t.validation.priceInvalid),
      is_available: z.boolean(),
    })
    .refine(hasAnyName, { message: t.validation.atLeastOneName, path: ["name_ar"] });

  const table = z.object({
    name: z.string().trim().min(1, t.validation.required).max(60, t.validation.maxLength),
    identifier: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, t.validation.required)
      .max(39, t.validation.maxLength)
      .regex(/^[a-z0-9][a-z0-9-]*$/, t.validation.slugInvalid),
    zone: z.string().trim().max(40, t.validation.maxLength),
    seats: z
      .string()
      .trim()
      .refine((value) => value === "" || /^\d{1,3}$/.test(value), t.validation.required),
    is_active: z.boolean(),
  });

  return { category, product, optionGroup, option, table };
}

type Schemas = ReturnType<typeof menuSchemas>;
export type CategoryFormValues = z.infer<Schemas["category"]>;
export type ProductFormValues = z.infer<Schemas["product"]>;
export type OptionGroupFormValues = z.infer<Schemas["optionGroup"]>;
export type OptionFormValues = z.infer<Schemas["option"]>;
export type TableFormValues = z.infer<Schemas["table"]>;
