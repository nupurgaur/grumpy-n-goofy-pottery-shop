import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getStudioNotificationEmail, sendTransactionalEmail } from "../_shared/email.ts";
import { syncOrderToGoogleCalendar } from "../_shared/orderCalendarSync.ts";
import { finalizeDigitalOrderStatus } from "../_shared/orderStatus.ts";
import {
  isWorkshopCartItem,
  resolveOrderItemProductId,
  resolveWorkshopBookingFromCartLine,
} from "../_shared/workshop.ts";
import {
  getRequiredParticipantCount,
  getWorkshopAddonTotal,
  validateWorkshopBooking,
  validateWorkshopBookingPolicy,
  type WorkshopBookingRecord,
} from "../_shared/workshopParticipants.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

const WORKSHOP_CART_ID_MIN = 9900000;
const WORKSHOP_CART_ID_MAX = 9999999;
const CUSTOM_POT_PRODUCT_ID = 9999;

async function hmacSha256Hex(key: string, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(data));
  const bytes = new Uint8Array(signature);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function isWorkshopItem(item: { product_id: number; product_name?: string }) {
  return isWorkshopCartItem(item);
}

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function sendWorkshopEmails(
  orderDetails: {
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    total_amount: number;
  },
  orderId: string,
  cartItems: Array<{
    product_name: string;
    product_price: number;
    quantity: number;
    workshop_booking?: {
      participants?: Array<{ name: string; age: number }>;
      addOns?: Array<{ id: string; label: string; price: number }>;
    };
  }>,
) {
  const contactTo = getStudioNotificationEmail();

  const bookingLines = cartItems.map((item) => {
    const lineTotal = item.product_price * item.quantity + getWorkshopAddonTotal(item.workshop_booking);
    const participantDetails = (item.workshop_booking?.participants ?? [])
      .map((participant) => `${participant.name} (${participant.age})`)
      .join(", ");
    const baseLine = `• ${item.product_name} — ₹${lineTotal.toLocaleString('en-IN')} (${item.quantity} ticket${item.quantity === 1 ? '' : 's'})`;
    return participantDetails ? `${baseLine}\n  Participants: ${participantDetails}` : baseLine;
  });

  const text = [
    `Hi ${orderDetails.customer_name},`,
    '',
    'Your workshop booking at Goofy n Grumpy is confirmed!',
    '',
    `Order ID: ${orderId}`,
    '',
    'Bookings:',
    ...bookingLines,
    '',
    `Total paid: ₹${orderDetails.total_amount.toLocaleString('en-IN')}`,
    '',
    `Phone: ${orderDetails.customer_phone || '—'}`,
    '',
    'Please arrive a few minutes before your session. We look forward to creating with you!',
    '',
    '— Goofy n Grumpy Studio',
  ].join('\n');

  const htmlBookings = bookingLines
    .map((line) => `<li style="margin-bottom:6px">${escapeHtml(line.replace(/^• /, ''))}</li>`)
    .join('');

  const html = `
    <div style="font-family:sans-serif;max-width:560px">
      <h2 style="color:#0D2B52;margin:0 0 12px">Workshop booking confirmed</h2>
      <p>Hi ${escapeHtml(orderDetails.customer_name)},</p>
      <p>Your workshop booking at Goofy n Grumpy is confirmed. Here are your details:</p>
      <p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
      <ul style="padding-left:18px">${htmlBookings}</ul>
      <p><strong>Total paid:</strong> ₹${orderDetails.total_amount.toLocaleString('en-IN')}</p>
      <p><strong>Phone:</strong> ${escapeHtml(orderDetails.customer_phone || '—')}</p>
      <p style="margin-top:16px">Please arrive a few minutes before your session. We look forward to creating with you!</p>
      <p style="color:#888;font-size:12px">— Goofy n Grumpy Studio</p>
    </div>
  `;

  await sendTransactionalEmail({
    to: [orderDetails.customer_email],
    subject: 'Your Goofy n Grumpy workshop booking is confirmed',
    text,
    html,
  });

  const studioText = [
    'New workshop booking received',
    '',
    `Order ID: ${orderId}`,
    `Customer: ${orderDetails.customer_name}`,
    `Email: ${orderDetails.customer_email}`,
    `Phone: ${orderDetails.customer_phone || '—'}`,
    '',
    'Bookings:',
    ...bookingLines,
    '',
    `Total: ₹${orderDetails.total_amount.toLocaleString('en-IN')}`,
  ].join('\n');

  await sendTransactionalEmail({
    to: [contactTo],
    subject: `New workshop booking — ${orderDetails.customer_name}`,
    text: studioText,
  });
}

