// Supabase Edge Function: send-contact-email
// Sends contact form submissions to the configured inbox via Resend or Gmail SMTP

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import {
  getStudioNotificationEmail,
  sendTransactionalEmail,
} from "../_shared/email.ts";

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

    const contactTo = getStudioNotificationEmail();
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

    await sendTransactionalEmail({
      to: [contactTo],
      subject: emailSubject,
      text,
      html,
      replyTo: payload.email.trim(),
    });

    return jsonResponse({ success: true }, 200);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    console.error("send-contact-email failed:", message);
    return jsonResponse({ error: message }, 500);
  }
});

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
