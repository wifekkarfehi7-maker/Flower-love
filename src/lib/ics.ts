function formatIcsDate(date: string, time?: string | null): string {
  const [y, m, d] = date.split("-");
  const [h = "00", min = "00"] = (time ?? "00:00").split(":");
  return `${y}${m}${d}T${h.padStart(2, "0")}${min.padStart(2, "0")}00`;
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export interface IcsEventInput {
  title: string;
  description?: string;
  location?: string;
  date: string; // YYYY-MM-DD
  startTime?: string | null; // HH:mm
  durationHours?: number;
}

/** Builds a minimal, broadly-compatible .ics calendar file for "add to calendar". */
export function buildIcsContent({ title, description, location, date, startTime, durationHours = 3 }: IcsEventInput): string {
  const dtStart = formatIcsDate(date, startTime);
  const startDate = new Date(`${date}T${startTime ?? "00:00"}:00`);
  const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);
  const dtEnd = `${endDate.getFullYear()}${String(endDate.getMonth() + 1).padStart(2, "0")}${String(
    endDate.getDate()
  ).padStart(2, "0")}T${String(endDate.getHours()).padStart(2, "0")}${String(endDate.getMinutes()).padStart(2, "0")}00`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Flower & Love//Wedding Invitation//AR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@flowerlove`,
    `DTSTAMP:${dtStart}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(title)}`,
    description ? `DESCRIPTION:${escapeIcsText(description)}` : undefined,
    location ? `LOCATION:${escapeIcsText(location)}` : undefined,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}

/** Triggers a browser download of the given event as a .ics file. */
export function downloadIcsEvent(input: IcsEventInput, filename = "wedding-invitation.ics") {
  const content = buildIcsContent(input);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