async function sendTemplateEmails(
  orderDetails: {
    customer_name: string;
    customer_email: string;
    total_amount: number;
  },
  orderId: string,
  templateItems: Array<{
    product_name: string;
    template_pdf_url: string;
  }>,
): Promise<void> {
  if (templateItems.length === 0) {
    throw new Error('No template PDF links found for this order');
  }

  const contactTo = getStudioNotificationEmail();

  const downloadLines = templateItems.map(
    (item) => `• ${item.product_name}: ${item.template_pdf_url}`,
  );

  const text = [
    `Hi ${orderDetails.customer_name},`,
    '',
    'Thank you for your purchase from Goofy n Grumpy!',
    '',
    `Order ID: ${orderId}`,
    '',
    'Your template PDF download links:',
    ...downloadLines,
    '',
    `Total paid: ₹${orderDetails.total_amount.toLocaleString('en-IN')}`,
    '',
    'Save these links — they are your personal download links for the templates you purchased.',
    '',
    '— Goofy n Grumpy Studio',
  ].join('\n');

  const htmlDownloads = templateItems
    .map(
      (item) =>
        `<li style="margin-bottom:10px"><strong>${escapeHtml(item.product_name)}</strong><br/><a href="${escapeHtml(item.template_pdf_url)}">Download PDF</a></li>`,
    )
    .join('');

  const html = `
    <div style="font-family:sans-serif;max-width:560px">
      <h2 style="color:#0D2B52;margin:0 0 12px">Your template download is ready</h2>
      <p>Hi ${escapeHtml(orderDetails.customer_name)},</p>
      <p>Thank you for your purchase! Here are your template PDF download links:</p>
      <p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
      <ul style="padding-left:18px">${htmlDownloads}</ul>
      <p><strong>Total paid:</strong> ₹${orderDetails.total_amount.toLocaleString('en-IN')}</p>
      <p style="margin-top:16px">Save these links for future access to your templates.</p>
      <p style="color:#888;font-size:12px">— Goofy n Grumpy Studio</p>
    </div>
  `;

  await sendTransactionalEmail({
    to: [orderDetails.customer_email],
    subject: 'Your Goofy n Grumpy template download',
    text,
    html,
  });

  await sendTransactionalEmail({
    to: [contactTo],
    subject: `New template purchase — ${orderDetails.customer_name}`,
    text: [
      'New template purchase',
      '',
      `Order ID: ${orderId}`,
      `Customer: ${orderDetails.customer_name}`,
      `Email: ${orderDetails.customer_email}`,
      '',
      'Templates:',
      ...downloadLines,
      '',
      `Total: ₹${orderDetails.total_amount.toLocaleString('en-IN')}`,
    ].join('\n'),
  });
}

