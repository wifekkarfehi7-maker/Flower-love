import type { Dictionary } from "@/lib/i18n/types";

/**
 * Supabase auth errors arrive as English strings. Map the ones users actually
 * hit to translated copy, and never surface a raw backend message.
 */
export function translateAuthError(message: string | undefined, t: Dictionary) {
  if (!message) return t.auth.genericError;
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) return t.auth.invalidCredentials;
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return t.auth.emailTaken;
  }
  if (normalized.includes("email not confirmed")) return t.auth.emailNotConfirmed;
  if (normalized.includes("password should be") || normalized.includes("weak password")) return t.auth.weakPassword;
  if (normalized.includes("rate limit") || normalized.includes("too many")) return t.auth.rateLimited;
  if (normalized.includes("failed to fetch") || normalized.includes("network")) return t.errors.networkError;

  return t.auth.genericError;
}

/** Plan-limit errors are raised by database triggers as PLAN_LIMIT_<AREA>:<n>. */
export function translatePlanLimitError(message: string | undefined, t: Dictionary) {
  if (!message) return null;
  if (message.includes("PLAN_LIMIT_CATEGORIES")) return t.categories.limitReached;
  if (message.includes("PLAN_LIMIT_PRODUCTS")) return t.products.limitReached;
  if (message.includes("PLAN_LIMIT_TABLES")) return t.tables.limitReached;
  if (message.includes("PLAN_LIMIT_MEMBERS")) return t.subscription.contactToUpgrade;
  return null;
}

export function translateDataError(message: string | undefined, t: Dictionary) {
  const planLimit = translatePlanLimitError(message, t);
  if (planLimit) return planLimit;
  if (!message) return t.errors.saveFailed;

  const normalized = message.toLowerCase();
  if (normalized.includes("duplicate key") && normalized.includes("slug")) return t.onboarding.slugTaken;
  if (normalized.includes("duplicate key")) return t.errors.saveFailed;
  if (normalized.includes("failed to fetch") || normalized.includes("network")) return t.errors.networkError;
  if (normalized.includes("row-level security") || normalized.includes("insufficient")) return t.errors.forbiddenText;

  return t.errors.saveFailed;
}
