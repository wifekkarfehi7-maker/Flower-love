"use client";

import { randomToken } from "@/lib/utils";

const SESSION_KEY = "menuqr-session";

/**
 * A random per-browser string used only to de-duplicate view counts. It is not
 * an identity: no IP, no fingerprint, nothing that ties back to a person, and
 * it never leaves the visitor's own browser except as this opaque value.
 */
export function getVisitorSession(): string {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing && existing.length >= 8 && existing.length <= 64) return existing;
    const created = randomToken(20);
    window.localStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    // Private mode: fall back to a per-page-load value. Counts still work,
    // they just can't be de-duplicated across reloads.
    return randomToken(20);
  }
}
