import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getStudioNotificationEmail, sendTransactionalEmail } from "../_shared/email.ts";
import { finalizeDigitalOrderStatus } from "../_shared/orderStatus.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

function escapeHtml(input: string) {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing required environment variables');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    });

    const { order_id } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ success: false, error: 'order_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, customer_name, customer_email, total_amount, payment_status, shipping_address, notes, address_snapshot, order_items(product_id, product_name)')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    const isOrderOwner = order.user_id === userData.user.id;
    const isTemplate =
      order.shipping_address?.includes('Digital template') ||
      order.notes?.includes('Template download') ||
      (typeof order.address_snapshot === 'object' &&
        order.address_snapshot !== null &&
        (order.address_snapshot as { type?: string }).type === 'template');

    if (!isAdmin && !isOrderOwner) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isAdmin && !isTemplate) {
      return new Response(JSON.stringify({ success: false, error: 'This order is not a template purchase' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (order.payment_status !== 'paid') {
      throw new Error('Order payment is not completed');
    }

    const productIds = (order.order_items ?? []).map((item: { product_id: number }) => item.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('id, name, template_pdf_url, is_template')
      .in('id', productIds);

    const templateItems = (products ?? [])
      .filter((product) => product.template_pdf_url?.trim())
      .map((product) => ({
        product_name: product.name,
        template_pdf_url: product.template_pdf_url!,
      }));

    if (templateItems.length === 0) {
      throw new Error('No template PDF links found for this order');
    }

    const contactTo = getStudioNotificationEmail();

    const downloadLines = templateItems.map(
      (item) => `• ${item.product_name}: ${item.template_pdf_url}`,
    );

    const text = [
      `Hi ${order.customer_name},`,
      '',
      'Thank you for your purchase from Goofy n Grumpy!',
      '',
      `Order ID: ${order.id}`,
      '',
      'Your template PDF download links:',
      ...downloadLines,
      '',
      `Total paid: ₹${order.total_amount.toLocaleString('en-IN')}`,
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
        <p>Hi ${escapeHtml(order.customer_name)},</p>
        <p>Thank you for your purchase! Here are your template PDF download links:</p>
        <p><strong>Order ID:</strong> ${escapeHtml(order.id)}</p>
        <ul style="padding-left:18px">${htmlDownloads}</ul>
        <p><strong>Total paid:</strong> ₹${order.total_amount.toLocaleString('en-IN')}</p>
        <p style="margin-top:16px">Save these links for future access to your templates.</p>
        <p style="color:#888;font-size:12px">— Goofy n Grumpy Studio</p>
      </div>
    `;

    await sendTransactionalEmail({
      to: [order.customer_email],
      subject: 'Your Goofy n Grumpy template download',
      text,
      html,
    });

    await sendTransactionalEmail({
      to: [contactTo],
      subject: `Template email resent — ${order.customer_name}`,
      text: [
        isAdmin ? 'Template download email resent by admin' : 'Template download email resent by customer',
        '',
        `Order ID: ${order.id}`,
        `Customer: ${order.customer_name}`,
        `Email: ${order.customer_email}`,
        '',
        'Templates:',
        ...downloadLines,
      ].join('\n'),
    });

    await finalizeDigitalOrderStatus(supabase, order.id, 'template_delivered');

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in resend-template-email:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