async function sendShopOrderEmails(
  orderDetails: {
    customer_name: string;
    customer_email: string;
    customer_phone?: string;
    shipping_address?: string;
    total_amount: number;
  },
  orderId: string,
  cartItems: Array<{
    product_name: string;
    product_price: number;
    quantity: number;
  }>,
): Promise<void> {
  const contactTo = getStudioNotificationEmail();

  const itemLines = cartItems.map((item) => {
    const lineTotal = item.product_price * item.quantity;
    return `• ${item.product_name} × ${item.quantity} — ₹${lineTotal.toLocaleString('en-IN')}`;
  });

  const text = [
    `Hi ${orderDetails.customer_name},`,
    '',
    'Thank you for your order from Goofy n Grumpy!',
    '',
    `Order ID: ${orderId}`,
    '',
    'Items:',
    ...itemLines,
    '',
    `Total paid: ₹${orderDetails.total_amount.toLocaleString('en-IN')}`,
    '',
    `Shipping address:`,
    orderDetails.shipping_address || '—',
    '',
    `Phone: ${orderDetails.customer_phone || '—'}`,
    '',
    'We will prepare your order and share shipping updates soon.',
    '',
    '— Goofy n Grumpy Studio',
  ].join('\n');

  const htmlItems = itemLines
    .map((line) => `<li style="margin-bottom:6px">${escapeHtml(line.replace(/^• /, ''))}</li>`)
    .join('');

  const html = `
    <div style="font-family:sans-serif;max-width:560px">
      <h2 style="color:#0D2B52;margin:0 0 12px">Order confirmed</h2>
      <p>Hi ${escapeHtml(orderDetails.customer_name)},</p>
      <p>Thank you for your order! Here are your details:</p>
      <p><strong>Order ID:</strong> ${escapeHtml(orderId)}</p>
      <ul style="padding-left:18px">${htmlItems}</ul>
      <p><strong>Total paid:</strong> ₹${orderDetails.total_amount.toLocaleString('en-IN')}</p>
      <p><strong>Shipping address:</strong><br/>${escapeHtml(orderDetails.shipping_address || '—').replaceAll('\n', '<br/>')}</p>
      <p><strong>Phone:</strong> ${escapeHtml(orderDetails.customer_phone || '—')}</p>
      <p style="margin-top:16px">We will prepare your order and share shipping updates soon.</p>
      <p style="color:#888;font-size:12px">— Goofy n Grumpy Studio</p>
    </div>
  `;

  await sendTransactionalEmail({
    to: [orderDetails.customer_email],
    subject: 'Your Goofy n Grumpy order is confirmed',
    text,
    html,
  });

  await sendTransactionalEmail({
    to: [contactTo],
    subject: `New shop order — ${orderDetails.customer_name}`,
    text: [
      'New shop order received',
      '',
      `Order ID: ${orderId}`,
      `Customer: ${orderDetails.customer_name}`,
      `Email: ${orderDetails.customer_email}`,
      `Phone: ${orderDetails.customer_phone || '—'}`,
      '',
      'Items:',
      ...itemLines,
      '',
      `Total: ₹${orderDetails.total_amount.toLocaleString('en-IN')}`,
      '',
      'Shipping address:',
      orderDetails.shipping_address || '—',
    ].join('\n'),
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      order_details,
      cart_items,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Razorpay fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!razorpayKeySecret || !supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing required environment variables');
    }

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = await hmacSha256Hex(razorpayKeySecret, text);

    if (expectedSignature !== razorpay_signature) {
      console.error('Payment signature verification failed');
      return new Response(JSON.stringify({ success: false, error: 'Invalid payment signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const isWorkshopOrder =
      order_details.order_type === 'workshop' ||
      (Array.isArray(cart_items) &&
        cart_items.length > 0 &&
        cart_items.every((item: { product_id: number; product_name?: string }) =>
          isWorkshopItem(item)
        ));

    const physicalProductIds = (cart_items ?? [])
      .filter((item: { product_id: number; product_name?: string }) =>
        item.product_id !== CUSTOM_POT_PRODUCT_ID &&
        !isWorkshopItem(item)
      )
      .map((item: { product_id: number }) => item.product_id);

    const templateProductMap = new Map<number, { name: string; template_pdf_url: string }>();
    if (physicalProductIds.length > 0) {
      const { data: cartProducts, error: cartProductsError } = await supabase
        .from('products')
        .select('id, name, template_pdf_url, is_template')
        .in('id', physicalProductIds);

      if (cartProductsError) {
        console.error('Error loading cart products for template delivery:', cartProductsError);
      }

      for (const product of cartProducts ?? []) {
        const hasPdf = Boolean(product.template_pdf_url?.trim());
        const isTemplateProduct = product.is_template === true || hasPdf;
        if (isTemplateProduct && hasPdf) {
          templateProductMap.set(product.id, {
            name: product.name,
            template_pdf_url: product.template_pdf_url!,
          });
        }
      }
    }

    const isTemplateOrder =
      order_details.order_type === 'template' ||
      (Array.isArray(cart_items) &&
        cart_items.length > 0 &&
        cart_items.every((item: { product_id: number; product_name?: string }) => {
          if (isWorkshopItem(item)) return false;
          if (item.product_id === CUSTOM_POT_PRODUCT_ID) return false;
          return templateProductMap.has(item.product_id);
        }));

    for (const item of cart_items ?? []) {
      if (!isWorkshopItem(item)) continue;

      const booking = resolveWorkshopBookingFromCartLine(
        item as { product_name: string; workshop_booking?: WorkshopBookingRecord },
      );
      if (!booking) {
        throw new Error('Workshop booking details are incomplete.');
      }

      const participants =
        (item as { workshop_booking?: WorkshopBookingRecord }).workshop_booking?.participants ??
        booking.participants;

      const policyError = validateWorkshopBookingPolicy(
        booking.scheduleId,
        item.quantity,
        booking.sessionDate,
      );
      if (policyError) {
        throw new Error(policyError);
      }

      const validationError = validateWorkshopBooking(
        booking.scheduleId,
        item.quantity,
        participants as WorkshopBookingRecord['participants'],
      );
      if (validationError) {
        throw new Error(validationError);
      }

      const seatsNeeded = getRequiredParticipantCount(booking.scheduleId, item.quantity);

      const { error: ensureSessionError } = await supabase.rpc('ensure_workshop_session', {
        p_schedule_id: booking.scheduleId,
        p_session_date: booking.sessionDate,
        p_slot: booking.slot,
      });

      if (ensureSessionError) {
        console.error('ensure_workshop_session failed:', ensureSessionError);
        throw new Error(`Could not reserve workshop session: ${ensureSessionError.message}`);
      }

      const { data: availability, error: availabilityError } = await supabase.rpc(
        'get_workshop_session_availability',
        {
          p_schedule_id: booking.scheduleId,
          p_session_date: booking.sessionDate,
          p_slot: booking.slot,
        },
      );

      if (availabilityError) {
        throw new Error('Could not verify workshop availability.');
      }

      const row = Array.isArray(availability) ? availability[0] : availability;
      if (!row?.is_active) {
        throw new Error('This workshop session is no longer available.');
      }
      if ((row.remaining ?? 0) < seatsNeeded) {
        throw new Error('Not enough spots remain for this workshop session.');
      }
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: order_details.user_id,
        customer_name: order_details.customer_name,
        customer_email: order_details.customer_email,
        customer_phone: order_details.customer_phone || null,
        shipping_address: order_details.shipping_address,
        billing_address: order_details.billing_address || order_details.shipping_address,
        total_amount: order_details.total_amount,
        status: 'confirmed',
        payment_status: 'paid',
        payment_method: 'razorpay',
        notes: `Razorpay Payment ID: ${razorpay_payment_id}, Order ID: ${razorpay_order_id}${isWorkshopOrder ? ' | Workshop booking' : ''}${isTemplateOrder ? ' | Template download' : ''}`,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error('Failed to create order');
    }

    const orderItems = cart_items.map((item: {
      product_id: number;
      product_name: string;
      product_image: string;
      product_price: number;
      quantity: number;
      custom_design?: unknown;
      workshop_booking?: WorkshopBookingRecord;
    }) => {
      const row: Record<string, unknown> = {
        order_id: order.id,
        product_id: resolveOrderItemProductId(item, CUSTOM_POT_PRODUCT_ID),
        product_name: item.product_name,
        product_image: item.product_image,
        product_price: item.product_price,
        quantity: item.quantity,
        subtotal: item.product_price * item.quantity + getWorkshopAddonTotal(item.workshop_booking),
      };
      if (item.custom_design != null) {
        row.custom_design = item.custom_design;
      }
      if (isWorkshopCartItem(item)) {
        const resolved = resolveWorkshopBookingFromCartLine(item);
        if (resolved) {
          row.workshop_booking = {
            ...(item.workshop_booking ?? {}),
            scheduleId: resolved.scheduleId,
            sessionDate: resolved.sessionDate,
            slot: resolved.slot,
            participants: resolved.participants ?? item.workshop_booking?.participants ?? [],
            addOns: resolved.addOns ?? item.workshop_booking?.addOns,
          };
        }
      } else if (item.workshop_booking != null) {
        row.workshop_booking = item.workshop_booking;
      }
      return row;
    });

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      throw new Error('Failed to create order items');
    }

    if (isWorkshopOrder) {
      const { error: syncSessionsError } = await supabase.rpc('sync_workshop_sessions_from_orders');
      if (syncSessionsError) {
        console.error('Error syncing workshop sessions from orders:', syncSessionsError);
      }
    }

    const { error: cartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', order_details.user_id);

    if (cartError) {
      console.error('Error clearing cart:', cartError);
    }

    for (const item of cart_items) {
      if (
        item.product_id === CUSTOM_POT_PRODUCT_ID ||
        (item.product_id >= WORKSHOP_CART_ID_MIN && item.product_id <= WORKSHOP_CART_ID_MAX) ||
        String(item.product_name ?? '').startsWith('Custom Pot') ||
        String(item.product_name ?? '').startsWith('Workshop —') ||
        templateProductMap.has(item.product_id)
      ) {
        continue;
      }

      const { error: stockError } = await supabase.rpc('update_product_stock', {
        p_product_id: item.product_id,
        p_quantity_change: -item.quantity,
        p_movement_type: 'sale',
        p_notes: `Order ${order.id} - ${item.product_name}`,
      });

      if (stockError) {
        console.error('Error updating stock for product:', item.product_id, stockError);
      }
    }

    const orderMetadataUpdate: Record<string, unknown> = {
      address_snapshot: isWorkshopOrder
        ? { type: 'workshop', phone: order_details.customer_phone || '' }
        : isTemplateOrder
          ? { type: 'template', email: order_details.customer_email }
          : {
              address: order_details.shipping_address,
              city: '',
              state: '',
              pincode: '',
              phone: order_details.customer_phone || '',
            },
    };

    if (!isWorkshopOrder && !isTemplateOrder) {
      orderMetadataUpdate.fulfillment_status = 'pending';
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(orderMetadataUpdate)
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order metadata:', updateError);
    }

    const buildTemplateItems = () =>
      cart_items
        .filter((item: { product_id: number }) => templateProductMap.has(item.product_id))
        .map((item: { product_id: number }) => {
          const product = templateProductMap.get(item.product_id)!;
          return {
            product_name: product.name,
            template_pdf_url: product.template_pdf_url,
          };
        });

    if (isWorkshopOrder) {
      try {
        await sendWorkshopEmails(order_details, order.id, cart_items);
      } catch (emailError) {
        console.error('Workshop confirmation email failed (order still confirmed):', emailError);
      }
      await finalizeDigitalOrderStatus(supabase, order.id, 'workshop_confirmed');
    } else if (isTemplateOrder) {
      try {
        await sendTemplateEmails(order_details, order.id, buildTemplateItems());
      } catch (emailError) {
        console.error('Template email failed (order still confirmed):', emailError);
      }
      await finalizeDigitalOrderStatus(supabase, order.id, 'template_delivered');
    } else {
      try {
        const shiprocketResponse = await fetch(`${supabaseUrl}/functions/v1/shiprocket-create-order`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${supabaseServiceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ order_id: order.id }),
        });

        if (!shiprocketResponse.ok) {
          console.error('Failed to create Shiprocket shipment:', await shiprocketResponse.text());
        }
      } catch (shiprocketError) {
        console.error('Error creating Shiprocket shipment:', shiprocketError);
      }

      try {
        await sendShopOrderEmails(
          {
            customer_name: order_details.customer_name,
            customer_email: order_details.customer_email,
            customer_phone: order_details.customer_phone,
            shipping_address: order_details.shipping_address,
            total_amount: order_details.total_amount,
          },
          order.id,
          cart_items,
        );
      } catch (emailError) {
        console.error('Shop order confirmation email failed (order still confirmed):', emailError);
      }
    }

    try {
      await syncOrderToGoogleCalendar({
        orderId: order.id,
        orderDetails: {
          customer_name: order_details.customer_name,
          customer_email: order_details.customer_email,
          customer_phone: order_details.customer_phone,
          shipping_address: order_details.shipping_address,
          total_amount: order_details.total_amount,
        },
        cartItems: cart_items,
        isWorkshopOrder,
        isTemplateOrder,
      });
    } catch (calendarError) {
      console.error('Google Calendar sync failed (order still confirmed):', calendarError);
    }

    return new Response(JSON.stringify({
      success: true,
      order_id: order.id,
      payment_verified: true,
      message: isWorkshopOrder
        ? 'Payment verified and workshop booking confirmed'
        : isTemplateOrder
          ? 'Payment verified and template download email sent'
          : 'Payment verified and order created successfully',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in verify-razorpay-payment function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
