import {
  createGoogleCalendarEvent,
  isGoogleCalendarConfigured,
  shopOrderFulfillmentEventTimes,
  workshopSlotToEventTimes,
} from "./googleCalendar.ts";
import { isWorkshopCartItem, resolveWorkshopBookingFromCartLine } from "./workshop.ts";
import type { WorkshopBookingRecord } from "./workshopParticipants.ts";

type OrderDetails = {
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address?: string;
  total_amount: number;
};

type CartLine = {
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  workshop_booking?: WorkshopBookingRecord;
};

export async function syncOrderToGoogleCalendar(params: {
  orderId: string;
  orderDetails: OrderDetails;
  cartItems: CartLine[];
  isWorkshopOrder: boolean;
  isTemplateOrder: boolean;
}): Promise<void> {
  if (!isGoogleCalendarConfigured()) {
    console.log("Google Calendar sync skipped (not configured)");
    return;
  }

  const { orderId, orderDetails, cartItems, isWorkshopOrder, isTemplateOrder } = params;

  if (isTemplateOrder) {
    await createGoogleCalendarEvent({
      summary: `Template order — ${orderDetails.customer_name}`,
      description: [
        `Order ID: ${orderId}`,
        `Customer: ${orderDetails.customer_name}`,
        `Email: ${orderDetails.customer_email}`,
        `Total: ₹${orderDetails.total_amount.toLocaleString("en-IN")}`,
        "",
        "Digital template — no studio session.",
      ].join("\n"),
      ...shopOrderFulfillmentEventTimes(),
    });
    return;
  }

  if (isWorkshopOrder) {
    for (const item of cartItems) {
      if (!isWorkshopCartItem(item)) continue;

      const booking = resolveWorkshopBookingFromCartLine(item);
      if (!booking) {
        console.warn("Calendar sync: missing workshop booking for line", item.product_name);
        continue;
      }

      const times = workshopSlotToEventTimes(booking.sessionDate, booking.slot);
      if (!times) {
        console.warn("Calendar sync: unknown slot", booking.slot);
        continue;
      }

      const participants = (item.workshop_booking?.participants ?? booking.participants ?? []) as Array<{
        name: string;
        age: number;
      }>;
      const participantLines = participants
        .map((p) => `• ${p.name} (${p.age})`)
        .join("\n");

      await createGoogleCalendarEvent({
        summary: `Workshop — ${item.product_name}`,
        description: [
          `Order ID: ${orderId}`,
          `Customer: ${orderDetails.customer_name}`,
          `Email: ${orderDetails.customer_email}`,
          `Phone: ${orderDetails.customer_phone || "—"}`,
          `Tickets: ${item.quantity}`,
          "",
          participantLines ? `Participants:\n${participantLines}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        start: times.start,
        end: times.end,
      });
    }
    return;
  }

  const itemLines = cartItems.map((item) => {
    const lineTotal = item.product_price * item.quantity;
    return `• ${item.product_name} × ${item.quantity} — ₹${lineTotal.toLocaleString("en-IN")}`;
  });

  await createGoogleCalendarEvent({
    summary: `Shop order — ${orderDetails.customer_name}`,
    description: [
      `Order ID: ${orderId}`,
      `Customer: ${orderDetails.customer_name}`,
      `Email: ${orderDetails.customer_email}`,
      `Phone: ${orderDetails.customer_phone || "—"}`,
      "",
      "Items:",
      ...itemLines,
      "",
      `Total: ₹${orderDetails.total_amount.toLocaleString("en-IN")}`,
      "",
      "Ship to:",
      orderDetails.shipping_address || "—",
    ].join("\n"),
    ...shopOrderFulfillmentEventTimes(),
  });
}
