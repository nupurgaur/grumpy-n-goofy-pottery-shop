import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

/** Default From address for order & workshop confirmation emails */
export const STUDIO_SENDER_EMAIL = "goofyngrumpystudio@gmail.com";

export type SendEmailParams = {
  to: string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export function formatStudioFromAddress(email: string): string {
  return email.includes("<") ? email : `Goofy n Grumpy <${email}>`;
}

function getFromEmail(): string {
  const fromEmailRaw = Deno.env.get("CONTACT_FROM_EMAIL") || STUDIO_SENDER_EMAIL;
  return formatStudioFromAddress(fromEmailRaw);
}

function getGmailAppPassword(): string | undefined {
  const raw = Deno.env.get("GMAIL_APP_PASSWORD");
  if (!raw) return undefined;
  return raw.replace(/\s+/g, "");
}

function getGmailFromAddress(): string {
  return Deno.env.get("GMAIL_USER") || STUDIO_SENDER_EMAIL;
}

function formatSmtpError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (/535|5\.7\.8|BadCredentials|Username and Password not accepted/i.test(message)) {
    return new Error(
      "Gmail SMTP login failed. Generate a new Google App Password for GMAIL_USER and update the GMAIL_APP_PASSWORD secret in Supabase (2-Step Verification required).",
    );
  }
  return error instanceof Error ? error : new Error(message);
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
  const gmailAppPassword = getGmailAppPassword();

  if (!gmailUser || !gmailAppPassword) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD not configured");
  }

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: {
        username: gmailUser.trim(),
        password: gmailAppPassword,
      },
    },
  });

  try {
    await client.send({
      from: formatStudioFromAddress(gmailUser.trim()),
      to: params.to.join(", "),
      subject: params.subject,
      content: params.text,
      html: params.html,
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    });
  } catch (error) {
    throw formatSmtpError(error);
  } finally {
    await client.close();
  }
}

export async function sendTransactionalEmail(params: SendEmailParams): Promise<void> {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const gmailUser = Deno.env.get("GMAIL_USER")?.trim();
  const gmailAppPassword = getGmailAppPassword();

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
