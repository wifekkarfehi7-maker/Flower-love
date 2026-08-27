import type { Dictionary } from "@/lib/i18n/types";

/** Maps Supabase Auth's English error messages to a translation key. */
export function mapAuthErrorToKey(message: string | undefined): keyof Dictionary["auth"] {
  const msg = (message ?? "").toLowerCase();

  if (msg.includes("invalid login credentials")) return "errorInvalidCredentials";
  if (msg.includes("already registered") || msg.includes("already exists")) return "errorEmailInUse";
  if (msg.includes("password") && (msg.includes("least") || msg.includes("weak") || msg.includes("short"))) {
    return "errorWeakPassword";
  }
  if (msg.includes("email") && msg.includes("invalid")) return "errorInvalidEmail";

  return "errorGeneric";
}
