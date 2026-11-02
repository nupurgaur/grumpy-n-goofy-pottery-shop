const STUDIO_TIMEZONE = "Asia/Kolkata";
const STUDIO_ADDRESS =
  "H. No. 436, Roza Yakubpur, Greater Noida West, Noida - 201009";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

type CalendarEventTime = {
  dateTime: string;
  timeZone: string;
};

export type CreateCalendarEventInput = {
  summary: string;
  description: string;
  start: CalendarEventTime;
  end: CalendarEventTime;
  location?: string;
};

export function isGoogleCalendarConfigured(): boolean {
  if (Deno.env.get("GOOGLE_CALENDAR_REFRESH_TOKEN")) {
    return Boolean(
      Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID") &&
        Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET"),
    );
  }
  return Boolean(
    Deno.env.get("GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL") &&
      Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY"),
  );
}

function getCalendarId(): string {
  return Deno.env.get("GOOGLE_CALENDAR_ID")?.trim() || "primary";
}

export function normalizeWorkshopSlot(slot: string): string {
  return slot.replace(/\u2013|\u2014/g, "–").replace(/\s+/g, " ").trim();
}

function parseClock12(hour: number, minute: number, meridiem: string): { hour: number; minute: number } {
  let h = hour % 12;
  if (meridiem.toUpperCase() === "PM") h += 12;
  return { hour: h, minute };
}

/** Parse slots like `12:00 PM – 2:00 PM` into IST datetimes for Calendar API. */
export function workshopSlotToEventTimes(
  sessionDate: string,
  slot: string,
): { start: CalendarEventTime; end: CalendarEventTime } | null {
  const normalized = normalizeWorkshopSlot(slot);
  const match = normalized.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)\s*–\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i,
  );
  if (!match) return null;

  const startClock = parseClock12(Number(match[1]), Number(match[2]), match[3]);
  const endClock = parseClock12(Number(match[4]), Number(match[5]), match[6]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const start: CalendarEventTime = {
    dateTime: `${sessionDate}T${pad(startClock.hour)}:${pad(startClock.minute)}:00`,
    timeZone: STUDIO_TIMEZONE,
  };
  const end: CalendarEventTime = {
    dateTime: `${sessionDate}T${pad(endClock.hour)}:${pad(endClock.minute)}:00`,
    timeZone: STUDIO_TIMEZONE,
  };
  return { start, end };
}

function pemPrivateKey(raw: string): string {
  return raw.replace(/\\n/g, "\n");
}

async function importPkcs8PrivateKey(pem: string): Promise<CryptoKey> {
  const cleaned = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    binary,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function base64UrlEncode(data: Uint8Array): string {
  let str = btoa(String.fromCharCode(...data));
  return str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function createServiceAccountJwt(clientEmail: string, privateKeyPem: string): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: clientEmail,
    scope: CALENDAR_SCOPE,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const headerPart = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const payloadPart = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const unsigned = `${headerPart}.${payloadPart}`;

  const key = await importPkcs8PrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(unsigned),
  );
  return `${unsigned}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function getAccessTokenViaServiceAccount(): Promise<string> {
  const clientEmail = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL")?.trim();
  const privateKeyRaw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
  if (!clientEmail || !privateKeyRaw) {
    throw new Error("Service account credentials missing");
  }

  const assertion = await createServiceAccountJwt(clientEmail, pemPrivateKey(privateKeyRaw));
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Service account token failed");
  }
  return data.access_token as string;
}

async function getAccessTokenViaRefreshToken(): Promise<string> {
  const clientId = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")?.trim();
  const clientSecret = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")?.trim();
  const refreshToken = Deno.env.get("GOOGLE_CALENDAR_REFRESH_TOKEN")?.trim();
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("OAuth refresh credentials missing");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.access_token) {
    const msg = data.error_description || data.error || "Refresh token failed";
    const detail = JSON.stringify(data);
    if (/invalid_client|client secret is invalid/i.test(String(msg))) {
      throw new Error(
        `${msg} — Use Client ID and Client secret from the same OAuth client in Google Cloud Console (Credentials). Regenerate refresh token in OAuth Playground with “Use your own OAuth credentials”. See supabase/GOOGLE_CALENDAR_SETUP.md`,
      );
    }
    if (/invalid_grant|unauthorized|Unauthorized/i.test(String(msg) + detail)) {
      throw new Error(
        `${msg} (${detail}) — Generate a new refresh token: OAuth Playground → gear → your Client ID/secret → scope https://www.googleapis.com/auth/calendar → Authorize as goofyngrumpystudio@gmail.com → Exchange code. Web client must allow redirect https://developers.google.com/oauthplayground`,
      );
    }
    throw new Error(`${msg} (${detail})`);
  }
  return data.access_token as string;
}

async function getGoogleAccessToken(): Promise<string> {
  if (Deno.env.get("GOOGLE_CALENDAR_REFRESH_TOKEN")) {
    return getAccessTokenViaRefreshToken();
  }
  return getAccessTokenViaServiceAccount();
}

export async function createGoogleCalendarEvent(
  input: CreateCalendarEventInput,
): Promise<string | null> {
  if (!isGoogleCalendarConfigured()) {
    return null;
  }

  const accessToken = await getGoogleAccessToken();
  const calendarId = encodeURIComponent(getCalendarId());

  const body = {
    summary: input.summary,
    description: input.description,
    location: input.location ?? STUDIO_ADDRESS,
    start: input.start,
    end: input.end,
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 24 * 60 },
        { method: "popup", minutes: 60 },
      ],
    },
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  const data = await response.json();
  if (!response.ok) {
    const message = data.error?.message || data.error?.status || "Failed to create calendar event";
    const reason = data.error?.errors?.[0]?.reason;
    if (response.status === 401 || response.status === 403 || message === "Unauthorized") {
      throw new Error(
        `${message}${reason ? ` (${reason})` : ""} — Enable Google Calendar API, re-issue refresh token with scope https://www.googleapis.com/auth/calendar, and add your Gmail as OAuth test user.`,
      );
    }
    throw new Error(message);
  }

  return typeof data.id === "string" ? data.id : null;
}

/** Next calendar day 10:00–10:30 IST — packing reminder for shop orders. */
export function shopOrderFulfillmentEventTimes(
  reference = new Date(),
): { start: CalendarEventTime; end: CalendarEventTime } {
  const istDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: STUDIO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(reference);

  const [y, m, d] = istDate.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const nextDate = next.toISOString().slice(0, 10);

  return {
    start: { dateTime: `${nextDate}T10:00:00`, timeZone: STUDIO_TIMEZONE },
    end: { dateTime: `${nextDate}T10:30:00`, timeZone: STUDIO_TIMEZONE },
  };
}

export { STUDIO_ADDRESS, STUDIO_TIMEZONE };
