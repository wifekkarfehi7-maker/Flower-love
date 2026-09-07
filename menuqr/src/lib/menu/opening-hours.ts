import type { JsonValue } from "@/types/database";

// A type alias, not an interface: these rows are written straight into a jsonb
// column, and only aliases satisfy the JSON index-signature constraint.
export type OpeningHoursEntry = {
  day: number;
  open: string;
  close: string;
  closed: boolean;
};

export const DEFAULT_OPENING_HOURS: OpeningHoursEntry[] = Array.from({ length: 7 }, (_, day) => ({
  day,
  open: "08:00",
  close: "23:00",
  closed: false,
}));

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseOpeningHours(value: JsonValue | null | undefined): OpeningHoursEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return null;
      const record = entry as Record<string, JsonValue>;
      const day = Number(record.day);
      const open = typeof record.open === "string" && TIME.test(record.open) ? record.open : "08:00";
      const close = typeof record.close === "string" && TIME.test(record.close) ? record.close : "23:00";
      if (!Number.isInteger(day) || day < 0 || day > 6) return null;
      return { day, open, close, closed: record.closed === true };
    })
    .filter((entry): entry is OpeningHoursEntry => entry !== null)
    .sort((a, b) => a.day - b.day);
}

function toMinutes(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

/**
 * Returns null when a venue hasn't configured hours — the menu then shows no
 * open/closed badge rather than guessing. Ranges that run past midnight
 * (a café closing at 00:30) are handled by rolling into the next day.
 */
export function isOpenNow(hours: OpeningHoursEntry[], now = new Date()): boolean | null {
  if (hours.length === 0) return null;

  const minutes = now.getHours() * 60 + now.getMinutes();
  const today = hours.find((entry) => entry.day === now.getDay());
  const yesterday = hours.find((entry) => entry.day === (now.getDay() + 6) % 7);

  if (today && !today.closed) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (close > open && minutes >= open && minutes < close) return true;
    if (close <= open && minutes >= open) return true;
  }

  if (yesterday && !yesterday.closed) {
    const open = toMinutes(yesterday.open);
    const close = toMinutes(yesterday.close);
    if (close <= open && minutes < close) return true;
  }

  return false;
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  website?: string;
}

export function parseSocialLinks(value: JsonValue | null | undefined): SocialLinks {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  const record = value as Record<string, JsonValue>;
  const pick = (key: keyof SocialLinks) => {
    const candidate = record[key];
    return typeof candidate === "string" && /^https?:\/\/\S+$/.test(candidate) ? candidate : undefined;
  };

  return {
    facebook: pick("facebook"),
    instagram: pick("instagram"),
    tiktok: pick("tiktok"),
    website: pick("website"),
  };
}
