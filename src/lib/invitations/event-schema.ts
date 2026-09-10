import type { InvitationData } from "@/types/invitation";

/** Tunisia sits on UTC+01:00 all year — it dropped DST in 2009. */
const TUNISIA_OFFSET = "+01:00";

function isoStart(date: string, time: string | null): string {
  const t = time && /^\d{2}:\d{2}/.test(time) ? time.slice(0, 5) : "00:00";
  return `${date}T${t}:00${TUNISIA_OFFSET}`;
}

/**
 * schema.org Event describing the wedding, so a shared link renders as a real
 * event card rather than a bare URL. Kept to fields we actually hold — an
 * invented address would be worse than an absent one.
 */
export function buildEventSchema(data: InvitationData, url: string, description: string) {
  if (!data.weddingDate) return null;

  const names = `${data.groomName} & ${data.brideName}`;
  const venue = data.events.find((e) => e.locationName)?.locationName;
  const image = data.coverImageUrl ?? data.gallery[0]?.url;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${names} — حفل زفاف`,
    startDate: isoStart(data.weddingDate, data.weddingTime),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    description,
    url,
    ...(image ? { image: [image] } : {}),
    ...(venue ? { location: { "@type": "Place", name: venue } } : {}),
    organizer: { "@type": "Person", name: names },
  };
}

/**
 * Guest-supplied names land inside a <script> block, so close out any literal
 * "</script>" before it can end the element early.
 */
export function serializeJsonLd(schema: object): string {
  return JSON.stringify(schema).replace(/</g, "\\u003c");
}
