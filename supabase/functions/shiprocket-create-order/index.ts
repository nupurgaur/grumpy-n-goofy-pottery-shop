import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShiprocketAuthResponse {
  token: string;
  token_type: string;
  expires_in: number;
}

interface ShiprocketOrderRequest {
  order_id: string;
  pickup_location: string; // Changed from object to string (alias)
  shipping_is_billing: boolean;
  order_date: string;
  //channel_id: string;
  comment: string;
  billing_customer_name: string;
  billing_last_name: string;
  billing_address: string;
  billing_address_2: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  billing_alternate_phone: string;
  shipping_customer_name: string;
  shipping_last_name: string;
  shipping_address: string;
  shipping_address_2: string;
  shipping_city: string;
  shipping_pincode: string;
  shipping_country: string;
  shipping_state: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_alternate_phone: string;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount: number;
    tax: number;
    hsn: string;
  }>;
  payment_method: string;
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

interface ShiprocketOrderResponse {
  order_id: number;
  status: string;
  status_code: number;
  on_hold: boolean;
  on_hold_until: string | null;
  awb_codes: string[];
  courier_company_id: number;
  courier_name: string;
}

async function getShiprocketToken(): Promise<string> {
  const email = Deno.env.get('SHIPROCKET_EMAIL')
  const password = Deno.env.get('SHIPROCKET_PASSWORD')
  
  if (!email || !password) {
    throw new Error('Shiprocket credentials not configured')
  }

  const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  })

  if (!response.ok) {
    throw new Error(`Shiprocket auth failed: ${response.statusText}`)
  }

  const data: ShiprocketAuthResponse = await response.json()
  return data.token
}

async function createShiprocketOrder(token: string, orderData: ShiprocketOrderRequest): Promise<ShiprocketOrderResponse> {
  const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Shiprocket order creation failed: ${response.statusText} - ${errorText}`)
  }

  return await response.json()
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { order_id } = await req.json()

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get order details from database
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            weight_grams,
            length_cm,
            width_cm,
            height_cm,
            hsn
          )
        )
      `)
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if order already has Shiprocket order ID
    if (order.shiprocket_order_id) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Order already has Shiprocket shipment',
          shiprocket_order_id: order.shiprocket_order_id 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse shipping address
    let shippingAddress
    try {
      shippingAddress = typeof order.shipping_address === 'string' 
        ? JSON.parse(order.shipping_address) 
        : order.shipping_address
    } catch {
      // Fallback to parsing as simple string
      shippingAddress = {
        address: order.shipping_address,
        city: '',
        state: '',
        pincode: '',
        phone: order.customer_phone || ''
      }
    }

    // Calculate package dimensions and weight
    let totalWeight = 0
    let maxLength = 0
    let maxWidth = 0
    let maxHeight = 0

    order.order_items.forEach((item: any) => {
      const product = item.products
      if (product) {
        totalWeight += (product.weight_grams || 0) * item.quantity
        maxLength = Math.max(maxLength, product.length_cm || 0)
        maxWidth = Math.max(maxWidth, product.width_cm || 0)
        maxHeight = Math.max(maxHeight, product.height_cm || 0)
      }
    })

    // Default dimensions if not set
    if (totalWeight === 0) totalWeight = 500 // 500g default
    if (maxLength === 0) maxLength = 20
    if (maxWidth === 0) maxWidth = 15
    if (maxHeight === 0) maxHeight = 10

    // Get Shiprocket token
    const token = await getShiprocketToken()

    // Prepare Shiprocket order data
    const shiprocketOrderData: ShiprocketOrderRequest = {
      order_id: order.id,
      pickup_location: "Primary", // Use Mumbai as pickup location
      shipping_is_billing: !order.billing_address || order.billing_address === order.shipping_address,
      order_date: order.created_at,
     // channel_id: "1", // Default channel
      comment: order.notes || "",
      billing_customer_name: order.customer_name,
      billing_last_name: "",
      billing_address: shippingAddress.address || order.shipping_address,
      billing_address_2: "",
      billing_city: shippingAddress.city || "Mumbai", // Default city
      billing_pincode: shippingAddress.pincode || 400055, // Default pincode
      billing_state: shippingAddress.state || "Maharashtra", // Default state
      billing_country: "India",
      billing_email: order.customer_email,
      billing_phone: order.customer_phone || 9910780619, // Default phone
      billing_alternate_phone: "",
      shipping_customer_name: order.customer_name,
      shipping_last_name: "",
      shipping_address: shippingAddress.address || order.shipping_address,
      shipping_address_2: "",
      shipping_city: shippingAddress.city || "", // Use customer's city
      shipping_pincode: shippingAddress.pincode || "", // Use customer's pincode
      shipping_country: "India",
      shipping_state: shippingAddress.state || "", // Use customer's state
      shipping_email: order.customer_email,
      shipping_phone: order.customer_phone || "", // Use customer's phone
      shipping_alternate_phone: "",
      order_items: order.order_items.map((item: any) => ({
        name: item.product_name,
        sku: `SKU-${item.product_id}`,
        units: item.quantity,
        selling_price: item.product_price,
        discount: 0,
        tax: 0, // Calculate tax if needed
        hsn: item.products?.hsn || "6911" // Default pottery HSN code
      })),
      payment_method: order.payment_method === 'razorpay' ? 'Prepaid' : 'COD',
      sub_total: order.total_amount,
      length: maxLength,
      breadth: maxWidth,
      height: maxHeight,
      weight: totalWeight
    }

    // Create Shiprocket order
    const shiprocketResponse = await createShiprocketOrder(token, shiprocketOrderData)

    console.log('Shiprocket response:', JSON.stringify(shiprocketResponse, null, 2))

    // Update order in database
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        shiprocket_order_id: shiprocketResponse.order_id ? shiprocketResponse.order_id.toString() : null,
        fulfillment_status: 'processing',
        address_snapshot: shippingAddress
      })
      .eq('id', order_id)

    if (updateError) {
      console.error('Error updating order:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        shiprocket_order_id: shiprocketResponse.order_id,
        status: shiprocketResponse.status,
        courier_name: shiprocketResponse.courier_name,
        awb_codes: shiprocketResponse.awb_codes
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating Shiprocket order:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create Shiprocket order' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
