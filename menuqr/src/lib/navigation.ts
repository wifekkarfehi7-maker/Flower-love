/**
 * Only ever redirect to our own paths — a `next` parameter is attacker
 * controlled, so anything protocol-relative or absolute is discarded.
 */
export function safeInternalPath(candidate: string | null | undefined, fallback = "/dashboard") {
  if (!candidate) return fallback;
  if (!candidate.startsWith("/")) return fallback;
  if (candidate.startsWith("//")) return fallback;
  if (candidate.includes("://")) return fallback;
  return candidate;
}
