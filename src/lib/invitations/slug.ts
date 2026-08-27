/**
 * Builds a URL-safe slug candidate for `/invite/[slug]` from the couple's
 * names. Falls back to a random code when the names have no Latin
 * characters (e.g. Arabic-only names) — a slug is just an identifier, it
 * doesn't need to be readable. Always appends a short random suffix since
 * `invitations.slug` is unique and first-name collisions are common.
 */
export function buildSlugCandidate(groomName: string | null, brideName: string | null): string {
  const base = `${groomName ?? ""}-${brideName ?? ""}`
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const suffix = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${suffix}` : `invitation-${suffix}`;
}
