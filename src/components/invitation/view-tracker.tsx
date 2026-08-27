"use client";

import * as React from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/** Fires the view-count RPC once per page load. Renders nothing. */
export function ViewTracker({ invitationId }: { invitationId: string }) {
  const fired = React.useRef(false);

  React.useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const supabase = getSupabaseBrowserClient();
    supabase?.rpc("increment_invitation_views", { target_id: invitationId });
  }, [invitationId]);

  return null;
}
