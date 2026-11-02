import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  createGoogleCalendarEvent,
  isGoogleCalendarConfigured,
  shopOrderFulfillmentEventTimes,
} from "../_shared/googleCalendar.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const configured = isGoogleCalendarConfigured();
  if (!configured) {
    return json({ ok: false, step: "config", error: "Google Calendar secrets not set" }, 200);
  }

  const clientId = Deno.env.get("GOOGLE_CALENDAR_CLIENT_ID")?.trim();
  const clientSecret = Deno.env.get("GOOGLE_CALENDAR_CLIENT_SECRET")?.trim();
  const refreshToken = Deno.env.get("GOOGLE_CALENDAR_REFRESH_TOKEN")?.trim();
  const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID")?.trim() || "primary";

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId ?? "",
        client_secret: clientSecret ?? "",
        refresh_token: refreshToken ?? "",
        grant_type: "refresh_token",
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) {
      return json({
        ok: false,
        step: "refresh_token",
        httpStatus: tokenResponse.status,
        google: tokenData,
        hints: refreshTokenHints(tokenData),
      }, 200);
    }

    const accessToken = tokenData.access_token as string;
    const tokenInfoResponse = await fetch(
      `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    );
    const tokenInfo = await tokenInfoResponse.json();

    const scope = String(tokenInfo.scope ?? "");
    const hasCalendarWrite =
      scope.includes("https://www.googleapis.com/auth/calendar.events") ||
      scope.includes("https://www.googleapis.com/auth/calendar");

    let testEventId: string | null = null;
    let testEventError: unknown = null;
    if (hasCalendarWrite) {
      try {
        const times = shopOrderFulfillmentEventTimes();
        testEventId = await createGoogleCalendarEvent({
          summary: "Goofy n Grumpy — calendar test (safe to delete)",
          description: "Diagnostic test event from google-calendar-health. You can delete this.",
          start: times.start,
          end: times.end,
        });
      } catch (error) {
        testEventError = error instanceof Error ? error.message : String(error);
      }
    } else {
      testEventError =
        "Token missing calendar scope. Re-authorize with https://www.googleapis.com/auth/calendar.events or https://www.googleapis.com/auth/calendar";
    }

    return json({
      ok: Boolean(testEventId) && !testEventError,
      step: "complete",
      calendarId,
      tokenScopes: scope || null,
      tokenEmail: tokenInfo.email ?? null,
      testEventId,
      testEventError,
      hints: testEventId
        ? null
        : [
            "OAuth Playground Step 1 scope: https://www.googleapis.com/auth/calendar.events (or full calendar)",
            "Then Step 2 → new refresh token → supabase secrets set GOOGLE_CALENDAR_REFRESH_TOKEN=...",
          ],
    }, 200);
  } catch (error) {
    return json({
      ok: false,
      step: "exception",
      error: error instanceof Error ? error.message : String(error),
    }, 200);
  }
});

function refreshTokenHints(google: Record<string, unknown>): string[] {
  const err = String(google.error ?? "");
  const hints: string[] = [];
  if (err === "invalid_grant") {
    hints.push("Refresh token expired or revoked — generate a new one in OAuth Playground.");
    hints.push("Use gear → “Use your own OAuth credentials” with the same Client ID/secret as Supabase.");
    hints.push("Web OAuth client: add redirect URI https://developers.google.com/oauthplayground");
  }
  if (err === "unauthorized_client") {
    hints.push(
      "This refresh token was NOT issued for the Client ID in Supabase (Playground used a different OAuth client).",
    );
    hints.push(
      "Fix: OAuth Playground → gear → check “Use your own OAuth credentials” → paste the SAME Client ID + secret as Supabase → Authorize again → new refresh token.",
    );
    hints.push(
      "Web client: Credentials → your OAuth client → Authorized redirect URIs must include https://developers.google.com/oauthplayground",
    );
  }
  if (/invalid_client|unauthorized/i.test(err + String(google.error_description ?? ""))) {
    hints.push("Client ID and Client secret must match one OAuth client in Google Cloud Console.");
  }
  return hints;
}

function calendarAccessHints(status: number, body: string): string[] {
  const hints: string[] = [];
  if (status === 401 || status === 403 || /Unauthorized/i.test(body)) {
    hints.push("Enable Google Calendar API for this Cloud project.");
    hints.push("Re-authorize OAuth Playground with scope https://www.googleapis.com/auth/calendar");
    hints.push("Add goofyngrumpystudio@gmail.com as a Test user on the OAuth consent screen.");
  }
  return hints;
}

function json(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
