"use client";

import * as React from "react";

import { updateInvitationFields } from "@/lib/invitations/client";
import type { InvitationRow } from "@/types/database";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Debounced, merged autosave for the invitation row's own fields. Multiple
 * `patch()` calls within the delay window are merged into one PATCH so
 * typing doesn't fire a network call per keystroke.
 */
export function useInvitationAutosave(invitationId: string, delay = 900) {
  const pending = React.useRef<Partial<InvitationRow>>({});
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = React.useState<SaveStatus>("idle");

  const flush = React.useCallback(async () => {
    const toSave = pending.current;
    pending.current = {};
    if (Object.keys(toSave).length === 0) return;
    setStatus("saving");
    const result = await updateInvitationFields(invitationId, toSave);
    setStatus(result.error ? "error" : "saved");
  }, [invitationId]);

  const patch = React.useCallback(
    (fields: Partial<InvitationRow>) => {
      pending.current = { ...pending.current, ...fields };
      setStatus("idle");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [flush, delay]
  );

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return { patch, status, flushNow: flush };
}
