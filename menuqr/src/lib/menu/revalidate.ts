"use client";

/**
 * Fire-and-forget cache purge after a menu change. Failures are deliberately
 * silent: the edit is already saved, and the menu would refresh on its own
 * within the revalidation window anyway.
 */
export function notifyMenuChanged(slug: string) {
  void fetch("/api/menu/revalidate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ slug }),
    keepalive: true,
  }).catch(() => undefined);
}
