import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const DIGITAL_FULFILLMENT_STATUSES = ["template_delivered", "workshop_confirmed"] as const;

type DigitalFulfillmentStatus = (typeof DIGITAL_FULFILLMENT_STATUSES)[number];

export async function finalizeDigitalOrderStatus(
  supabase: SupabaseClient,
  orderId: string,
  status: DigitalFulfillmentStatus,
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ fulfillment_status: status })
    .eq("id", orderId);

  if (!error) {
    return;
  }

  console.error(`Could not set fulfillment status to ${status}:`, error);

  // Fallback for databases that have not applied the digital-status migration yet.
  if (status === "template_delivered" || status === "workshop_confirmed") {
    const { error: fallbackError } = await supabase
      .from("orders")
      .update({ fulfillment_status: "delivered" })
      .eq("id", orderId);

    if (fallbackError) {
      console.error("Could not set fallback fulfillment status:", fallbackError);
    }
  }
}
