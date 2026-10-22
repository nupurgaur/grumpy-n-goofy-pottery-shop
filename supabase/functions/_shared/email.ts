import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

export type SendEmailParams = {
  to: string[];
  subject: string;
  text: string;
  html?: string;
};

function getFromEmail(): string {
  const fromEmailRaw = Deno.env.get("CONTACT_FROM_EMAIL") || "no-reply@goofyngrumpy.com";
  return fromEmailRaw.includes("<") ? fromEmailRaw : `Goofy n Grumpy <${fromEmailRaw}>`;
}

function getGmailFromAddress(): string {
  return Deno.env.get("GMAIL_USER") || "grumpyngoofy@gmail.com";
}

async function sendViaResend(params: SendEmailParams): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromEmail(),
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
}

async function sendViaGmail(params: SendEmailParams): Promise<void> {
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

  if (!gmailUser || !gmailAppPassword) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD not configured");
  }

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: {
        username: gmailUser,
        password: gmailAppPassword,
      },
    },
  });

  try {
    await client.send({
      from: gmailUser,
      to: params.to.join(", "),
      subject: params.subject,
      content: params.text,
      html: params.html,
    });
  } finally {
    await client.close();
  }
}

export async function sendTransactionalEmail(params: SendEmailParams): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const gmailUser = Deno.env.get("GMAIL_USER");
  const gmailAppPassword = Deno.env.get("GMAIL_APP_PASSWORD");

  if (resendApiKey) {
    try {
      await sendViaResend(params);
      return;
    } catch (resendError) {
      const resendMessage = resendError instanceof Error ? resendError.message : String(resendError);
      if (gmailUser && gmailAppPassword) {
        console.warn("Resend failed, falling back to Gmail SMTP:", resendMessage);
        await sendViaGmail(params);
        return;
      }
      throw new Error(`Failed to send email via Resend: ${resendMessage}`);
    }
  }

  if (gmailUser && gmailAppPassword) {
    await sendViaGmail(params);
    return;
  }

  throw new Error(
    "Email service is not configured. Add RESEND_API_KEY or GMAIL_USER + GMAIL_APP_PASSWORD to Supabase secrets.",
  );
}

export function getStudioNotificationEmail(): string {
  return Deno.env.get("CONTACT_TO_EMAIL") || getGmailFromAddress();
}
