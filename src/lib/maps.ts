/** Builds a Google Maps search link from a venue name — used whenever the
 * user only entered a venue name without pasting a direct Maps URL. */
export function buildMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Resolves the best available maps link for an event: an explicit pasted URL, or a search-by-name fallback. */
export function resolveLocationUrl(event: { locationUrl?: string | null; locationName?: string | null }): string | null {
  if (event.locationUrl) return event.locationUrl;
  if (event.locationName) return buildMapsSearchUrl(event.locationName);
  return null;
}
