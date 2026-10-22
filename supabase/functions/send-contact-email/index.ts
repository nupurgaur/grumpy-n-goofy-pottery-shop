// Supabase Edge Function: send-contact-email
// Sends contact form submissions to the configured inbox via Resend or Gmail SMTP

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

interface ContactPayload {
  name?: string;
  email: string;
  subject?: string;
  phone?: string;
  comment?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CONTACT_TO = Deno.env.get("CONTACT_TO_EMAIL") || "grumpyngoofy@gmail.com";
const FROM_EMAIL_RAW = Deno.env.get("CONTACT_FROM_EMAIL") || "no-reply@goofyngrumpy.com";
const FROM_EMAIL = FROM_EMAIL_RAW.includes("<")
  ? FROM_EMAIL_RAW
  : `Goofy n Grumpy <${FROM_EMAIL_RAW}>`;
const GMAIL_USER = Deno.env.get("GMAIL_USER");
const GMAIL_APP_PASSWORD = Deno.env.get("GMAIL_APP_PASSWORD");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const payload = (await req.json()) as ContactPayload;

    if (!payload.email?.trim()) {
      return jsonResponse({ error: "Email is required" }, 400);
    }

    const emailSubject = payload.subject?.trim()
      ? `${payload.subject.trim()} — ${payload.name || "Website Visitor"}`
      : `New contact inquiry from ${payload.name || "Website Visitor"}`;
    const lines = [
      `Name: ${payload.name || "-"}`,
      `Email: ${payload.email}`,
      ...(payload.subject?.trim() ? [`Subject: ${payload.subject.trim()}`] : []),
      ...(payload.phone ? [`Phone: ${payload.phone}`] : []),
      "",
      "Message:",
      payload.comment || "-",
    ];
    const text = lines.join("\n");

    const html = `
      <div>
        <h2 style="margin:0 0 8px 0">New contact inquiry</h2>
        <p><strong>Name:</strong> ${escapeHtml(payload.name || "-")}</p>
        <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
        ${payload.subject?.trim() ? `<p><strong>Subject:</strong> ${escapeHtml(payload.subject.trim())}</p>` : ""}
        ${payload.phone ? `<p><strong>Phone:</strong> ${escapeHtml(payload.phone)}</p>` : ""}
        <p style="margin-top:12px"><strong>Message:</strong></p>
        <p style="white-space:pre-wrap">${escapeHtml(payload.comment || "-")}</p>
      </div>
    `;

    if (RESEND_API_KEY) {
      await sendViaResend(emailSubject, text, html);
    } else if (GMAIL_USER && GMAIL_APP_PASSWORD) {
      await sendViaGmail(emailSubject, text);
    } else {
      return jsonResponse(
        {
          error:
            "Email service is not configured. Add RESEND_API_KEY or GMAIL_USER + GMAIL_APP_PASSWORD to Supabase secrets.",
        },
        500,
      );
    }

    return jsonResponse({ success: true }, 200);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ error: message }, 500);
  }
});

async function sendViaResend(subject: string, text: string, html: string) {
  const resendResp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [CONTACT_TO],
      subject,
      text,
      html,
    }),
  });

  if (!resendResp.ok) {
    const errText = await resendResp.text();
    throw new Error(`Failed to send email: ${errText}`);
  }
}

async function sendViaGmail(subject: string, text: string) {
  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: {
        username: GMAIL_USER!,
        password: GMAIL_APP_PASSWORD!,
      },
    },
  });

  try {
    await client.send({
      from: GMAIL_USER!,
      to: CONTACT_TO,
      subject,
      content: text,
      replyTo: GMAIL_USER!,
    });
  } finally {
    await client.close();
  }
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
