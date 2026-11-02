import { supabase } from "@/integrations/supabase/client";

export type ContactMessagePayload = {
  name: string;
  email: string;
  subject: string;
  comment: string;
};

async function sendViaFormSubmit(payload: ContactMessagePayload) {
  const response = await fetch("https://formsubmit.co/ajax/goofyngrumpystudio@gmail.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      name: payload.name || "Website Visitor",
      email: payload.email,
      message: payload.comment,
      _subject: payload.subject?.trim()
        ? payload.subject.trim()
        : "New message from Goofy n Grumpy website",
      _template: "table",
    }),
  });

  const data = await response.json().catch(() => ({}));
  const succeeded = data?.success === true || data?.success === "true";
  if (!succeeded) {
    throw new Error(
      typeof data?.message === "string"
        ? data.message
        : "Unable to send your message right now.",
    );
  }
}

async function sendViaEdgeFunction(payload: ContactMessagePayload) {
  const { data, error } = await supabase.functions.invoke("send-contact-email", {
    body: {
      name: payload.name,
      email: payload.email,
      subject: payload.subject,
      comment: payload.comment,
    },
  });

  if (error) {
    throw error;
  }

  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String(data.error));
  }
}

export async function sendContactMessage(payload: ContactMessagePayload) {
  try {
    await sendViaEdgeFunction(payload);
    return;
  } catch (edgeError) {
    try {
      await sendViaFormSubmit(payload);
      return;
    } catch (fallbackError) {
      const edgeMessage =
        edgeError instanceof Error ? edgeError.message : "Edge function failed";
      const fallbackMessage =
        fallbackError instanceof Error
          ? fallbackError.message
          : "Fallback send failed";
      if (fallbackMessage.toLowerCase().includes("activation")) {
        throw new Error(
          "Please check goofyngrumpystudio@gmail.com for a FormSubmit activation email and click the link. Or add Gmail/Resend credentials in Supabase.",
        );
      }
      throw new Error(fallbackMessage || edgeMessage);
    }
  }
}
