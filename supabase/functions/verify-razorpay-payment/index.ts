import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { createHash } from "https://deno.land/std@0.190.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      order_details,
      cart_items 
    } = await req.json();

    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!razorpayKeySecret || !supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing required environment variables');
    }

    // Verify payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = createHash("sha256")
      .update(text, "utf8")
      .update(razorpayKeySecret, "utf8")
      .toString("hex");

    if (expectedSignature !== razorpay_signature) {
      console.error('Payment signature verification failed');
      throw new Error('Invalid payment signature');
    }

    console.log('Payment signature verified successfully');

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Create order in database
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

    // Create order items
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

    // Clear user's cart
    const { error: cartError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', order_details.user_id);

    if (cartError) {
      console.error('Error clearing cart:', cartError);
      // Don't throw error as order is already created
    }

    // Update product stock
    for (const item of cart_items) {
      const { error: stockError } = await supabase.rpc('update_product_stock', {
        p_product_id: item.product_id,
        p_quantity_change: -item.quantity,
        p_movement_type: 'sale',
        p_notes: `Order ${order.id} - ${item.product_name}`
      });

      if (stockError) {
        console.error('Error updating stock for product:', item.product_id, stockError);
        // Continue with other products
      }
    }

    console.log('Order created successfully:', order.id);

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
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});