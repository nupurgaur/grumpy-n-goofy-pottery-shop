// Supabase Edge Function: send-contact-email
// Sends contact form submissions to the configured inbox via Resend API

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface ContactPayload {
  name?: string;
  email: string;
  phone?: string;
  comment?: string;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const CONTACT_TO = Deno.env.get("CONTACT_TO_EMAIL") || "grumpyngoofy@gmail.com";
const FROM_EMAIL_RAW = Deno.env.get("CONTACT_FROM_EMAIL") || "no-reply@goofyngrumpy.com";
const FROM_EMAIL = FROM_EMAIL_RAW.includes("<")
  ? FROM_EMAIL_RAW
  : `Goofy n Grumpy <${FROM_EMAIL_RAW}>`;

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const payload = (await req.json()) as ContactPayload;

    if (!payload.email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const subject = `New contact inquiry from ${payload.name || "Website Visitor"}`;
    const lines = [
      `Name: ${payload.name || "-"}`,
      `Email: ${payload.email}`,
      `Phone: ${payload.phone || "-"}`,
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
        <p><strong>Phone:</strong> ${escapeHtml(payload.phone || "-")}</p>
        <p style="margin-top:12px"><strong>Message:</strong></p>
        <p style="white-space:pre-wrap">${escapeHtml(payload.comment || "-")}</p>
      </div>
    `;

    const resendResp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
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
      return new Response(JSON.stringify({ error: "Failed to send email", details: errText }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }

    const data = await resendResp.json();
    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e?.message || "Unknown error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
});

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


