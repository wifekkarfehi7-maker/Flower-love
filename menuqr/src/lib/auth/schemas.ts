import { z } from "zod";

import type { Dictionary } from "@/lib/i18n/types";

/**
 * Schemas are built from the active dictionary so validation messages are in
 * the user's own language instead of English-only zod defaults.
 */
export function authSchemas(t: Dictionary) {
  const email = z.string().trim().min(1, t.validation.required).email(t.validation.invalidEmail);
  const password = z.string().min(8, t.validation.passwordMin).max(72, t.validation.maxLength);

  const login = z.object({
    email,
    password: z.string().min(1, t.validation.required),
  });

  const register = z
    .object({
      fullName: z.string().trim().min(2, t.validation.nameMin).max(80, t.validation.nameMax),
      email,
      password,
      confirmPassword: z.string(),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: t.validation.passwordMismatch,
      path: ["confirmPassword"],
    });

  const forgotPassword = z.object({ email });

  const resetPassword = z
    .object({ password, confirmPassword: z.string() })
    .refine((values) => values.password === values.confirmPassword, {
      message: t.validation.passwordMismatch,
      path: ["confirmPassword"],
    });

  return { login, register, forgotPassword, resetPassword };
}

export type LoginValues = z.infer<ReturnType<typeof authSchemas>["login"]>;
export type RegisterValues = z.infer<ReturnType<typeof authSchemas>["register"]>;
export type ForgotPasswordValues = z.infer<ReturnType<typeof authSchemas>["forgotPassword"]>;
export type ResetPasswordValues = z.infer<ReturnType<typeof authSchemas>["resetPassword"]>;
