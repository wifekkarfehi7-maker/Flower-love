import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase avec la clé service_role : il contourne le RLS.
 * À n'utiliser que côté serveur, et uniquement pour des écritures qu'on a
 * validées nous-mêmes — typiquement la création d'une commande par un
 * client attablé, qui n'a pas de compte et ne doit pas pouvoir écrire
 * directement en base.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY manquante : impossible d'enregistrer une commande.",
    );
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
