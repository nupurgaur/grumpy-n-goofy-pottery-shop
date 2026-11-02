import { parseISO } from "date-fns";

const SLOT_START_HOUR: Record<string, { hour: number; minute: number; durationHours: number }> = {
  "12:00 PM – 2:00 PM": { hour: 12, minute: 0, durationHours: 2 },
  "3:00 PM – 5:00 PM": { hour: 15, minute: 0, durationHours: 2 },
  "6:00 PM – 8:00 PM": { hour: 18, minute: 0, durationHours: 2 },
};

function formatGoogleCalendarUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Build a Google Calendar "create event" URL (opens in browser; no API key required). */
export function buildGoogleCalendarCreateUrl(params: {
  title: string;
  sessionDate: string;
  slot: string;
  details?: string;
  location?: string;
}): string | null {
  const slotMeta = SLOT_START_HOUR[params.slot];
  if (!slotMeta) return null;

  const [y, m, d] = params.sessionDate.split("-").map(Number);
  const start = new Date(
    Date.UTC(y, m - 1, d, slotMeta.hour - 5, slotMeta.minute - 30),
  );
  const end = new Date(start.getTime() + slotMeta.durationHours * 60 * 60 * 1000);

  const search = new URLSearchParams({
    action: "TEMPLATE",
    text: params.title,
    dates: `${formatGoogleCalendarUtc(start)}/${formatGoogleCalendarUtc(end)}`,
  });

  if (params.details) search.set("details", params.details);
  if (params.location) search.set("location", params.location);

  return `https://calendar.google.com/calendar/render?${search.toString()}`;
}

export function slotLabelForDate(sessionDate: string, slot: string): string {
  const day = parseISO(sessionDate);
  return `${day.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })} · ${slot}`;
}
