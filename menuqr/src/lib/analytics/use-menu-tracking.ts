"use client";

import { useSearchParams } from "next/navigation";
import * as React from "react";

import type { Locale } from "@/lib/i18n/config";
import { QR_TOKEN_PARAM, TABLE_PARAM } from "@/lib/qr/urls";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getVisitorSession } from "./session";

interface TrackingState {
  tableName: string | null;
}

/**
 * Runs entirely in the browser so the menu page itself stays cacheable: it
 * resolves the scanned QR token to a table, records one de-duplicated view,
 * and reports product/category interest. Every write goes through a
 * SECURITY DEFINER RPC that validates the venue is public and rate-limits the
 * session — the browser cannot insert analytics rows directly.
 */
export function useMenuTracking(restaurantId: string, locale: Locale) {
  const searchParams = useSearchParams();
  const token = searchParams.get(QR_TOKEN_PARAM);
  const tableIdentifier = searchParams.get(TABLE_PARAM);
  const [state, setState] = React.useState<TrackingState>({ tableName: null });
  const tracked = React.useRef(false);

  React.useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;

    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      const session = getVisitorSession();
      let tableId: string | null = null;
      let qrCodeId: string | null = null;

      if (token) {
        const { data } = await supabase.rpc("resolve_qr_token", {
          p_slug: window.location.pathname.split("/").filter(Boolean).pop() ?? "",
          p_token: token,
        });
        const resolved = data?.[0];
        if (resolved) {
          tableId = resolved.table_id;
          qrCodeId = resolved.qr_code_id;
          if (resolved.table_name) setState({ tableName: resolved.table_name });
        }
      } else if (tableIdentifier) {
        const { data } = await supabase
          .from("restaurant_tables")
          .select("id, name")
          .eq("restaurant_id", restaurantId)
          .eq("identifier", tableIdentifier)
          .maybeSingle();
        if (data) {
          tableId = data.id;
          setState({ tableName: data.name });
        }
      }

      await supabase.rpc("track_menu_view", {
        p_restaurant: restaurantId,
        p_session: session,
        p_table: tableId,
        p_qr: qrCodeId,
        p_locale: locale,
        p_source: token || tableIdentifier ? "qr" : "direct",
      });
    };

    void run();
  }, [restaurantId, locale, token, tableIdentifier]);

  const trackInteraction = React.useCallback(
    (kind: "product" | "category", targetId: string) => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      void supabase.rpc("track_menu_interaction", {
        p_restaurant: restaurantId,
        p_session: getVisitorSession(),
        p_kind: kind,
        p_target: targetId,
      });
    },
    [restaurantId]
  );

  return { tableName: state.tableName, trackInteraction };
}
