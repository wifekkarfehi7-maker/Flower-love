import { z } from "zod";

import type { Dictionary } from "@/lib/i18n/types";

/**
 * Each field either passes or fails with a translation key (not a hard-coded
 * English message) so the same schema drives error copy in ar/fr/en.
 */
function issue(ctx: z.RefinementCtx, path: (string | number)[], key: keyof Dictionary["auth"]) {
  ctx.addIssue({ code: z.ZodIssueCode.custom, path, params: { key } });
}

const emailField = z
  .string()
  .trim()
  .superRefine((val, ctx) => {
    if (!val) return issue(ctx, [], "errorRequiredField");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return issue(ctx, [], "errorInvalidEmail");
  });

const passwordField = z.string().superRefine((val, ctx) => {
  if (!val) return issue(ctx, [], "errorRequiredField");
  if (val.length < 8) return issue(ctx, [], "errorWeakPassword");
});

const requiredText = (min = 1) =>
  z.string().trim().superRefine((val, ctx) => {
    if (val.length < min) issue(ctx, [], "errorRequiredField");
  });

const whatsappLocalField = z.string().trim().superRefine((val, ctx) => {
  if (!val) return issue(ctx, [], "errorRequiredField");
  if (!/^[0-9]{6,12}$/.test(val)) return issue(ctx, [], "errorWhatsappInvalid");
});

export const registerSchema = z
  .object({
    fullName: requiredText(2),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
    whatsappDialCode: z.string().min(1),
    whatsappLocal: whatsappLocalField,
    country: requiredText(1),
    preferredLanguage: z.enum(["ar", "fr", "en"]),
    agreeTerms: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      issue(ctx, ["confirmPassword"], "errorPasswordMismatch");
    }
    if (!data.agreeTerms) {
      issue(ctx, ["agreeTerms"], "errorMustAgreeTerms");
    }
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailField,
  password: z.string().superRefine((val, ctx) => {
    if (!val) issue(ctx, [], "errorRequiredField");
  }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const completeProfileSchema = z.object({
  fullName: requiredText(2),
  whatsappDialCode: z.string().min(1),
  whatsappLocal: whatsappLocalField,
  country: requiredText(1),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      issue(ctx, ["confirmPassword"], "errorPasswordMismatch");
    }
  });

/** Flattens ZodError issues into `{ fieldPath: translationKey }` for form display. */
export function fieldErrorsFromZod(error: z.ZodError): Record<string, keyof Dictionary["auth"]> {
  const result: Record<string, keyof Dictionary["auth"]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_form";
    const key =
      issue.code === z.ZodIssueCode.custom
        ? ((issue.params as { key?: keyof Dictionary["auth"] } | undefined)?.key ?? "errorGeneric")
        : "errorGeneric";
    result[path] = key;
  }
  return result;
}
