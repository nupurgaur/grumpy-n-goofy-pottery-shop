import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

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
      cart_items 
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
      console.error('Expected:', expectedSignature);
      console.error('Received:', razorpay_signature);
      return new Response(JSON.stringify({ success: false, error: 'Invalid payment signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

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
        notes: `Razorpay Payment ID: ${razorpay_payment_id}, Order ID: ${razorpay_order_id}`
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw new Error('Failed to create order');
    }

    const orderItems = cart_items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image,
      product_price: item.product_price,
      quantity: item.quantity,
      subtotal: item.product_price * item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      throw new Error('Failed to create order items');
    }

    const { error: cartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', order_details.user_id);

    if (cartError) {
      console.error('Error clearing cart:', cartError);
    }

    for (const item of cart_items) {
      const { error: stockError } = await supabase.rpc('update_product_stock', {
        p_product_id: item.product_id,
        p_quantity_change: -item.quantity,
        p_movement_type: 'sale',
        p_notes: `Order ${order.id} - ${item.product_name}`
      });

      if (stockError) {
        console.error('Error updating stock for product:', item.product_id, stockError);
      }
    }

    // Update order with fulfillment status and address snapshot
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        fulfillment_status: 'pending',
        address_snapshot: {
          address: order_details.shipping_address,
          city: '',
          state: '',
          pincode: '',
          phone: order_details.customer_phone || ''
        }
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('Error updating order fulfillment status:', updateError);
    }

    // Automatically create Shiprocket shipment (async, don't wait for response)
    try {
      const shiprocketResponse = await fetch(`${supabaseUrl}/functions/v1/shiprocket-create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order_id: order.id })
      });

      if (!shiprocketResponse.ok) {
        console.error('Failed to create Shiprocket shipment:', await shiprocketResponse.text());
      } else {
        console.log('Shiprocket shipment created successfully for order:', order.id);
      }
    } catch (shiprocketError) {
      console.error('Error creating Shiprocket shipment:', shiprocketError);
      // Don't fail the order creation if Shiprocket fails
    }

    return new Response(JSON.stringify({
      success: true,
      order_id: order.id,
      payment_verified: true,
      message: 'Payment verified and order created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in verify-razorpay-payment function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});