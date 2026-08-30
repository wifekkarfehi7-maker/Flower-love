"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Écoute les changements sur `orders` pour cet établissement et redemande le
 * rendu serveur à chaque événement. On ne recopie pas la logique de chargement
 * côté client : le serveur reste la seule source des commandes (et du RLS).
 */
export default function CommandesLive({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [connecte, setConnecte] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let canal: ReturnType<typeof supabase.channel> | undefined;
    let annule = false;

    (async () => {
      // La session vit dans les cookies et n'est pas encore chargée au premier
      // rendu. Sans ce jeton, la websocket s'authentifie en anonyme et le RLS
      // masque toutes les commandes : on s'abonne « avec succès » sans jamais
      // rien recevoir.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (annule) return;
      if (session) await supabase.realtime.setAuth(session.access_token);

      canal = supabase
        .channel(`commandes-${tenantId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `tenant_id=eq.${tenantId}`,
          },
          () => router.refresh(),
        )
        .subscribe((statut) => setConnecte(statut === "SUBSCRIBED"));
    })();

    return () => {
      annule = true;
      if (canal) supabase.removeChannel(canal);
    };
  }, [tenantId, router]);

  return (
    <span className="flex items-center gap-2 text-sm text-navy/60">
      <span
        className={`size-2 rounded-full ${connecte ? "bg-gold" : "bg-navy/30"}`}
        aria-hidden
      />
      {connecte ? "En direct" : "Connexion…"}
    </span>
  );
}
