# Order & workshop confirmation email setup

Your live Supabase project: **`mpdmdzzjjjqrrwrbrjti`**  
Dashboard: https://supabase.com/dashboard/project/mpdmdzzjjjqrrwrbrjti

## How it worked before

1. Customer pays on checkout → the site calls the **`verify-razorpay-payment`** Edge Function.
2. That function sends email via **`sendTransactionalEmail`** in `_shared/email.ts`.
3. Your project has **`GMAIL_USER`** + **`GMAIL_APP_PASSWORD`** secrets (no `RESEND_API_KEY`), so mail goes through **Gmail SMTP**.
4. Gmail always sends **From** the account in **`GMAIL_USER`**. That was set to **`grumpyngoofy@gmail.com`**, so customers saw that address—even though the website contact copy was updated later.

Secrets are **not stored in git**. They only live in Supabase (or whoever ran `supabase secrets set` when deploying).

## Why you don’t see secret values in the dashboard

Supabase **never shows** secret values in the UI after saving—only names. You can confirm names exist; changing them means **set new values** (overwrite).

## Where to find Edge Functions in the dashboard

1. Open https://supabase.com/dashboard/project/mpdmdzzjjjqrrwrbrjti  
2. Use the **left sidebar** → **Edge Functions** (cloud icon).  
   - If you don’t see it: widen the sidebar or check you’re on the correct project (name/ref `mpdmdzzjjjqrrwrbrjti`).
3. You should see functions such as:
   - `verify-razorpay-payment` (workshop + shop confirmation emails)
   - `create-razorpay-payment` / `create-razorpay-order`
   - `send-contact-email`
   - `resend-template-email`
   - Shiprocket functions

4. **Secrets** (dashboard):
   - **Project Settings** (gear) → **Edge Functions** → **Secrets**  
   - Or: **Edge Functions** → **Secrets** tab (UI varies slightly by Supabase version).

   You should see names like `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `CONTACT_TO_EMAIL`—not the actual passwords.

## Switch sender to goofyngrumpystudio@gmail.com

You need a **Google App Password** for the **new** Gmail account (Google Account → Security → 2-Step Verification → App passwords).

### Option A — Supabase Dashboard

1. Project Settings → Edge Functions → Secrets.  
2. Add or edit:
   - `GMAIL_USER` = `goofyngrumpystudio@gmail.com`
   - `GMAIL_APP_PASSWORD` = *(16-character app password, no spaces)*
   - `CONTACT_TO_EMAIL` = `goofyngrumpystudio@gmail.com` *(studio copies of bookings; optional)*
   - `CONTACT_FROM_EMAIL` = `goofyngrumpystudio@gmail.com` *(optional; used if you add Resend later)*
3. Save. Old `GMAIL_*` values are replaced when you set the same key again.

### Option B — Terminal (linked repo)

From the project root, with [Supabase CLI](https://supabase.com/docs/guides/cli) logged in (`supabase login`):

```bash
cd /path/to/grumpy-n-goofy-pottery-shop
supabase link --project-ref mpdmdzzjjjqrrwrbrjti   # if not already linked

supabase secrets set \
  GMAIL_USER=goofyngrumpystudio@gmail.com \
  GMAIL_APP_PASSWORD=your_app_password_here \
  CONTACT_TO_EMAIL=goofyngrumpystudio@gmail.com \
  CONTACT_FROM_EMAIL=goofyngrumpystudio@gmail.com
```

List secret **names** (not values):

```bash
supabase secrets list
```

### Redeploy functions (after changing secrets)

Secrets apply on the next function run, but deploy the latest code too:

```bash
supabase functions deploy verify-razorpay-payment
supabase functions deploy resend-template-email
supabase functions deploy send-contact-email
```

## Test

1. Place a small test workshop or template order.  
2. Check the confirmation **From** line.  
3. If it fails: Edge Functions → `verify-razorpay-payment` → **Logs** for SMTP errors (wrong app password, etc.).

### Quick SMTP test (contact form function)

From a terminal (uses the public anon key; safe for a one-line test):

```bash
curl -sS -X POST "https://mpdmdzzjjjqrrwrbrjti.supabase.co/functions/v1/send-contact-email" \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"you@example.com","comment":"SMTP test"}'
```

- `{"success":true}` → mail config works; check **goofyngrumpystudio@gmail.com** inbox (and spam).
- `535` / `BadCredentials` → **`GMAIL_APP_PASSWORD` is wrong** for **`GMAIL_USER`**. Changing the Gmail address alone is not enough: create a **new App Password** while signed in as **goofyngrumpystudio@gmail.com**, then run `supabase secrets set GMAIL_APP_PASSWORD=...` again.

## Contact form (separate from order email)

The contact page tries `send-contact-email` first, then **FormSubmit** to `goofyngrumpystudio@gmail.com`. Order confirmations **only** use the Edge Function + Gmail secrets above.
