# Google Calendar sync for orders & workshops

When a customer completes checkout, **`verify-razorpay-payment`** can create events on your Google Calendar (with popup reminders **1 day** and **1 hour** before).

| Order type | Calendar event |
|------------|----------------|
| **Workshop** | One event per booking at the real session time (12–2, 3–5, or 6–8 slot) |
| **Shop (physical)** | Next day **10:00–10:30 AM IST** — “Pack / fulfill order” reminder |
| **Template** | Same next-day 10:00 slot — “Template order” reminder |

Events include customer name, email, phone, order ID, and line details.

---

## Choose one auth method

### Option A — OAuth refresh token (recommended for `goofyngrumpystudio@gmail.com`)

1. [Google Cloud Console](https://console.cloud.google.com/) → create/select a project.
2. **APIs & Services → Enable APIs** → enable **Google Calendar API**.
3. **OAuth consent screen** → External → add **goofyngrumpystudio@gmail.com** as a test user (while app is in **Testing**).
4. **APIs & Services → Credentials → Create credentials → OAuth client ID** → type **Desktop app** (name e.g. `Goofy n Grumpy Calendar`).
5. **Copy Client ID and Client secret from the Cloud Console — not from OAuth Playground.**

   | Where | What you see |
   |--------|----------------|
   | [Credentials list](https://console.cloud.google.com/apis/credentials) | Click your **OAuth 2.0 Client ID** name |
   | Client ID | Always visible (ends with `.apps.googleusercontent.com`) |
   | Client secret | Shown **only when created**. If missing, click **Add secret** or create a **new** OAuth client and copy the secret immediately |

   OAuth Playground **masks** the Client ID in the UI after you save it — that is normal. Keep the ID/secret in a notes file from step 5; Playground does not reveal them again.

6. Open [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
   - Click the **gear** (OAuth 2.0 configuration).
   - Check **Use your own OAuth credentials**.
   - Paste the **same** Client ID and Client secret from step 5.
   - Close the gear panel.
   - **Step 1:** find or paste scope `https://www.googleapis.com/auth/calendar` → **Authorize APIs** (sign in as **goofyngrumpystudio@gmail.com**).
   - **Step 2:** **Exchange authorization code for tokens** → copy the **Refresh token** (starts with `1//`).

7. Set **all three** Supabase secrets in **one** command (no quotes, no spaces in the secret values):

```bash
supabase secrets set \
  GOOGLE_CALENDAR_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com \
  GOOGLE_CALENDAR_CLIENT_SECRET=GOCSPX-xxxxxxxx \
  GOOGLE_CALENDAR_REFRESH_TOKEN=1//xxxxxxxx \
  GOOGLE_CALENDAR_ID=primary
```

Use your real values. `GOOGLE_CALENDAR_ID=primary` is the main calendar on that Google account.

#### Fix: `The provided client secret is invalid`

This almost always means **Client ID and Client secret are not a matching pair** from Google Cloud:

- Secret is from a **different** OAuth client than the ID.
- You pasted the **refresh token** into `GOOGLE_CALENDAR_CLIENT_SECRET` by mistake.
- Client secret was **rotated** in Cloud Console but Supabase still has the old one.
- Playground was used **without** “Use your own OAuth credentials” (Playground’s built-in client ≠ your Supabase secrets).

**Fix:**

1. Cloud Console → **Credentials** → open your **Desktop app** OAuth client.
2. Copy **Client ID** again. Create/copy a **current** **Client secret** (`GOCSPX-...`).
3. Playground → gear → **Use your own OAuth credentials** → paste that ID + secret → authorize again → get a **new refresh token**.
4. Run `supabase secrets set` with all three values together (step 7 above).
5. Place a test order — no redeploy needed for secret changes.

**Important:** A refresh token is tied to the OAuth client that issued it. If you create a **new** OAuth client or new secret, you must generate a **new** refresh token in Playground using that same client.

#### Fix: `unauthorized_client` / `Unauthorized` on refresh

The refresh token in Supabase was **not** created with the same Client ID that is in `GOOGLE_CALENDAR_CLIENT_ID` (very common if OAuth Playground’s gear was **off** when you clicked Authorize).

**Fix:**

1. [Credentials](https://console.cloud.google.com/apis/credentials) → your **Web** OAuth client → **Authorized redirect URIs** → add `https://developers.google.com/oauthplayground` → Save.
2. [OAuth Playground](https://developers.google.com/oauthplayground/) → **gear** → ✅ **Use your own OAuth credentials** → paste Client ID + secret from that same Web client.
3. Step 1 scope: `https://www.googleapis.com/auth/calendar` → **Authorize** (as goofyngrumpystudio@gmail.com).
4. Step 2 → **Exchange authorization code for tokens** → copy **Refresh token**.
5. `supabase secrets set GOOGLE_CALENDAR_REFRESH_TOKEN='...'` (or set all three together again).

**Verify:** call the health check (no order needed):

```bash
curl -s "https://mpdmdzzjjjqrrwrbrjti.supabase.co/functions/v1/google-calendar-health" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY"
```

You want `"ok": true` and a `testEventId` in the JSON.

`GOOGLE_CALENDAR_ID=primary` is the main calendar on that Google account.

### Option B — Service account (shared calendar)

1. Enable **Google Calendar API** (same as above).
2. **Credentials → Service account** → create → **Keys → Add key → JSON**.
3. In [Google Calendar](https://calendar.google.com/) → **Settings → Share with specific people** → add the service account email (`...@....iam.gserviceaccount.com`) with **Make changes to events**.
4. Copy the calendar ID from calendar settings (or use `primary` only if using a dedicated calendar owned by the SA — usually you share *your* calendar with the SA).
5. Secrets:

```bash
supabase secrets set \
  GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL=...@....iam.gserviceaccount.com \
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n' \
  GOOGLE_CALENDAR_ID=your_calendar_id_or_primary
```

Use `\n` for line breaks in the private key when setting via CLI.

---

## Deploy

```bash
supabase functions deploy verify-razorpay-payment
```

## Test

1. Place a test workshop or shop order.
2. Open Google Calendar for **goofyngrumpystudio@gmail.com** (or the shared calendar).
3. If nothing appears: Supabase → Edge Functions → **verify-razorpay-payment** → **Logs** → look for `Google Calendar sync failed`.

Calendar sync **does not block** checkout — orders still confirm if Calendar fails.
